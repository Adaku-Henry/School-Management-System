import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSubscription } from "@/lib/subscriptions";

export async function GET() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Only school administrators can manage subscriptions." }, { status: 403 });
  }

  try {
    const snapshot = await ensureSubscription();
    return NextResponse.json({
      subscription: snapshot.subscription,
      plans: snapshot.plans.map((plan) => ({ ...plan, features: parseFeatures(plan.features) })),
      invoices: snapshot.invoices,
      payments: snapshot.payments,
      paymentSettings: {
        mtnReceivingNumber: snapshot.paymentSettings.mtnReceivingNumber,
        mtnMerchantCode: snapshot.paymentSettings.mtnMerchantCode,
        bankName: snapshot.paymentSettings.bankName,
        bankAccountName: snapshot.paymentSettings.bankAccountName,
        bankAccountNumber: snapshot.paymentSettings.bankAccountNumber,
        automaticMtnCollectionEnabled: false,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load subscription information." }, { status: 500 });
  }
}

function parseFeatures(value: string) {
  try { return JSON.parse(value); } catch { return []; }
}