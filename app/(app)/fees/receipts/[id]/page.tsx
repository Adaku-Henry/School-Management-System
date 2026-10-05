import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BrandedDocument from "@/components/BrandedDocument";
import PrintButton from "@/components/PrintButton";
import ReverseFeePaymentButton from "@/components/ReverseFeePaymentButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
const money = (amount: number) => `UGX ${Math.abs(amount).toLocaleString()}`;
const dateLabel = (value: Date) => value.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

export default async function FeeReceiptPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const payment = await prisma.feePayment.findUnique({
    where: { id: params.id },
    include: {
      student: {
        include: {
          class: true,
          stream: true,
          parent: { include: { user: { select: { id: true, name: true } } } },
        },
      },
      recordedBy: { select: { name: true } },
    },
  });
  if (!payment) notFound();

  const allowed = FINANCE_ROLES.includes(session.role)
    || (session.role === "STUDENT" && payment.student.userId === session.userId)
    || (session.role === "PARENT" && payment.student.parent?.userId === session.userId);
  if (!allowed) notFound();

  const settings = await prisma.schoolSettings.findUnique({ where: { id: "settings" } });
  const isReversal = payment.method === "REVERSAL";
  const title = payment.status === "VOIDED" ? "Voided receipt" : isReversal ? "Payment reversal" : "Payment receipt";
  const statementHref = `/fees/statements/${payment.studentId}?term=${encodeURIComponent(payment.term || "")}&academicYear=${encodeURIComponent(payment.academicYear || "")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/fees" className="text-sm text-navy-700 hover:underline">← Back to Fees</Link>
        <div className="flex gap-2"><Link href={statementHref} className="btn-ghost">Fee statement</Link><PrintButton label="Print / Save as PDF" /></div>
      </div>

      <BrandedDocument settings={settings} documentType="RECEIPTS" title={title}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div><p className="text-xs uppercase text-slate-400">Receipt number</p><p className="text-lg font-bold text-navy-900">{payment.receiptNumber}</p></div>
            <div className="text-right"><p className="text-xs uppercase text-slate-400">Status</p><span className={payment.status === "VOIDED" ? "badge-red" : "badge-green"}>{payment.status}</span></div>
          </div>

          {payment.status === "VOIDED" && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">Voided: {payment.voidReason || "Payment reversed"}{payment.voidedAt ? ` · ${dateLabel(payment.voidedAt)}` : ""}</div>}

          <section className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase text-slate-400">Student</p><p className="font-semibold text-navy-900">{payment.student.firstName} {payment.student.lastName}</p><p className="text-sm text-slate-600">Admission: {payment.student.admissionNumber}</p></div>
            <div><p className="text-xs uppercase text-slate-400">Class / stream</p><p className="font-semibold text-navy-900">{payment.student.class?.name || "Unassigned"} {payment.student.stream?.name || ""}</p><p className="text-sm text-slate-600">Parent: {payment.student.parent?.user?.name || "Not linked"}</p></div>
            <div><p className="text-xs uppercase text-slate-400">Academic period</p><p className="text-sm text-slate-700">{payment.term || "—"} · {payment.academicYear || "—"}</p></div>
            <div><p className="text-xs uppercase text-slate-400">Payment date / method</p><p className="text-sm text-slate-700">{dateLabel(payment.date)} · {payment.method}</p></div>
          </section>

          <div className="overflow-x-auto"><table className="table-base w-full"><thead><tr><th>Description</th><th className="text-right">Amount</th></tr></thead><tbody>
            <tr><td>{isReversal ? "Reversed payment" : "School fees payment"}</td><td className="text-right">{isReversal ? `(${money(payment.amount)})` : money(payment.amount)}</td></tr>
          </tbody><tfoot><tr><td>Total school fees</td><td className="text-right">{payment.totalFees === null ? "—" : money(payment.totalFees)}</td></tr><tr><td>Previous balance</td><td className="text-right">{payment.previousBalance === null ? "—" : money(payment.previousBalance)}</td></tr><tr><td className="font-bold">New balance</td><td className="text-right font-bold">{payment.balanceAfter === null ? "—" : money(payment.balanceAfter)}</td></tr></tfoot></table></div>

          <section className="grid gap-4 rounded bg-slate-50 p-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase text-slate-400">Transaction reference</p><p className="text-sm font-semibold text-navy-800">{payment.transactionReference || "—"}</p></div>
            <div><p className="text-xs uppercase text-slate-400">Recorded by</p><p className="text-sm text-slate-700">{payment.recordedBy?.name || "Finance staff"}</p></div>
          </section>
          <p className="text-center text-xs text-slate-500">This is a computer-generated document.</p>
        </div>
      </BrandedDocument>

      {FINANCE_ROLES.includes(session.role) && payment.status === "SUCCESS" && !isReversal && <ReverseFeePaymentButton paymentId={payment.id} />}
    </div>
  );
}