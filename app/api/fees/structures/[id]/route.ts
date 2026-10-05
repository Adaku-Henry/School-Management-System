import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFeeRecipients, totalFeeAmount } from "@/lib/notifications";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const item = await prisma.feeStructure.findUnique({ where: { id: params.id }, include: { class: true, stream: true } });
  if (!item) return NextResponse.json({ error: "Fee structure not found." }, { status: 404 });
  return NextResponse.json({ item: { ...item, className: item.class.name, streamName: item.stream?.name } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !FINANCE_ROLES.includes(session.role)) return NextResponse.json({ error: "Only finance staff can update fee structures." }, { status: 403 });

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    if (!body.classId || !body.term || !body.academicYear || !Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Class, term, academic year and a valid fee amount are required." }, { status: 400 });
    }
    const optionalCharges = parseCharges(body.optionalCharges);
    const reminderDays = parseReminderDays(body.reminderDays);
    if (!optionalCharges || !reminderDays) return NextResponse.json({ error: "Optional charges or reminder schedule is invalid." }, { status: 400 });
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: "Enter a valid payment deadline." }, { status: 400 });

    const item = await prisma.feeStructure.update({
      where: { id: params.id },
      data: {
        classId: body.classId,
        streamId: body.streamId || null,
        category: body.category || null,
        term: body.term,
        academicYear: body.academicYear,
        amount,
        optionalCharges: JSON.stringify(optionalCharges),
        dueDate,
        notifyOnCreated: body.notifyOnCreated !== false,
        notifyOnPayment: body.notifyOnPayment !== false,
        minimumBalance: Math.max(0, Number(body.minimumBalance) || 0),
        reminderDays: JSON.stringify(reminderDays),
      },
      include: { class: true, stream: true },
    });

    await prisma.auditLog.create({
      data: { userId: session.userId, action: "FEE_STRUCTURE_UPDATED", details: `${item.id}: ${item.term} ${item.academicYear} ${totalFeeAmount(item)}` },
    });

    if (item.notifyOnCreated) await notifyUpdatedFeeStructure(item);
    return NextResponse.json({ item: { ...item, className: item.class.name, streamName: item.stream?.name } });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to update fee structure." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !FINANCE_ROLES.includes(session.role)) return NextResponse.json({ error: "Only finance staff can remove fee structures." }, { status: 403 });
  try {
    const item = await prisma.feeStructure.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Fee structure not found." }, { status: 404 });
    const payments = await prisma.feePayment.count({ where: { term: item.term, academicYear: item.academicYear, student: { classId: item.classId } } });
    if (payments > 0) return NextResponse.json({ error: "This fee structure is referenced by payment history and cannot be deleted." }, { status: 409 });
    await prisma.feeStructure.delete({ where: { id: params.id } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "FEE_STRUCTURE_DELETED", details: `${item.id}: ${item.term} ${item.academicYear}` } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to delete fee structure." }, { status: 400 });
  }
}

async function notifyUpdatedFeeStructure(item: any) {
  const students = await prisma.studentProfile.findMany({
    where: { classId: item.classId, ...(item.streamId ? { streamId: item.streamId } : {}), ...(item.category ? { category: item.category } : {}) },
    select: { id: true, parentId: true },
  });
  const parentProfiles = await prisma.parentProfile.findMany({ where: { id: { in: students.map((student) => student.parentId).filter(Boolean) } }, select: { id: true, userId: true } });
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "settings" }, select: { schoolName: true } });
  const parentUserIds = students.flatMap((student) => {
    const parent = parentProfiles.find((profile) => profile.id === student.parentId);
    return parent ? [{ studentId: student.id, userId: parent.userId }] : [];
  });
  const schoolName = settings?.schoolName || "School";
  const amount = totalFeeAmount(item);
  await notifyFeeRecipients(prisma, {
    eventKey: `fee-structure-updated:${item.id}:${Date.now()}`,
    eventType: "FEE_UPDATED",
    title: "Fee structure updated",
    messageFor: (name) => `${schoolName}: fees for ${name}, ${item.term} ${item.academicYear}, are now UGX ${amount.toLocaleString()}.`,
    statusMessageFor: (name) => `The fee information for ${name} was updated. View your fee account for details.`,
    href: () => "/fees",
    studentIds: students.map((student) => student.id),
    parentUserIds,
  });
}

function parseCharges(value: unknown) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => ({ name: String(item.name || "Optional charge"), amount: Number(item.amount) }))
      .filter((item) => item.name && Number.isFinite(item.amount) && item.amount >= 0);
  } catch { return null; }
}

function parseReminderDays(value: unknown) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    return [...new Set(parsed.map(Number).filter((day) => Number.isInteger(day) && day >= -365 && day <= 365))].sort((a, b) => b - a);
  } catch { return null; }
}
