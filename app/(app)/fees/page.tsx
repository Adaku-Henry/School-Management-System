"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CrudPage from "@/components/CrudPage";
import RunFeeRemindersButton from "@/components/RunFeeRemindersButton";

export default function FeesPage() {
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setCanManage(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"].includes(data.user?.role)))
      .catch(() => setCanManage(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Fees Management</h1>
        <p className="text-sm text-slate-500 mt-1">Configure fee structures and record student payments.</p>
      </div>

      {canManage && <RunFeeRemindersButton />}

      <CrudPage
        title="Fee Structures"
        description="The amount due per class, term and academic year."
        apiPath="/api/fees/structures"
        color="navy"
        addLabel="Add Fee Structure"
        searchKeys={["className", "term", "academicYear"]}
        canCreate={canManage}
        canEdit={canManage}
        canDelete={canManage}
        columns={[
          { key: "className", label: "Class" },
          { key: "streamName", label: "Stream" },
          { key: "category", label: "Student type" },
          { key: "term", label: "Term" },
          { key: "academicYear", label: "Academic Year" },
          { key: "amount", label: "Amount (UGX)", render: (r) => Number(r.amount).toLocaleString() },
          { key: "dueDate", label: "Deadline", render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—" },
        ]}
        fields={[
          { name: "classId", label: "Class", type: "select", required: true, colSpan: 2, optionsUrl: "/api/classes" },
          { name: "streamId", label: "Stream (optional)", type: "select", optionsUrl: "/api/streams", optionsMap: (s: any) => ({ value: s.id, label: `${s.className} - ${s.name}` }), colSpan: 2 },
          { name: "category", label: "Student type", type: "select", colSpan: 2, options: [{ value: "Day", label: "Day" }, { value: "Boarding", label: "Boarding" }] },
          { name: "term", label: "Term", type: "select", required: true, colSpan: 1, options: [
            { value: "Term 1", label: "Term 1" }, { value: "Term 2", label: "Term 2" }, { value: "Term 3", label: "Term 3" },
          ] },
          { name: "academicYear", label: "Academic Year", required: true, colSpan: 1, placeholder: "2026" },
          { name: "amount", label: "Amount (UGX)", type: "number", required: true, colSpan: 2 },
          { name: "optionalCharges", label: "Optional charges (JSON list)", type: "textarea", colSpan: 2, defaultValue: "[]", placeholder: "[{\"name\":\"Transport\",\"amount\":50000}]" },
          { name: "dueDate", label: "Payment deadline", type: "date", colSpan: 2 },
          { name: "minimumBalance", label: "Minimum balance for reminders (UGX)", type: "number", colSpan: 2, defaultValue: 0 },
          { name: "reminderDays", label: "Reminder days relative to deadline (JSON)", type: "text", colSpan: 2, defaultValue: "[30,14,7,3,0,-7,-14]", placeholder: "[30,14,7,3,0,-7,-14]" },
          { name: "notifyOnCreated", label: "Notify family when fees are posted", type: "checkbox", colSpan: 2, defaultValue: true },
          { name: "notifyOnPayment", label: "Notify family when payment is recorded", type: "checkbox", colSpan: 2, defaultValue: true },
        ]}
      />

      <CrudPage
        title="Fee Payments"
        description="Payments received from students. A receipt number is generated automatically."
        apiPath="/api/fees/payments"
        color="green"
        addLabel="Record Payment"
        canCreate={canManage}
        canEdit={false}
        canDelete={false}
        searchKeys={["studentName", "receiptNumber", "method", "transactionReference"]}
        columns={[
          { key: "receiptNumber", label: "Receipt #", render: (r) => <Link href={`/fees/receipts/${r.id}`} className="font-semibold text-navy-700 hover:underline">{r.receiptNumber}</Link> },
          { key: "studentName", label: "Student" },
          { key: "transactionReference", label: "Transaction Ref." },
          { key: "amount", label: "Amount (UGX)", render: (r) => Number(r.amount).toLocaleString() },
          { key: "method", label: "Method" },
          { key: "term", label: "Term" },
          { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
        ]}
        fields={[
          {
            name: "studentId", label: "Student", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/students",
            optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }),
          },
          { name: "amount", label: "Amount (UGX)", type: "number", required: true, colSpan: 1 },
          { name: "method", label: "Payment Method", type: "select", required: true, colSpan: 1, options: [
            { value: "Cash", label: "Cash" }, { value: "Bank", label: "Bank" },
            { value: "Mobile Money", label: "Mobile Money" }, { value: "Card", label: "Card" },
          ] },
          { name: "transactionReference", label: "Transaction Reference", colSpan: 2 },
          { name: "term", label: "Term", colSpan: 1, placeholder: "Term 2" },
          { name: "academicYear", label: "Academic Year", colSpan: 1, placeholder: "2026" },
        ]}
      />
    </div>
  );
}
