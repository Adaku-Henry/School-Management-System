import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyFeeRecipients, totalFeeAmount } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let studentIds: string[] | undefined;
  if (session.role === "PARENT") {
    const parent = await prisma.parentProfile.findUnique({ where: { userId: session.userId }, include: { children: { select: { id: true } } } });
    studentIds = parent?.children.map((child) => child.id) || [];
  } else if (session.role === "STUDENT") {
    const student = await prisma.studentProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
    studentIds = student ? [student.id] : [];
  } else if (!["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"].includes(session.role)) {
    return NextResponse.json({ error: "You do not have permission to view fee payments." }, { status: 403 });
  }

  const items = await prisma.feePayment.findMany({
    where: studentIds ? { studentId: { in: studentIds } } : {},
    include: { student: { include: { class: true, stream: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ items: items.map((item) => ({
    ...item,
    studentName: `${item.student.firstName} ${item.student.lastName}`,
    className: item.student.class?.name,
    streamName: item.student.stream?.name,
  })) });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"].includes(session.role)) {
      return NextResponse.json({ error: "Only finance staff can record fee payments." }, { status: 403 });
    }
    const body = await req.json();
    const amount = Number(body.amount);
    if (!body.studentId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Student and amount are required." }, { status: 400 });
    }
    const student = await prisma.studentProfile.findUnique({
      where: { id: body.studentId },
      include: { class: true, stream: true, parent: true },
    });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const settings = await prisma.schoolSettings.findUnique({ where: { id: "settings" } });
    const term = String(body.term || settings?.currentTerm || "Term 1");
    const academicYear = String(body.academicYear || settings?.academicYear || new Date().getFullYear());
    const feeStructure = student.classId ? await prisma.feeStructure.findFirst({
      where: {
        classId: student.classId,
        term,
        academicYear,
        AND: [
          { OR: [{ streamId: student.streamId || undefined }, { streamId: null }] },
          { OR: [{ category: student.category }, { category: null }] },
        ],
      },
      orderBy: { id: "desc" },
    }) : null;
    const totalFees = feeStructure ? totalFeeAmount(feeStructure) : 0;
    const parent = student.parentId
      ? await prisma.parentProfile.findUnique({ where: { id: student.parentId }, select: { userId: true } })
      : null;
    const schoolName = settings?.schoolName || "School";
    const date = body.date ? new Date(body.date) : new Date();
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Enter a valid payment date." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const prior = await tx.feePayment.aggregate({
        where: { studentId: student.id, term, academicYear, status: "SUCCESS" },
        _sum: { amount: true },
      });
      const previousBalance = Math.max(0, totalFees - Number(prior._sum.amount || 0));
      const balanceAfter = Math.max(0, previousBalance - amount);
      const receiptPrefix = `REC-${academicYear}-`;
      const legacyReceipts = await tx.feePayment.findMany({
        where: { receiptNumber: { startsWith: receiptPrefix } },
        select: { receiptNumber: true },
      });
      const maxExistingNumber = legacyReceipts.reduce((max, payment) => {
        const number = Number(payment.receiptNumber.slice(receiptPrefix.length));
        return Number.isSafeInteger(number) ? Math.max(max, number) : max;
      }, 0);
      const sequence = await tx.documentSequence.upsert({
        where: { id: `fee-receipt-${academicYear}` },
        create: { id: `fee-receipt-${academicYear}`, nextValue: maxExistingNumber + 1 },
        update: { nextValue: { increment: 1 } },
      });
      const receiptNumber = `${receiptPrefix}${String(sequence.nextValue).padStart(6, "0")}`;
      const item = await tx.feePayment.create({
        data: {
          studentId: student.id,
          amount,
          totalFees,
          method: body.method || "Cash",
          receiptNumber,
          transactionReference: body.transactionReference ? String(body.transactionReference).trim() : null,
          term,
          academicYear,
          date,
          status: "SUCCESS",
          previousBalance,
          balanceAfter,
          recordedById: session.userId,
        },
        include: { student: { include: { class: true, stream: true } } },
      });

      await tx.auditLog.create({
        data: { userId: session.userId, action: "FEE_PAYMENT_RECORDED", details: `${receiptNumber}: ${student.id} ${amount} ${term} ${academicYear}` },
      });

      if (feeStructure?.notifyOnPayment ?? true) {
        await notifyFeeRecipients(tx, {
          eventKey: `fee-payment:${item.id}`,
          eventType: "PAYMENT_SUCCESS",
          title: "Payment received",
          messageFor: (name) => `UGX ${amount.toLocaleString()} has been received for ${name}. Receipt ${receiptNumber}. Remaining balance: UGX ${balanceAfter.toLocaleString()}. ${schoolName}.`,
          statusMessageFor: (name) => `A payment was received for ${name}. View your fee account for the latest status.`,
          href: (studentId) => `/fees/receipts/${item.id}?studentId=${studentId}`,
          studentIds: [student.id],
          parentUserIds: parent ? [{ studentId: student.id, userId: parent.userId }] : [],
        });
      }

      return { item, balance: { totalFees, paid: Number(prior._sum.amount || 0) + amount, previous: previousBalance, remaining: balanceAfter } };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "That receipt number is already in use." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to record payment." }, { status: 400 });
  }
}
