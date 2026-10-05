import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.payslip.findMany({
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, avatarColor: true, status: true } },
          },
        },
      },
      orderBy: { generatedAt: "desc" },
    });
    const out = items.map((p) => ({ ...p, teacherName: p.teacher?.user?.name }));
    return NextResponse.json({ items: out });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load payslips." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.teacherId || !body.month || !body.year) {
      return NextResponse.json({ error: "Teacher, month and year are required." }, { status: 400 });
    }
    const basicSalary = Number(body.basicSalary) || 0;
    const allowances = Number(body.allowances) || 0;
    const deductions = Number(body.deductions) || 0;
    const item = await prisma.payslip.create({
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
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to generate payslip." }, { status: 400 });
  }
}
