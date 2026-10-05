import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addBillingCycle(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export const DEFAULT_SUBSCRIPTION_PLANS = [
  { code: "STARTER", name: "Starter", description: "Core school operations for small schools.", monthlyPrice: 50000, yearlyPrice: 500000, studentLimit: 200, staffLimit: 30, storageLimitMb: 5120, trialDays: 14, features: ["Students", "Attendance", "Academics", "Finance", "Reports"] },
  { code: "PROFESSIONAL", name: "Professional", description: "More capacity and tools for growing schools.", monthlyPrice: 100000, yearlyPrice: 1000000, studentLimit: 500, staffLimit: 75, storageLimitMb: 20480, trialDays: 14, features: ["Starter features", "Examinations", "Communication", "Parent portal"] },
  { code: "BUSINESS", name: "Business", description: "A connected operating system for established schools.", monthlyPrice: 200000, yearlyPrice: 2000000, studentLimit: 1000, staffLimit: 150, storageLimitMb: 51200, trialDays: 14, features: ["Professional features", "Payroll", "Library", "Transport"] },
  { code: "PREMIUM", name: "Premium", description: "Higher capacity and advanced school operations.", monthlyPrice: 350000, yearlyPrice: 3500000, studentLimit: 2000, staffLimit: 300, storageLimitMb: 102400, trialDays: 14, features: ["Business features", "Hostel", "Inventory", "Advanced reports"] },
  { code: "ENTERPRISE", name: "Enterprise", description: "Custom capacity, rollout, and support by agreement.", monthlyPrice: null, yearlyPrice: null, studentLimit: null, staffLimit: null, storageLimitMb: 0, trialDays: 14, features: ["Custom features", "Custom capacity", "Priority support"] },
];

export async function ensureSubscription() {
  const school = await prisma.schoolSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: { id: "settings" },
  });

  for (const plan of DEFAULT_SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {},
      create: { ...plan, features: JSON.stringify(plan.features) },
    });
  }

  await prisma.platformPaymentSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });

  let subscription = await prisma.subscription.findUnique({ where: { schoolSettingsId: school.id } });
  if (!subscription) {
    const starter = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: "STARTER" } });
    const trialStartsAt = new Date();
    subscription = await prisma.subscription.create({
      data: {
        schoolSettingsId: school.id,
        planId: starter.id,
        billingCycle: "TRIAL",
        status: "TRIAL",
        trialStartsAt,
        trialEndsAt: addDays(trialStartsAt, starter.trialDays),
      },
    });
  }

  const now = new Date();
  if (subscription.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt <= now) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "GRACE", graceEndsAt: addDays(subscription.trialEndsAt, 7) },
    });
  } else if (subscription.status === "ACTIVE" && subscription.endsAt && subscription.endsAt <= now) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "GRACE", graceEndsAt: addDays(subscription.endsAt, 7) },
    });
  } else if (subscription.status === "GRACE" && subscription.graceEndsAt && subscription.graceEndsAt <= now) {
    subscription = await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "RESTRICTED" } });
  }

  const [current, plans, paymentSettings, invoices, payments] = await Promise.all([
    prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id }, include: { plan: true } }),
    prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { monthlyPrice: "asc" } }),
    prisma.platformPaymentSettings.findUniqueOrThrow({ where: { id: "platform" } }),
    prisma.subscriptionInvoice.findMany({ where: { subscriptionId: subscription.id }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.subscriptionPayment.findMany({ where: { subscriptionId: subscription.id }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return { subscription: current, plans, paymentSettings, invoices, payments };
}

export function getBillingPeriod(start: Date, cycle: "MONTHLY" | "YEARLY") {
  return addBillingCycle(start, cycle === "YEARLY" ? 12 : 1);
}

export function formatInvoiceNumber(date = new Date()) {
  return `EDU-${date.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function formatReceiptNumber(date = new Date()) {
  return `REC-${date.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}