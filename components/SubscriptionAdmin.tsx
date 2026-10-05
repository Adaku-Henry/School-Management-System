"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const money = (amount: number) => `UGX ${Number(amount).toLocaleString()}`;
const dateLabel = (value: string) => new Date(value).toLocaleString();

export default function SubscriptionAdmin() {
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [paymentResponse, settingsResponse] = await Promise.all([
        fetch("/api/subscription/admin/payments"),
        fetch("/api/subscription/admin/settings"),
      ]);
      const [paymentData, settingsData] = await Promise.all([paymentResponse.json(), settingsResponse.json()]);
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Could not load payments.");
      if (!settingsResponse.ok) throw new Error(settingsData.error || "Could not load payment settings.");
      setPayments(paymentData.payments || []);
      setSettings(settingsData.settings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load platform billing data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function review(paymentId: string, action: "APPROVE" | "REJECT") {
    setBusyId(paymentId);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/subscription/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action, rejectionReason: reasons[paymentId] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment review failed.");
      setMessage(action === "APPROVE" ? "Payment approved and subscription activated." : "Payment rejected.");
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Payment review failed.");
    } finally {
      setBusyId("");
    }
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSavingSettings(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/subscription/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save receiving accounts.");
      setSettings(result.settings);
      setMessage("Receiving account settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save receiving accounts.");
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading platform payments...</div>;

  const pending = payments.filter((payment) => payment.status === "REQUIRES_VERIFICATION");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Subscription Verification</h1>
        <p className="mt-1 text-sm text-slate-500">Review payment references and evidence before activating a plan.</p>
      </div>

      {message && <p role="status" className="rounded-md border border-brandGreen-200 bg-brandGreen-50 px-3 py-2 text-sm text-brandGreen-700">{message}</p>}
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">Pending verification</h2>
          <span className="badge-yellow">{pending.length} pending</span>
        </div>
        {pending.length === 0 ? <div className="card p-6 text-sm text-slate-500">No payments are waiting for review.</div> : pending.map((payment) => (
          <article key={payment.id} className="card grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div><p className="text-xs uppercase text-slate-400">School</p><p className="font-semibold text-navy-900">{payment.subscription.schoolSettings.schoolName}</p></div>
              <div><p className="text-xs uppercase text-slate-400">Plan</p><p className="font-semibold text-navy-900">{payment.invoice?.planName} · {payment.invoice?.billingCycle}</p></div>
              <div><p className="text-xs uppercase text-slate-400">Amount</p><p className="font-semibold text-navy-900">{money(payment.amount)}</p></div>
              <div><p className="text-xs uppercase text-slate-400">Payment date / submitted</p><p className="text-sm text-slate-700">{dateLabel(payment.claimedPaymentAt || payment.createdAt)}<br />{dateLabel(payment.createdAt)}</p></div>
              <div><p className="text-xs uppercase text-slate-400">Method / Reference</p><p className="text-sm text-slate-700">{payment.method.replaceAll("_", " ")} · {payment.transactionReference}</p></div>
              <div><p className="text-xs uppercase text-slate-400">Payer</p><p className="text-sm text-slate-700">{payment.payerName}{payment.payerPhone ? ` · ${payment.payerPhone}` : ""}</p></div>
              <div><p className="text-xs uppercase text-slate-400">Invoice</p><p className="text-sm text-slate-700">{payment.invoice?.invoiceNumber}</p></div>
              <div className="flex items-end">{payment.evidenceUrl ? <a href={payment.evidenceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy-700 hover:underline">View payment evidence</a> : <span className="text-sm text-slate-400">No evidence uploaded</span>}</div>
              <div className="sm:col-span-2 xl:col-span-4">
                <label className="label">Rejection reason (required to reject)</label>
                <input className="input" value={reasons[payment.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [payment.id]: event.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 lg:flex-col lg:justify-center">
              <button type="button" onClick={() => void review(payment.id, "APPROVE")} disabled={busyId === payment.id} className="btn-success justify-center">
                <Icon name="check-circle" className="h-4 w-4" /> {busyId === payment.id ? "Working..." : "Approve"}
              </button>
              <button type="button" onClick={() => void review(payment.id, "REJECT")} disabled={busyId === payment.id || !reasons[payment.id]?.trim()} className="btn-ghost justify-center text-red-700">
                Reject
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold text-navy-900">Payment receiving accounts</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">These account details are shown to schools at checkout. Keep provider API secrets in server environment variables, not here.</p>
        {settings && <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">MTN receiving number</label><input className="input" value={settings.mtnReceivingNumber} onChange={(event) => setSettings({ ...settings, mtnReceivingNumber: event.target.value })} required /></div>
          <div><label className="label">MTN merchant code</label><input className="input" value={settings.mtnMerchantCode || ""} onChange={(event) => setSettings({ ...settings, mtnMerchantCode: event.target.value })} /></div>
          <div><label className="label">Bank name</label><input className="input" value={settings.bankName} onChange={(event) => setSettings({ ...settings, bankName: event.target.value })} required /></div>
          <div><label className="label">Bank account name</label><input className="input" value={settings.bankAccountName} onChange={(event) => setSettings({ ...settings, bankAccountName: event.target.value })} /></div>
          <div><label className="label">Bank account number</label><input className="input" value={settings.bankAccountNumber} onChange={(event) => setSettings({ ...settings, bankAccountNumber: event.target.value })} required /></div>
          <div className="sm:col-span-2"><button type="submit" disabled={savingSettings} className="btn-primary"><Icon name="check-circle" className="h-4 w-4" />{savingSettings ? "Saving..." : "Save receiving accounts"}</button></div>
        </form>}
      </section>
    </div>
  );
}