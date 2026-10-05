import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { password, ...rest } = user;
  return NextResponse.json({ item: { ...rest, attachments: parseAttachments(rest.attachments) } });
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const body = await req.json();
    const data: any = {
      name: body.name,
      phone: body.phone || null,
      avatarUrl: body.avatarUrl || null,
      attachments: stringifyAttachments(body.attachments),
    };

    if (body.newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const valid = await bcrypt.compare(body.currentPassword || "", user.password);
      if (!valid) {
        return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
      }
      data.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updated = await prisma.user.update({ where: { id: session.userId }, data });
    const { password, ...rest } = updated;
    return NextResponse.json({ item: { ...rest, attachments: parseAttachments(rest.attachments) } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 400 });
  }
}

function parseAttachments(value: string | null) {
  try { return value ? JSON.parse(value) : []; } catch { return []; }
}

function stringifyAttachments(value: unknown) {
  return Array.isArray(value) && value.length ? JSON.stringify(value) : null;
}
