import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSubscription, formatInvoiceNumber, getBillingPeriod } from "@/lib/subscriptions";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Only school administrators can submit subscription payments." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const planCode = String(body.planCode || "").toUpperCase();
    const billingCycle = body.billingCycle;
    const method = body.method;
    const transactionReference = String(body.transactionReference || "").trim();
    const payerName = String(body.payerName || "").trim();
    const payerPhone = String(body.payerPhone || "").trim();
    const claimedPaymentAt = new Date(body.paymentDate);
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";

    if (!planCode || !["MONTHLY", "YEARLY"].includes(billingCycle)) {
      return NextResponse.json({ error: "Choose a plan and billing cycle." }, { status: 400 });
    }
    if (!["MTN_MOMO", "BANK_TRANSFER"].includes(method)) {
      return NextResponse.json({ error: "Choose MTN Mobile Money or bank transfer." }, { status: 400 });
    }
    if (!transactionReference || !payerName || !body.paymentDate || Number.isNaN(claimedPaymentAt.getTime())) {
      return NextResponse.json({ error: "Transaction reference, payer name and payment date are required for manual verification." }, { status: 400 });
    }
    if (method === "MTN_MOMO" && !payerPhone) {
      return NextResponse.json({ error: "Enter the MTN number used for payment." }, { status: 400 });
    }
    if (transactionReference.length > 100) {
      return NextResponse.json({ error: "Transaction references must be 100 characters or fewer." }, { status: 400 });
    }
    if (claimedPaymentAt > new Date()) {
      return NextResponse.json({ error: "Payment date cannot be in the future." }, { status: 400 });
    }
    if (evidenceUrl && !/^\/api\/uploads\/[0-9a-f-]{36}$/i.test(evidenceUrl)) {
      return NextResponse.json({ error: "Payment evidence must be uploaded through EduManage." }, { status: 400 });
    }
    if (method === "BANK_TRANSFER" && !evidenceUrl) {
      return NextResponse.json({ error: "Upload bank transfer evidence so an administrator can verify the payment." }, { status: 400 });
    }

    const snapshot = await ensureSubscription();
    const plan = snapshot.plans.find((item) => item.code === planCode);
    if (!plan) return NextResponse.json({ error: "That subscription plan is unavailable." }, { status: 404 });
    const amount = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Enterprise pricing is arranged directly with EduManage." }, { status: 400 });
    }

    const now = new Date();
    const periodStart = snapshot.subscription.status === "ACTIVE" && snapshot.subscription.endsAt && snapshot.subscription.endsAt > now
      ? snapshot.subscription.endsAt
      : now;
    const periodEnd = getBillingPeriod(periodStart, billingCycle);
    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.subscriptionInvoice.create({
        data: {
          subscriptionId: snapshot.subscription.id,
          planId: plan.id,
          invoiceNumber: formatInvoiceNumber(now),
          planName: plan.name,
          billingCycle,
          amount,
          periodStart,
          periodEnd,
          dueDate: now,
        },
      });
      return tx.subscriptionPayment.create({
        data: {
          subscriptionId: snapshot.subscription.id,
          invoiceId: invoice.id,
          amount,
          method,
          status: "REQUIRES_VERIFICATION",
          transactionReference,
          payerName,
          payerPhone: payerPhone || null,
          claimedPaymentAt,
          evidenceUrl: evidenceUrl || null,
        },
      });
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That transaction reference has already been submitted." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to submit payment." }, { status: 400 });
  }
}