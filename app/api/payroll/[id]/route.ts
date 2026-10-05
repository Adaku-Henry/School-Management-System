import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.payslip.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete." }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const basicSalary = Number(body.basicSalary) || 0;
    const allowances = Number(body.allowances) || 0;
    const deductions = Number(body.deductions) || 0;
    const item = await prisma.payslip.update({
      where: { id: params.id },
      data: {
        teacherId: body.teacherId,
        month: body.month,
        year: body.year,
        basicSalary,
        allowances,
        deductions,
        netSalary: basicSalary + allowances - deductions,
      },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, avatarColor: true, status: true } },
          },
        },
      },
    });
    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update." }, { status: 400 });
  }
}
