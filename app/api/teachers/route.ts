import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.teacherProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } }, subjects: { include: { subject: true } } },
      orderBy: { hireDate: "desc" },
    });
    const out = items.map((t) => ({
      ...t,
      name: t.user?.name,
      email: t.user?.email,
      phone: t.user?.phone,
      avatarUrl: t.user?.avatarUrl,
      attachments: parseAttachments(t.user?.attachments),
      status: t.user?.status,
      subjectNames: t.subjects.map((s) => s.subject.name).join(", "),
    }));
    return NextResponse.json({ items: out });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load teachers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email || !body.employeeId) {
      return NextResponse.json({ error: "Name, email and employee ID are required." }, { status: 400 });
    }
    const password = await bcrypt.hash(body.password || "password123", 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: String(body.email).toLowerCase().trim(),
        password,
        role: "TEACHER",
        phone: body.phone || null,
        avatarUrl: body.avatarUrl || null,
        attachments: stringifyAttachments(body.attachments),
      },
    });

    const teacher = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        employeeId: body.employeeId,
        qualification: body.qualification || null,
        experience: body.experience || null,
        salary: body.salary ? Number(body.salary) : 0,
      },
      include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } } },
    });

    if (body.subjectId) {
      await prisma.teacherSubject.create({ data: { teacherId: teacher.id, subjectId: body.subjectId } });
    }

    return NextResponse.json({ item: teacher }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A user with that email or employee ID already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create teacher." }, { status: 400 });
  }
}

function parseAttachments(value: string | null | undefined) {
  try { return value ? JSON.parse(value) : []; } catch { return []; }
}

function stringifyAttachments(value: unknown) {
  return Array.isArray(value) && value.length ? JSON.stringify(value) : null;
}
