import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFeeRecipients, totalFeeAmount } from "@/lib/notifications";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const item = await prisma.feePayment.findUnique({
    where: { id: params.id },
    include: { student: { include: { class: true, stream: true, parent: true } }, recordedBy: { select: { id: true, name: true } } },
  });
  if (!item) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  const authorized = FINANCE_ROLES.includes(session.role)
    || (session.role === "STUDENT" && item.student.userId === session.userId)
    || (session.role === "PARENT" && item.student.parent?.userId === session.userId);
  if (!authorized) return NextResponse.json({ error: "You do not have access to this receipt." }, { status: 403 });
  return NextResponse.json({ item });
}

export async function PUT() {
  return NextResponse.json({ error: "Confirmed payments cannot be edited. Void and reverse the payment, then record a correction." }, { status: 409 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Confirmed payments and receipts cannot be deleted. Void and reverse the payment instead." }, { status: 409 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !FINANCE_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Only finance staff can reverse fee payments." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const reason = String(body.reason || "").trim();
    if (!reason) return NextResponse.json({ error: "Enter a reason for reversing this payment." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const original = await tx.feePayment.findUnique({
        where: { id: params.id },
        include: { student: { include: { class: true, stream: true, parent: true } } },
      });
      if (!original) throw new Error("Receipt not found.");
      if (original.status !== "SUCCESS" || original.method === "REVERSAL" || original.amount <= 0) throw new Error("Only confirmed payments can be reversed, and each payment can be reversed once.");

      const term = original.term || "";
      const academicYear = original.academicYear || String(new Date(original.date).getFullYear());
      const feeStructure = original.student.classId ? await tx.feeStructure.findFirst({
        where: { classId: original.student.classId, term, academicYear, OR: [{ streamId: original.student.streamId }, { streamId: null }] },
        orderBy: { id: "desc" },
      }) : null;
      const paidWithoutOriginal = await tx.feePayment.aggregate({
        where: { studentId: original.studentId, term: original.term, academicYear: original.academicYear, status: "SUCCESS", id: { not: original.id } },
        _sum: { amount: true },
      });
      const totalFees = feeStructure ? totalFeeAmount(feeStructure) : 0;
      const remainingAfterReversal = Math.max(0, totalFees - Number(paidWithoutOriginal._sum.amount || 0));
      const balanceBeforeReversal = Math.max(0, remainingAfterReversal - original.amount);
      const year = academicYear.replace(/\D/g, "").slice(0, 4) || String(new Date().getFullYear());
      const reversalNumber = `REV-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;

      await tx.feePayment.update({
        where: { id: original.id },
        data: { status: "VOIDED", voidedAt: new Date(), voidReason: reason },
      });
      const reversal = await tx.feePayment.create({
        data: {
          studentId: original.studentId,
          amount: -original.amount,
          totalFees: original.totalFees,
          method: "REVERSAL",
          receiptNumber: reversalNumber,
          term: original.term,
          academicYear: original.academicYear,
          status: "SUCCESS",
          previousBalance: balanceBeforeReversal,
          balanceAfter: remainingAfterReversal,
          recordedById: session.userId,
        },
      });
      await tx.auditLog.create({
        data: { userId: session.userId, action: "FEE_PAYMENT_REVERSED", details: `${original.receiptNumber} -> ${reversalNumber}: ${reason}` },
      });

      if (original.student.parent?.userId) {
        await notifyFeeRecipients(tx, {
          eventKey: `fee-reversal:${reversal.id}`,
          eventType: "PAYMENT_REVERSED",
          title: "Payment reversed",
          messageFor: (name) => `A payment of UGX ${original.amount.toLocaleString()} for ${name} was reversed. Current balance: UGX ${remainingAfterReversal.toLocaleString()}. Reference ${reversalNumber}.`,
          statusMessageFor: (name) => `A fee payment for ${name} was reversed. View the fee account for the current status.`,
          href: () => `/fees/receipts/${reversal.id}`,
          studentIds: [original.studentId],
          parentUserIds: [{ studentId: original.studentId, userId: original.student.parent.userId }],
        });
      }
      return { originalReceipt: original.receiptNumber, reversal, balanceAfter: remainingAfterReversal };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to reverse payment." }, { status: 400 });
  }
}
