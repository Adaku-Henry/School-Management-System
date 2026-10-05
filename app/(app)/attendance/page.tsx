import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AttendanceMarker from "@/components/AttendanceMarker";

export default async function AttendancePage() {
  const session = await getSession();
  const canMark = ["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(session!.role);

  if (canMark) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Select a class, stream and date to mark attendance.</p>
        </div>
        <AttendanceMarker />
      </div>
    );
  }

  // Student / Parent read-only view
  let student = null;
  if (session!.role === "STUDENT") {
    student = await prisma.studentProfile.findUnique({
      where: { userId: session!.userId },
      include: { attendance: { orderBy: { date: "desc" }, take: 60 }, class: true, stream: true },
    });
  } else if (session!.role === "PARENT") {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId: session!.userId },
      include: { children: { include: { attendance: { orderBy: { date: "desc" }, take: 60 }, class: true, stream: true } } },
    });
    student = parent?.children[0] || null;
  }

  if (!student) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Attendance</h1>
        <p className="text-slate-500 text-sm">No student record is linked to your account yet.</p>
      </div>
    );
  }

  const present = student.attendance.filter((a: any) => a.status === "Present").length;
  const rate = student.attendance.length ? Math.round((present / student.attendance.length) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Attendance</h1>
      <p className="text-sm text-slate-500 mb-6">
        {student.firstName} {student.lastName} &middot; {student.class?.name} {student.stream?.name}
      </p>

      <div className="card p-5 mb-6 inline-flex items-center gap-4">
        <div className="text-3xl font-bold text-brandGreen-600">{rate}%</div>
        <div className="text-sm text-slate-500">Attendance rate over last {student.attendance.length} school days</div>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base w-full">
          <thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {student.attendance.map((a: any) => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>
                  <span className={
                    a.status === "Present" ? "badge-green" :
                    a.status === "Absent" ? "badge-red" : "badge-yellow"
                  }>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
