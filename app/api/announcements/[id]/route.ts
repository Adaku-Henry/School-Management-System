import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const item = await prisma.announcement.update({
      where: { id: params.id },
      data: { title: body.title, message: body.message, targetRole: body.targetRole || "ALL" },
      include: { createdBy: true },
    });
    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.announcement.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete." }, { status: 400 });
  }
}
