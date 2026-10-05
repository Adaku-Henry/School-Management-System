"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReverseFeePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reverse(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/fees/payments/${paymentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reverse payment.");
      router.push(`/fees/receipts/${data.reversal.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not reverse payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="print:hidden">
      {!open ? <button type="button" onClick={() => setOpen(true)} className="btn-ghost text-red-700">Void and reverse payment</button> : (
        <form onSubmit={reverse} className="mt-4 space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
          <label className="label">Reason for reversal</label>
          <textarea className="input" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} required />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Reversing..." : "Confirm reversal"}</button>
          </div>
        </form>
      )}
    </div>
  );
}