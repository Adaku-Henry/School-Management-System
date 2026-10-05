import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.teacherProfile.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } }, subjects: { include: { subject: true } }, streams: true, payslips: { orderBy: { generatedAt: "desc" } } },
  });
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const teacher = await prisma.teacherProfile.findUnique({ where: { id: params.id } });
    if (!teacher) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        name: body.name,
        email: String(body.email).toLowerCase().trim(),
        phone: body.phone || null,
        avatarUrl: body.avatarUrl || null,
        attachments: Array.isArray(body.attachments) && body.attachments.length ? JSON.stringify(body.attachments) : null,
      },
    });

    const updated = await prisma.teacherProfile.update({
      where: { id: params.id },
      data: {
        employeeId: body.employeeId,
        qualification: body.qualification || null,
        experience: body.experience || null,
        salary: body.salary ? Number(body.salary) : 0,
      },
      include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } } },
    });

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update teacher." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teacher = await prisma.teacherProfile.findUnique({ where: { id: params.id } });
    if (!teacher) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await prisma.teacherProfile.delete({ where: { id: params.id } });
    await prisma.user.delete({ where: { id: teacher.userId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "This teacher is linked to other records (e.g. a stream) and cannot be deleted until unlinked." }, { status: 400 });
  }
}
