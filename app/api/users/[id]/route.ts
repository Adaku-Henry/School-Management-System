import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function sanitize(u: any) {
  const { password, ...rest } = u;
  return rest;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only the Super Administrator can edit user accounts." }, { status: 403 });
    }
    const body = await req.json();
    const data: any = {
      name: body.name,
      email: String(body.email).toLowerCase().trim(),
      role: body.role,
      phone: body.phone || null,
      status: body.status || "ACTIVE",
    };
    if (body.password) data.password = await bcrypt.hash(body.password, 10);
    const item = await prisma.user.update({ where: { id: params.id }, data });
    return NextResponse.json({ item: sanitize(item) });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update user." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only the Super Administrator can delete user accounts." }, { status: 403 });
    }
    if (session.userId === params.id) {
      return NextResponse.json({ error: "You cannot delete your own account while signed in." }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user." }, { status: 400 });
  }
}
