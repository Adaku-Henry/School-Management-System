import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import BrandedDocument from "@/components/BrandedDocument";
import { prisma } from "@/lib/prisma";

const money = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;
const dateLabel = (value: Date) => value.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

export default async function SubscriptionInvoicePage({ params }: { params: { id: string } }) {
  const invoice = await prisma.subscriptionInvoice.findFirst({
    where: { id: params.id, subscription: { schoolSettingsId: "settings" } },
    include: {
      subscription: { include: { schoolSettings: true, plan: true } },
      payments: { where: { status: "SUCCESS" }, orderBy: { verifiedAt: "desc" }, take: 1 },
    },
  });
  if (!invoice) notFound();

  const payment = invoice.payments[0];
  const paid = invoice.status === "PAID" && payment;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/subscription" className="text-sm text-navy-700 hover:underline">← Back to subscription</Link>
        <PrintButton label={paid ? "Print receipt / Save as PDF" : "Print invoice / Save as PDF"} />
      </div>

      <BrandedDocument settings={invoice.subscription.schoolSettings} documentType={paid ? "RECEIPTS" : "INVOICES"} title={paid ? "Payment receipt" : "Subscription invoice"}>
        <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-navy-600">EduManage</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{paid ? "Payment receipt" : "Subscription invoice"}</h1>
            <p className="mt-1 text-sm text-slate-500">School Management Platform</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-semibold text-navy-900">{paid ? payment.receiptNumber : invoice.invoiceNumber}</p>
            <span className={paid ? "badge-green" : invoice.status === "CANCELLED" ? "badge-red" : "badge-yellow"}>{paid ? "PAID" : invoice.status}</span>
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase text-slate-400">Billed to</p><p className="mt-1 font-semibold text-navy-900">{invoice.subscription.schoolSettings.schoolName}</p><p className="text-sm text-slate-600">{invoice.subscription.schoolSettings.email || ""}</p></div>
          <div className="sm:text-right"><p className="text-xs font-semibold uppercase text-slate-400">Invoice date</p><p className="mt-1 text-sm text-slate-700">{dateLabel(invoice.createdAt)}</p><p className="text-xs text-slate-500">Due {dateLabel(invoice.dueDate)}</p></div>
        </section>

        <div className="overflow-x-auto">
          <table className="table-base w-full"><thead><tr><th>Description</th><th>Billing period</th><th className="text-right">Amount</th></tr></thead>
            <tbody><tr><td>{invoice.planName} · {invoice.billingCycle}</td><td>{dateLabel(invoice.periodStart)} – {dateLabel(invoice.periodEnd)}</td><td className="text-right font-semibold">{money(invoice.amount, invoice.currency)}</td></tr></tbody>
            <tfoot><tr><td colSpan={2} className="text-right font-bold">Total</td><td className="text-right text-lg font-bold text-navy-900">{money(invoice.amount, invoice.currency)}</td></tr></tfoot>
          </table>
        </div>

        {payment && <section className="grid gap-4 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
          <div><p className="text-xs uppercase text-slate-400">Payment method</p><p className="text-sm font-semibold text-navy-800">{payment.method.replaceAll("_", " ")}</p></div>
          <div><p className="text-xs uppercase text-slate-400">Transaction reference</p><p className="text-sm font-semibold text-navy-800">{payment.transactionReference || payment.providerReference || "—"}</p></div>
          <div><p className="text-xs uppercase text-slate-400">Payer</p><p className="text-sm text-slate-700">{payment.payerName || "—"}</p></div>
          <div><p className="text-xs uppercase text-slate-400">Payment verified</p><p className="text-sm text-slate-700">{payment.verifiedAt ? dateLabel(payment.verifiedAt) : "—"}</p></div>
        </section>}

        <p className="border-t border-slate-200 pt-5 text-sm text-slate-500">{paid ? "Thank you for choosing EduManage." : "This invoice does not activate a subscription. Activation occurs after payment verification."}</p>
        </div>
      </BrandedDocument>
    </div>
  );
}