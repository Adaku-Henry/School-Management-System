import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.parentProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } }, children: true },
    orderBy: { id: "desc" },
  });
  const out = items.map((p) => ({
    ...p,
    name: p.user?.name,
    email: p.user?.email,
    phone: p.user?.phone,
    avatarUrl: p.user?.avatarUrl,
    attachments: parseAttachments(p.user?.attachments),
    childrenNames: p.children.map((c) => `${c.firstName} ${c.lastName}`).join(", "),
  }));
  return NextResponse.json({ items: out });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    const password = await bcrypt.hash(body.password || "password123", 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: String(body.email).toLowerCase().trim(),
        password,
        role: "PARENT",
        phone: body.phone || null,
        avatarUrl: body.avatarUrl || null,
        attachments: stringifyAttachments(body.attachments),
      },
    });
    const parent = await prisma.parentProfile.create({
      data: {
        userId: user.id,
        occupation: body.occupation || null,
        relationship: body.relationship || "Guardian",
      },
      include: { user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true } } },
    });

    if (body.studentId) {
      await prisma.studentProfile.update({ where: { id: body.studentId }, data: { parentId: parent.id } });
    }

    return NextResponse.json({ item: parent }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create parent." }, { status: 400 });
  }
}

function parseAttachments(value: string | null | undefined) {
  try { return value ? JSON.parse(value) : []; } catch { return []; }
}

function stringifyAttachments(value: unknown) {
  return Array.isArray(value) && value.length ? JSON.stringify(value) : null;
}
