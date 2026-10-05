import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function superAdminOnly() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await superAdminOnly())) {
    return NextResponse.json({ error: "Only the Super Administrator can manage payment settings." }, { status: 403 });
  }
  const settings = await prisma.platformPaymentSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const session = await superAdminOnly();
  if (!session) return NextResponse.json({ error: "Only the Super Administrator can manage payment settings." }, { status: 403 });

  try {
    const body = await req.json();
    const mtnReceivingNumber = String(body.mtnReceivingNumber || "").trim();
    const mtnMerchantCode = String(body.mtnMerchantCode || "").trim();
    const bankName = String(body.bankName || "").trim();
    const bankAccountName = String(body.bankAccountName || "").trim();
    const bankAccountNumber = String(body.bankAccountNumber || "").trim();
    if (!mtnReceivingNumber || !bankName || !bankAccountNumber) {
      return NextResponse.json({ error: "MTN number, bank name and bank account number are required." }, { status: 400 });
    }

    const settings = await prisma.platformPaymentSettings.upsert({
      where: { id: "platform" },
      update: { mtnReceivingNumber, mtnMerchantCode: mtnMerchantCode || null, bankName, bankAccountName, bankAccountNumber },
      create: { id: "platform", mtnReceivingNumber, mtnMerchantCode: mtnMerchantCode || null, bankName, bankAccountName, bankAccountNumber },
    });
    await prisma.auditLog.create({
      data: { userId: session.userId, action: "PLATFORM_PAYMENT_SETTINGS_UPDATED", details: "Receiving account settings updated." },
    });
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to save payment settings." }, { status: 400 });
  }
}