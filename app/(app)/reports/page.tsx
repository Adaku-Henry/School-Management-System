import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";

export default async function ReportsPage() {
  const [
    students,
    classes,
    feeAgg,
    paidAgg,
    attendanceByStatus,
    examResults,
    genderCounts,
    statusCounts,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.schoolClass.findMany({ include: { _count: { select: { students: true } } }, orderBy: { order: "asc" } }),
    prisma.feeStructure.aggregate({ _sum: { amount: true } }),
    prisma.feePayment.aggregate({ _sum: { amount: true } }),
    prisma.attendance.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.examResult.findMany({ include: { subject: true } }),
    prisma.studentProfile.groupBy({ by: ["gender"], _count: { _all: true } }),
    prisma.studentProfile.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const revenueCollected = paidAgg._sum.amount || 0;
  const revenueExpected = feeAgg._sum.amount || 0;
  const collectionRate = revenueExpected ? Math.round((revenueCollected / revenueExpected) * 100) : 0;

  const totalAttendance = attendanceByStatus.reduce((s, a) => s + a._count._all, 0);

  const subjectMap = new Map<string, { total: number; count: number }>();
  for (const r of examResults) {
    const key = r.subject?.name || "Unknown";
    const cur = subjectMap.get(key) || { total: 0, count: 0 };
    cur.total += r.marks;
    cur.count += 1;
    subjectMap.set(key, cur);
  }
  const subjectAverages = Array.from(subjectMap.entries())
    .map(([name, v]) => ({ name, average: Math.round(v.total / v.count) }))
    .sort((a, b) => b.average - a.average);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">A snapshot of academic, financial and attendance performance across the school.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={students} icon="users" color="navy" />
        <StatCard label="Fee Collection Rate" value={`${collectionRate}%`} icon="banknote" color="green" />
        <StatCard label="Fees Collected" value={`UGX ${revenueCollected.toLocaleString()}`} icon="wallet" color="yellow" />
        <StatCard label="Fees Outstanding" value={`UGX ${Math.max(revenueExpected - revenueCollected, 0).toLocaleString()}`} icon="bar-chart-3" color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Students by class */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-4">Students by Class</h2>
          {classes.length === 0 ? (
            <p className="text-sm text-slate-400">No classes set up yet.</p>
          ) : (
            <div className="space-y-3">
              {classes.map((c) => {
                const max = Math.max(...classes.map((x) => x._count.students), 1);
                const pct = Math.round((c._count.students / max) * 100);
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{c.name}</span>
                      <span className="font-semibold text-navy-900">{c._count.students}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-navy-900 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance breakdown */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-4">Attendance Breakdown (All Time)</h2>
          {attendanceByStatus.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <div className="space-y-3">
              {attendanceByStatus.map((a) => {
                const pct = totalAttendance ? Math.round((a._count._all / totalAttendance) * 100) : 0;
                const color =
                  a.status === "Present" ? "bg-brandGreen" : a.status === "Absent" ? "bg-red-500" : "bg-brandYellow";
                return (
                  <div key={a.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{a.status}</span>
                      <span className="font-semibold text-navy-900">{a._count._all} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject averages */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-4">Average Score by Subject</h2>
          {subjectAverages.length === 0 ? (
            <p className="text-sm text-slate-400">No exam results recorded yet.</p>
          ) : (
            <table className="table-base w-full">
              <thead><tr><th>Subject</th><th>Average</th></tr></thead>
              <tbody>
                {subjectAverages.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>
                      <span className={s.average >= 70 ? "badge-green" : s.average >= 50 ? "badge-yellow" : "badge-red"}>
                        {s.average}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Demographics */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-900 mb-4">Student Demographics</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mb-2">By Gender</p>
          <div className="flex gap-4 mb-4">
            {genderCounts.map((g) => (
              <div key={g.gender} className="flex-1 rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-navy-900">{g._count._all}</p>
                <p className="text-xs text-slate-500">{g.gender}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase mb-2">By Status</p>
          <div className="flex flex-wrap gap-2">
            {statusCounts.map((s) => (
              <span key={s.status} className="badge-navy">{s.status}: {s._count._all}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
