import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BrandedDocument from "@/components/BrandedDocument";
import PrintButton from "@/components/PrintButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { totalFeeAmount } from "@/lib/notifications";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
const money = (amount: number) => `UGX ${Math.max(0, amount).toLocaleString()}`;

export default async function FeeStatementPage({ params, searchParams }: {
  params: { studentId: string };
  searchParams: { term?: string; academicYear?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const student = await prisma.studentProfile.findUnique({
    where: { id: params.studentId },
    include: { class: true, stream: true, parent: { select: { userId: true } } },
  });
  if (!student) notFound();

  const allowed = FINANCE_ROLES.includes(session.role)
    || (session.role === "STUDENT" && student.userId === session.userId)
    || (session.role === "PARENT" && student.parent?.userId === session.userId);
  if (!allowed) notFound();

  const settings = await prisma.schoolSettings.findUnique({ where: { id: "settings" } });
  const term = searchParams.term || settings?.currentTerm || "Term 1";
  const academicYear = searchParams.academicYear || settings?.academicYear || String(new Date().getFullYear());
  const [feeStructure, payments] = await Promise.all([
    student.classId ? prisma.feeStructure.findFirst({
      where: {
        classId: student.classId,
        term,
        academicYear,
        AND: [
          { OR: [{ streamId: student.streamId || undefined }, { streamId: null }] },
          { OR: [{ category: student.category }, { category: null }] },
        ],
      },
      orderBy: { id: "desc" },
    }) : null,
    prisma.feePayment.findMany({
      where: { studentId: student.id, term, academicYear, status: "SUCCESS" },
      orderBy: { date: "asc" },
    }),
  ]);
  const totalFees = feeStructure ? totalFeeAmount(feeStructure) : 0;
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = Math.max(0, totalFees - paid);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between print:hidden"><Link href="/fees" className="text-sm text-navy-700 hover:underline">← Back to Fees</Link><PrintButton label="Print statement / Save as PDF" /></div>
      <BrandedDocument settings={settings} documentType="FEE_STATEMENTS" title="Student Fee Statement">
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase text-slate-400">Student</p><p className="font-semibold text-navy-900">{student.firstName} {student.lastName}</p><p className="text-sm text-slate-600">{student.admissionNumber}</p></div>
            <div><p className="text-xs uppercase text-slate-400">Class / stream</p><p className="font-semibold text-navy-900">{student.class?.name || "Unassigned"} {student.stream?.name || ""}</p><p className="text-sm text-slate-600">{term} · {academicYear}</p></div>
          </section>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-slate-200 p-4"><p className="text-xs uppercase text-slate-400">Total fees</p><p className="text-lg font-bold text-navy-900">{money(totalFees)}</p></div>
            <div className="rounded border border-slate-200 p-4"><p className="text-xs uppercase text-slate-400">Paid</p><p className="text-lg font-bold text-brandGreen-700">{money(paid)}</p></div>
            <div className="rounded border border-slate-200 p-4"><p className="text-xs uppercase text-slate-400">Outstanding</p><p className="text-lg font-bold text-red-700">{money(balance)}</p></div>
          </section>
          <div className="overflow-x-auto"><table className="table-base w-full"><thead><tr><th>Date</th><th>Receipt</th><th>Method</th><th className="text-right">Amount</th></tr></thead><tbody>
            {payments.map((payment) => <tr key={payment.id}><td>{payment.date.toLocaleDateString()}</td><td><Link href={`/fees/receipts/${payment.id}`} className="text-navy-700 hover:underline">{payment.receiptNumber}</Link></td><td>{payment.method}</td><td className="text-right">{payment.amount < 0 ? `(${money(payment.amount)})` : money(payment.amount)}</td></tr>)}
            {payments.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">No verified payments for this period.</td></tr>}
          </tbody></table></div>
          <p className="text-xs text-slate-500">Balance is calculated from the configured fee structure and successful payments. Contact the school finance office if you believe this statement is incorrect.</p>
        </div>
      </BrandedDocument>
    </div>
  );
}