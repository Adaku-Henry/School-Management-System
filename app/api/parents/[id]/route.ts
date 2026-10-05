import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.parentProfile.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } }, children: { include: { class: true, stream: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parent = await prisma.parentProfile.findUnique({ where: { id: params.id } });
    if (!parent) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await prisma.user.update({
      where: { id: parent.userId },
      data: {
        name: body.name,
        email: String(body.email).toLowerCase().trim(),
        phone: body.phone || null,
        avatarUrl: body.avatarUrl || null,
        attachments: Array.isArray(body.attachments) && body.attachments.length ? JSON.stringify(body.attachments) : null,
      },
    });

    const updated = await prisma.parentProfile.update({
      where: { id: params.id },
      data: { occupation: body.occupation || null, relationship: body.relationship || "Guardian" },
      include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } } },
    });

    if (body.studentId) {
      await prisma.studentProfile.update({ where: { id: body.studentId }, data: { parentId: parent.id } });
    }

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update parent." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parent = await prisma.parentProfile.findUnique({ where: { id: params.id } });
    if (!parent) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await prisma.parentProfile.delete({ where: { id: params.id } });
    await prisma.user.delete({ where: { id: parent.userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete parent." }, { status: 400 });
  }
}
