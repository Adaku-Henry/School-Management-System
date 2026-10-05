import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icon";

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      stream: true,
      parent: { include: { user: true } },
      attendance: { orderBy: { date: "desc" }, take: 30 },
      examResults: { include: { subject: true, exam: true }, orderBy: { id: "desc" } },
      feePayments: { orderBy: { date: "desc" } },
      bookLoans: { include: { book: true }, orderBy: { borrowDate: "desc" } },
      hostelAllocation: { include: { room: true } },
      transportAllocation: { include: { route: { include: { vehicle: true } } } },
      disciplineRecords: { orderBy: { date: "desc" } },
      certificates: true,
    },
  });

  if (!student) notFound();

  let studentAttachments = [];
  try { studentAttachments = student.attachments ? JSON.parse(student.attachments) : []; } catch { studentAttachments = []; }

  const settings = await prisma.schoolSettings.findUnique({ where: { id: "settings" } });
  const feeStructure = student.classId
    ? await prisma.feeStructure.findFirst({ where: { classId: student.classId }, orderBy: { id: "desc" } })
    : null;

  const totalPaid = student.feePayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (feeStructure?.amount || 0) - totalPaid;

  const presentDays = student.attendance.filter((a) => a.status === "Present").length;
  const attendanceRate = student.attendance.length ? Math.round((presentDays / student.attendance.length) * 100) : 0;

  const avgMarks = student.examResults.length
    ? Math.round(student.examResults.reduce((s, r) => s + r.marks, 0) / student.examResults.length)
    : null;

  return (
    <div className="space-y-6">
      <Link href="/students" className="text-sm text-navy-600 hover:underline flex items-center gap-1">
        <Icon name="chevron-right" className="w-4 h-4 rotate-180" /> Back to Students
      </Link>

      {/* Header */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {student.photoUrl ? (
          <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="h-20 w-20 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brandGreen text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {student.firstName[0]}{student.lastName[0]}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-900">
            {student.firstName} {student.middleName ? student.middleName + " " : ""}{student.lastName}
          </h1>
          <p className="text-slate-500 text-sm">
            {student.admissionNumber} &middot; {student.class?.name || "Unassigned"} {student.stream?.name || ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={student.status === "ACTIVE" ? "badge-green" : "badge-yellow"}>{student.status}</span>
            <span className="badge-navy">{student.category}</span>
            <span className="badge-gray">{student.gender}</span>
            {student.bloodGroup && <span className="badge-gray">Blood: {student.bloodGroup}</span>}
          </div>
        </div>
        <Link href="/students" className="btn-ghost">
          <Icon name="pencil" className="w-4 h-4" /> Edit in list
        </Link>
      </div>

      {studentAttachments.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Student Documents</h2>
          <ul className="space-y-2">
            {studentAttachments.map((file: { url: string; name: string }) => (
              <li key={file.url}><a href={file.url} className="text-sm text-navy-700 hover:underline" target="_blank" rel="noreferrer">{file.name}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Attendance</p>
          <p className="text-2xl font-bold text-navy-900">{attendanceRate}%</p>
          <p className="text-xs text-slate-400">last {student.attendance.length} records</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Avg. Exam Score</p>
          <p className="text-2xl font-bold text-navy-900">{avgMarks ?? "—"}</p>
          <p className="text-xs text-slate-400">across {student.examResults.length} results</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Fee Balance</p>
          <p className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : "text-brandGreen-600"}`}>
            {settings ? `UGX ${balance.toLocaleString()}` : "—"}
          </p>
          <p className="text-xs text-slate-400">of {feeStructure ? `UGX ${feeStructure.amount.toLocaleString()}` : "no fee set"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Library Books</p>
          <p className="text-2xl font-bold text-navy-900">{student.bookLoans.filter((l) => !l.returnDate).length}</p>
          <p className="text-xs text-slate-400">currently borrowed</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Parent info */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Parent / Guardian</h2>
          {student.parent ? (
            <div className="text-sm space-y-1">
              <p className="font-semibold text-slate-800">{student.parent.user?.name}</p>
              <p className="text-slate-500">{student.parent.relationship} &middot; {student.parent.occupation || "N/A"}</p>
              <p className="text-slate-500">{student.parent.user?.email}</p>
              <p className="text-slate-500">{student.parent.user?.phone || "No phone on file"}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No parent linked. <Link href="/parents" className="text-navy-600 hover:underline">Link one →</Link></p>
          )}
        </div>

        {/* Hostel / transport */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Boarding & Transport</h2>
          <div className="text-sm space-y-2">
            <p><span className="text-slate-400">Hostel Room:</span> {student.hostelAllocation ? student.hostelAllocation.room.name : "Not allocated"}</p>
            <p><span className="text-slate-400">Transport Route:</span> {student.transportAllocation ? `${student.transportAllocation.route.name} (${student.transportAllocation.route.vehicle?.plateNumber || "—"})` : "Not allocated"}</p>
          </div>
        </div>
      </div>

      {/* Exam results */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900">Examination Results</h2>
          <Link href={`/report-cards/${student.id}`} className="text-sm text-navy-600 hover:underline">View Report Card →</Link>
        </div>
        {student.examResults.length === 0 ? (
          <p className="text-sm text-slate-400">No exam results recorded yet.</p>
        ) : (
          <table className="table-base w-full">
            <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
            <tbody>
              {student.examResults.map((r) => (
                <tr key={r.id}>
                  <td>{r.exam.name}</td>
                  <td>{r.subject.name}</td>
                  <td>{r.marks}</td>
                  <td><span className="badge-navy">{r.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Recent Attendance</h2>
          {student.attendance.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {student.attendance.map((a) => (
                <li key={a.id} className="flex justify-between text-sm border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{new Date(a.date).toLocaleDateString()}</span>
                  <span className={
                    a.status === "Present" ? "badge-green" :
                    a.status === "Absent" ? "badge-red" : "badge-yellow"
                  }>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fee payments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-navy-900">Fee Payments</h2>
            <Link href="/fees" className="text-sm text-navy-600 hover:underline">Record payment →</Link>
          </div>
          {student.feePayments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {student.feePayments.map((p) => (
                <li key={p.id} className="flex justify-between text-sm border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600"><Link href={`/fees/receipts/${p.id}`} className="text-navy-700 hover:underline">{p.receiptNumber}</Link> &middot; {p.method}</span>
                  <span className="font-semibold text-brandGreen-600">UGX {p.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Library */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Library Loans</h2>
          {student.bookLoans.length === 0 ? (
            <p className="text-sm text-slate-400">No library activity yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {student.bookLoans.map((l) => (
                <li key={l.id} className="flex justify-between text-sm border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{l.book.title}</span>
                  <span className={l.returnDate ? "badge-gray" : "badge-yellow"}>{l.returnDate ? "Returned" : "Borrowed"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Discipline */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Discipline Records</h2>
          {student.disciplineRecords.length === 0 ? (
            <p className="text-sm text-slate-400">No discipline records. Clean sheet!</p>
          ) : (
            <ul className="space-y-1.5">
              {student.disciplineRecords.map((d) => (
                <li key={d.id} className="text-sm border-b border-slate-100 pb-1.5">
                  <span className={d.type === "Reward" ? "badge-green" : "badge-red"}>{d.type}</span>
                  <p className="text-slate-600 mt-1">{d.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
