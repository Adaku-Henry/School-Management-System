import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT is used to mark a loan as returned (increments book availability back).
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const loan = await prisma.bookLoan.findUnique({ where: { id: params.id } });
    if (!loan) return NextResponse.json({ error: "Loan not found." }, { status: 404 });

    const wasReturned = !!loan.returnDate;
    const willReturn = !!body.returnDate;

    const [item] = await prisma.$transaction([
      prisma.bookLoan.update({
        where: { id: params.id },
        data: {
          dueDate: body.dueDate ? new Date(body.dueDate) : loan.dueDate,
          returnDate: body.returnDate ? new Date(body.returnDate) : loan.returnDate,
          fine: body.fine !== undefined ? Number(body.fine) : loan.fine,
        },
        include: { book: true, student: true },
      }),
      ...(!wasReturned && willReturn
        ? [prisma.book.update({ where: { id: loan.bookId }, data: { available: { increment: 1 } } })]
        : []),
    ]);
    return NextResponse.json({ item });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update loan." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const loan = await prisma.bookLoan.findUnique({ where: { id: params.id } });
    if (!loan) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await prisma.$transaction([
      prisma.bookLoan.delete({ where: { id: params.id } }),
      ...(!loan.returnDate
        ? [prisma.book.update({ where: { id: loan.bookId }, data: { available: { increment: 1 } } })]
        : []),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete." }, { status: 400 });
  }
}
