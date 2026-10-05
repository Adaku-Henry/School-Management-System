import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFeeRecipients, totalFeeAmount } from "@/lib/notifications";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const items = await prisma.feeStructure.findMany({
      include: { class: true, stream: true },
      orderBy: [{ academicYear: "desc" }, { term: "asc" }],
    });
    return NextResponse.json({ items: items.map((item) => ({ ...item, className: item.class.name, streamName: item.stream?.name })) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load fee structures." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !FINANCE_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Only finance staff can configure fee structures." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const classId = String(body.classId || "");
    const term = String(body.term || "");
    const academicYear = String(body.academicYear || "");
    if (!classId || !term || !academicYear || !Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Class, term, academic year and a valid fee amount are required." }, { status: 400 });
    }

    const optionalCharges = normalizeCharges(body.optionalCharges);
    if (!optionalCharges) return NextResponse.json({ error: "Optional charges must be a JSON list of named amounts." }, { status: 400 });
    const reminderDays = normalizeReminderDays(body.reminderDays);
    if (!reminderDays) return NextResponse.json({ error: "Reminder days must be a JSON list, such as [30,14,7,3,0,-7,-14]." }, { status: 400 });
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: "Enter a valid payment deadline." }, { status: 400 });

    const data = {
      classId,
      streamId: body.streamId || null,
      category: body.category || null,
      term,
      academicYear,
      amount,
      optionalCharges: JSON.stringify(optionalCharges),
      dueDate,
      notifyOnCreated: body.notifyOnCreated !== false,
      notifyOnPayment: body.notifyOnPayment !== false,
      minimumBalance: Math.max(0, Number(body.minimumBalance) || 0),
      reminderDays: JSON.stringify(reminderDays),
      reminderChannels: JSON.stringify(["IN_APP"]),
    };

    const [students, settings] = await Promise.all([
      prisma.studentProfile.findMany({
        where: {
          classId,
          ...(data.streamId ? { streamId: data.streamId } : {}),
          ...(data.category ? { category: data.category } : {}),
        },
        select: { id: true, parentId: true },
      }),
      prisma.schoolSettings.findUnique({ where: { id: "settings" }, select: { schoolName: true } }),
    ]);
    const parentProfiles = await prisma.parentProfile.findMany({
      where: { id: { in: students.map((student) => student.parentId).filter((id): id is string => !!id) } },
      select: { id: true, userId: true },
    });
    const parentUserIds = students.flatMap((student) => {
      const parent = parentProfiles.find((profile) => profile.id === student.parentId);
      return parent ? [{ studentId: student.id, userId: parent.userId }] : [];
    });
    const schoolName = settings?.schoolName || "School";

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.feeStructure.create({ data, include: { class: true, stream: true } });
      if (created.notifyOnCreated) {
        const total = totalFeeAmount(created);
        await notifyFeeRecipients(tx, {
          eventKey: `fee-structure:${created.id}`,
          eventType: "FEE_CREATED",
          title: "School fees posted",
          messageFor: (name) => `${schoolName}: fees for ${name}, ${term} ${academicYear}, are UGX ${total.toLocaleString()}.${dueDate ? ` Please pay by ${dueDate.toLocaleDateString()}.` : ""}`,
          statusMessageFor: (name) => `Fees for ${name} have been posted. View your fee account for details.`,
          href: (studentId) => `/students/${studentId}`,
          studentIds: students.map((student) => student.id),
          parentUserIds,
        });
      }
      return created;
    });

    return NextResponse.json({ item: { ...item, className: item.class.name, streamName: item.stream?.name } }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to create fee structure." }, { status: 400 });
  }
}

function normalizeCharges(value: unknown): Array<{ name: string; amount: number }> | null {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((charge) => ({ name: String(charge.name || "Optional charge"), amount: Number(charge.amount) }))
      .filter((charge) => charge.name && Number.isFinite(charge.amount) && charge.amount >= 0);
  } catch {
    return null;
  }
}

function normalizeReminderDays(value: unknown): number[] | null {
  if (!value) return [30, 14, 7, 3, 0, -7, -14];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    return [...new Set(parsed.map(Number).filter((day) => Number.isInteger(day) && day >= -365 && day <= 365))].sort((a, b) => b - a);
  } catch {
    return null;
  }
}