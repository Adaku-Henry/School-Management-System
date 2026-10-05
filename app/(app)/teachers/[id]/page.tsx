import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icon";

export default async function TeacherProfilePage({ params }: { params: { id: string } }) {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      subjects: { include: { subject: true } },
      streams: { include: { class: true } },
      payslips: { orderBy: { generatedAt: "desc" }, take: 6 },
    },
  });

  if (!teacher) notFound();

  let teacherAttachments = [];
  try { teacherAttachments = teacher.user?.attachments ? JSON.parse(teacher.user.attachments) : []; } catch { teacherAttachments = []; }

  return (
    <div className="space-y-6">
      <Link href="/teachers" className="text-sm text-navy-600 hover:underline flex items-center gap-1">
        <Icon name="chevron-right" className="w-4 h-4 rotate-180" /> Back to Teachers
      </Link>

      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {teacher.user?.avatarUrl ? (
          <img src={teacher.user.avatarUrl} alt={teacher.user.name} className="h-20 w-20 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-navy-900 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {teacher.user?.name?.slice(0, 1)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-900">{teacher.user?.name}</h1>
          <p className="text-slate-500 text-sm">
            {teacher.employeeId} &middot; {teacher.qualification || "No qualification on file"}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="badge-navy">{teacher.user?.email}</span>
            {teacher.user?.phone && <span className="badge-gray">{teacher.user.phone}</span>}
            <span className="badge-green">{teacher.experience || "Experience N/A"}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase font-semibold">Monthly Salary</p>
          <p className="text-xl font-bold text-brandGreen-600">UGX {teacher.salary.toLocaleString()}</p>
        </div>
      </div>

      {teacherAttachments.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-3">Teacher Documents</h2>
          <ul className="space-y-2">
            {teacherAttachments.map((file: { url: string; name: string }) => (
              <li key={file.url}><a href={file.url} className="text-sm text-navy-700 hover:underline" target="_blank" rel="noreferrer">{file.name}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-4">Subjects Taught</h2>
          {teacher.subjects.length === 0 ? (
            <p className="text-sm text-slate-400">No subjects assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((s) => (
                <span key={s.id} className="badge-yellow">{s.subject.name}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-4">Classes / Streams Managed</h2>
          {teacher.streams.length === 0 ? (
            <p className="text-sm text-slate-400">Not assigned as a class teacher.</p>
          ) : (
            <ul className="space-y-1">
              {teacher.streams.map((s) => (
                <li key={s.id} className="text-sm text-slate-700">
                  {s.class.name} - {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900">Recent Payslips</h2>
          <Link href="/payroll" className="text-sm text-navy-600 hover:underline">View Payroll →</Link>
        </div>
        {teacher.payslips.length === 0 ? (
          <p className="text-sm text-slate-400">No payslips generated yet.</p>
        ) : (
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Period</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {teacher.payslips.map((p) => (
                <tr key={p.id}>
                  <td>{p.month} {p.year}</td>
                  <td>UGX {p.basicSalary.toLocaleString()}</td>
                  <td>UGX {p.allowances.toLocaleString()}</td>
                  <td>UGX {p.deductions.toLocaleString()}</td>
                  <td className="font-semibold text-brandGreen-600">UGX {p.netSalary.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
