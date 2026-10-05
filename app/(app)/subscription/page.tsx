"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FileUploadField from "@/components/FileUploadField";
import Icon from "@/components/Icon";

type SubscriptionData = {
  subscription: any;
  plans: any[];
  invoices: any[];
  payments: any[];
  paymentSettings: any;
};

const money = (amount: number | null) => amount === null ? "Custom" : `UGX ${Number(amount).toLocaleString()}`;

function statusClass(status: string) {
  if (status === "ACTIVE" || status === "PAID" || status === "SUCCESS") return "badge-green";
  if (status === "TRIAL" || status === "GRACE" || status === "REQUIRES_VERIFICATION" || status === "PENDING") return "badge-yellow";
  return "badge-red";
}

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [planCode, setPlanCode] = useState("");
  const [method, setMethod] = useState("MTN_MOMO");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [transactionReference, setTransactionReference] = useState("");
  const [evidence, setEvidence] = useState<any>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/subscription");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load subscription.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submitPayment(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          billingCycle: cycle,
          method,
          payerName,
          payerPhone,
          paymentDate,
          transactionReference,
          evidenceUrl: typeof evidence === "string" ? evidence : evidence?.url || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment submission failed.");
      setMessage("Payment submitted for verification. Your current access stays unchanged until payment is approved.");
      setPlanCode("");
      setPayerName("");
      setPayerPhone("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setTransactionReference("");
      setEvidence(null);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Payment submission failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading subscription...</div>;
  if (!data) return <div role="alert" className="card p-6 text-sm text-red-700">{error || "Subscription information is unavailable."}</div>;

  const { subscription, plans, invoices, payments, paymentSettings } = data;
  const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const daysRemaining = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;
  const selectedPlan = plans.find((plan) => plan.code === planCode);
  const selectedPrice = selectedPlan ? (cycle === "YEARLY" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice) : null;
  const orderedPlans = [...plans].sort((a, b) => (a.monthlyPrice ?? Number.MAX_SAFE_INTEGER) - (b.monthlyPrice ?? Number.MAX_SAFE_INTEGER));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Subscription</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your school plan, billing, and payment history.</p>
        </div>
        <span className={statusClass(subscription.status)}>{subscription.status.replaceAll("_", " ")}</span>
      </div>

      {subscription.status === "TRIAL" && (
        <div className="flex flex-col gap-3 rounded-lg border border-brandYellow-200 bg-brandYellow-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-navy-900">{daysRemaining} days left in your free trial</p>
            <p className="text-sm text-slate-600">Trial ends {dateLabel(subscription.trialEndsAt)}. Your school data remains safe if the trial expires.</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white sm:max-w-48">
            <div className="h-full bg-brandYellow" style={{ width: `${Math.min(100, ((14 - daysRemaining) / 14) * 100)}%` }} />
          </div>
        </div>
      )}
      {subscription.status === "GRACE" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your subscription needs renewal. Grace access ends {dateLabel(subscription.graceEndsAt)}. School records are preserved.
        </div>
      )}
      {subscription.status === "RESTRICTED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Subscription access is restricted until renewal is approved. Existing school data has not been deleted.
        </div>
      )}

      <section className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Current plan</p>
            <h2 className="mt-1 text-xl font-bold text-navy-900">{subscription.plan.name}</h2>
            <p className="text-sm text-slate-500">
              {subscription.status === "TRIAL" ? `Trial ends ${dateLabel(subscription.trialEndsAt)}` : `${subscription.billingCycle} · renews ${dateLabel(subscription.endsAt)}`}
            </p>
          </div>
          {subscription.endsAt && <p className="text-sm text-slate-600">Valid through <strong>{dateLabel(subscription.endsAt)}</strong></p>}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Choose a plan</h2>
            <p className="text-sm text-slate-500">Yearly pricing is lower than twelve monthly payments.</p>
          </div>
          <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1">
            <button type="button" onClick={() => setCycle("MONTHLY")} className={`rounded px-3 py-1.5 text-sm ${cycle === "MONTHLY" ? "bg-navy-900 text-white" : "text-slate-600"}`}>Monthly</button>
            <button type="button" onClick={() => setCycle("YEARLY")} className={`rounded px-3 py-1.5 text-sm ${cycle === "YEARLY" ? "bg-navy-900 text-white" : "text-slate-600"}`}>Yearly</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {orderedPlans.map((plan) => {
            const price = cycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
            const features = Array.isArray(plan.features) ? plan.features : [];
            return (
              <article key={plan.id} className={`rounded-lg border bg-white p-4 ${planCode === plan.code ? "border-navy-700 ring-1 ring-navy-700" : "border-slate-200"}`}>
                <h3 className="font-bold text-navy-900">{plan.name}</h3>
                <p className="mt-3 text-xl font-bold text-navy-900">{money(price)}</p>
                <p className="text-xs text-slate-500">{price === null ? "By agreement" : `per ${cycle === "YEARLY" ? "year" : "month"}`}</p>
                <p className="mt-3 text-sm text-slate-600">{plan.studentLimit ? `Up to ${plan.studentLimit.toLocaleString()} students` : "Custom student capacity"}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {features.map((feature: string) => <li key={feature}>• {feature}</li>)}
                </ul>
                {price === null ? (
                  <a href="mailto:sales@edumanage.ug" className="btn-ghost mt-4 w-full justify-center">Contact sales</a>
                ) : (
                  <button type="button" onClick={() => setPlanCode(plan.code)} className={`${planCode === plan.code ? "btn-primary" : "btn-ghost"} mt-4 w-full justify-center`}>
                    {planCode === plan.code ? "Selected" : "Choose plan"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {selectedPlan && (
        <form onSubmit={submitPayment} className="card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-navy-900">Payment details</h2>
              <p className="text-sm text-slate-500">{selectedPlan.name} · {cycle.toLowerCase()} · {money(selectedPrice)}</p>
            </div>
            <button type="button" onClick={() => setPlanCode("")} className="text-sm text-slate-500 hover:text-navy-900">Cancel</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Payment method</label>
              <select className="input" value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="MTN_MOMO">MTN Mobile Money</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
              </select>
            </div>
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              {method === "MTN_MOMO" ? (
                <><p className="font-semibold text-navy-900">MTN receiving number</p><p>{paymentSettings.mtnReceivingNumber}</p>{paymentSettings.mtnMerchantCode && <p>Merchant code: {paymentSettings.mtnMerchantCode}</p>}<p className="mt-1 text-xs text-slate-500">Automatic MTN collection is not connected. Pay using your MoMo service, then enter the transaction reference. Never enter your PIN here.</p></>
              ) : (
                <><p className="font-semibold text-navy-900">{paymentSettings.bankName}</p><p>{paymentSettings.bankAccountName || "EduManage"}</p><p>Account: {paymentSettings.bankAccountNumber}</p><p className="mt-1 text-xs text-slate-500">Use the invoice amount and submit the bank transaction reference below.</p></>
              )}
            </div>
            <div>
              <label className="label">Payer name</label>
              <input className="input" value={payerName} onChange={(event) => setPayerName(event.target.value)} required />
            </div>
            <div>
              <label className="label">Payment date</label>
              <input className="input" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required />
            </div>
            {method === "MTN_MOMO" && <div>
              <label className="label">MTN number used</label>
              <input className="input" type="tel" value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} required placeholder="07xx xxx xxx" />
            </div>}
            <div>
              <label className="label">Transaction reference</label>
              <input className="input" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} required />
            </div>
            <div>
              <label className="label">Payment evidence{method === "BANK_TRANSFER" ? " (required for bank transfer)" : " (optional)"}</label>
              <FileUploadField value={evidence} onChange={setEvidence} />
            </div>
          </div>

          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary">
            <Icon name="file-text" className="h-4 w-4" /> {busy ? "Submitting..." : `Create invoice · ${money(selectedPrice)}`}
          </button>
        </form>
      )}

      {message && <p role="status" className="rounded-md border border-brandGreen-200 bg-brandGreen-50 px-3 py-2 text-sm text-brandGreen-700">{message}</p>}
      {error && !selectedPlan && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4"><h2 className="font-bold text-navy-900">Invoices</h2></div>
          {invoices.length === 0 ? <p className="p-5 text-sm text-slate-500">No invoices yet.</p> : (
            <div className="overflow-x-auto"><table className="table-base w-full"><thead><tr><th>Invoice</th><th>Plan</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
              {invoices.map((invoice) => <tr key={invoice.id}><td>{invoice.invoiceNumber}</td><td>{invoice.planName} · {invoice.billingCycle}</td><td>{money(invoice.amount)}</td><td><span className={statusClass(invoice.status)}>{invoice.status}</span></td><td><Link href={`/subscription/invoices/${invoice.id}`} className="text-navy-700 hover:underline">View</Link></td></tr>)}
            </tbody></table></div>
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4"><h2 className="font-bold text-navy-900">Payment history</h2></div>
          {payments.length === 0 ? <p className="p-5 text-sm text-slate-500">No payments submitted yet.</p> : (
            <div className="overflow-x-auto"><table className="table-base w-full"><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>
              {payments.map((payment) => <tr key={payment.id}><td>{dateLabel(payment.createdAt)}</td><td>{payment.method.replaceAll("_", " ")}</td><td>{payment.transactionReference || "—"}</td><td>{money(payment.amount)}</td><td><span className={statusClass(payment.status)}>{payment.status.replaceAll("_", " ")}</span></td></tr>)}
            </tbody></table></div>
          )}
        </div>
      </section>

      <p className="text-xs text-slate-500">Payment activation happens only after server-side verification by EduManage. <Link href="/subscription/admin" className="text-navy-700 hover:underline">Platform payment review</Link> is available to Super Administrators.</p>
    </div>
  );
}