import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.bookLoan.findMany({
      include: { book: true, student: true },
      orderBy: { borrowDate: "desc" },
    });
    const out = items.map((l) => ({
      ...l,
      bookTitle: l.book?.title,
      studentName: l.student ? `${l.student.firstName} ${l.student.lastName}` : "",
      status: l.returnDate ? "Returned" : "Borrowed",
    }));
    return NextResponse.json({ items: out });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load loans." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.bookId || !body.studentId || !body.dueDate) {
      return NextResponse.json({ error: "Book, student and due date are required." }, { status: 400 });
    }
    const book = await prisma.book.findUnique({ where: { id: body.bookId } });
    if (!book || book.available < 1) {
      return NextResponse.json({ error: "No copies of this book are currently available." }, { status: 400 });
    }
    const [item] = await prisma.$transaction([
      prisma.bookLoan.create({
        data: { bookId: body.bookId, studentId: body.studentId, dueDate: new Date(body.dueDate) },
        include: { book: true, student: true },
      }),
      prisma.book.update({ where: { id: body.bookId }, data: { available: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to issue book." }, { status: 400 });
  }
}
