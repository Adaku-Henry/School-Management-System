import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatReceiptNumber } from "@/lib/subscriptions";

async function superAdminOnly() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await superAdminOnly();
  if (!session) return NextResponse.json({ error: "Only the Super Administrator can review platform payments." }, { status: 403 });

  const payments = await prisma.subscriptionPayment.findMany({
    include: {
      invoice: true,
      subscription: {
        include: {
          plan: true,
          schoolSettings: { select: { schoolName: true, email: true, phone: true } },
        },
      },
      verifiedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ payments });
}

export async function POST(req: Request) {
  const session = await superAdminOnly();
  if (!session) return NextResponse.json({ error: "Only the Super Administrator can verify platform payments." }, { status: 403 });

  try {
    const body = await req.json();
    const paymentId = String(body.paymentId || "");
    const action = body.action;
    if (!paymentId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Choose a payment and approve or reject it." }, { status: 400 });
    }
    const rejectionReason = String(body.rejectionReason || "").trim();
    if (action === "REJECT" && !rejectionReason) {
      return NextResponse.json({ error: "Enter a reason for rejecting this payment." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.subscriptionPayment.findUnique({
        where: { id: paymentId },
        include: { invoice: true, subscription: true },
      });
      if (!payment) throw new Error("Payment not found.");
      if (payment.status !== "REQUIRES_VERIFICATION" || !payment.invoice) {
        throw new Error("This payment is no longer awaiting verification.");
      }

      if (action === "REJECT") {
        const rejected = await tx.subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: "REJECTED", rejectionReason, verifiedByUserId: session.userId, verifiedAt: new Date() },
        });
        await tx.subscriptionInvoice.update({ where: { id: payment.invoiceId! }, data: { status: "CANCELLED" } });
        await tx.auditLog.create({
          data: { userId: session.userId, action: "SUBSCRIPTION_PAYMENT_REJECTED", details: `${payment.id}: ${rejectionReason}` },
        });
        return { payment: rejected, activated: false };
      }

      if (payment.amount !== payment.invoice.amount) throw new Error("Payment amount does not match the invoice.");
      const receiptNumber = formatReceiptNumber();
      const verifiedAt = new Date();
      const verified = await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS", receiptNumber, verifiedByUserId: session.userId, verifiedAt },
      });
      await tx.subscriptionInvoice.update({
        where: { id: payment.invoiceId! },
        data: { status: "PAID", paidAt: verifiedAt },
      });
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          planId: payment.invoice.planId,
          billingCycle: payment.invoice.billingCycle,
          status: "ACTIVE",
          startsAt: payment.invoice.periodStart,
          endsAt: payment.invoice.periodEnd,
          graceEndsAt: null,
        },
      });
      await tx.auditLog.create({
        data: { userId: session.userId, action: "SUBSCRIPTION_PAYMENT_APPROVED", details: `${payment.id}: ${receiptNumber}` },
      });
      return { payment: verified, activated: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to verify payment." }, { status: 400 });
  }
}