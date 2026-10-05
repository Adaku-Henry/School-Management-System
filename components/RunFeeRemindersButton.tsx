"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function RunFeeRemindersButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/internal/fee-reminders", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not run fee reminders.");
      setMessage(`Processed ${data.matchingStudents} student account${data.matchingStudents === 1 ? "" : "s"}.`);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not run fee reminders.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-col items-end gap-1 print:hidden">
    <button type="button" onClick={() => void run()} disabled={busy} className="btn-ghost"><Icon name="bell" className="h-4 w-4" />{busy ? "Checking..." : "Run due reminders"}</button>
    {message && <span role="status" className="text-xs text-brandGreen-700">{message}</span>}
    {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
  </div>;
}