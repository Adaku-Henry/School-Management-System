import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function sanitize(u: any) {
  const { password, ...rest } = u;
  return rest;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only the Super Administrator can manage user accounts." }, { status: 403 });
    }
    const items = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items: items.map(sanitize) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only the Super Administrator can create user accounts." }, { status: 403 });
    }
    const body = await req.json();
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json({ error: "Name, email, password and role are required." }, { status: 400 });
    }
    const hashed = await bcrypt.hash(body.password, 10);
    const item = await prisma.user.create({
      data: {
        name: body.name,
        email: String(body.email).toLowerCase().trim(),
        password: hashed,
        role: body.role,
        phone: body.phone || null,
        status: body.status || "ACTIVE",
      },
    });
    return NextResponse.json({ item: sanitize(item) }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create user." }, { status: 400 });
  }
}
