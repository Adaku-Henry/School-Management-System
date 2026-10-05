import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icon";
import { getSession } from "@/lib/auth";

export default async function ReportCardsListPage() {
  const session = await getSession();

  // Students see only their own report card; everyone else sees the full list.
  if (session?.role === "STUDENT") {
    const student = await prisma.studentProfile.findUnique({ where: { userId: session.userId } });
    if (student) {
      const { redirect } = await import("next/navigation");
      redirect(`/report-cards/${student.id}`);
    }
  }

  let students = await prisma.studentProfile.findMany({
    where: session?.role === "PARENT" ? { parent: { userId: session.userId } } : { status: "ACTIVE" },
    include: { class: true, stream: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Report Cards</h1>
        <p className="text-sm text-slate-500 mt-1">Select a student to view their academic report card.</p>
      </div>

      <div className="card overflow-hidden">
        {students.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold text-navy-800">{s.firstName} {s.lastName}</td>
                    <td>{s.admissionNumber}</td>
                    <td>{s.class?.name || "-"} {s.stream?.name || ""}</td>
                    <td className="text-right">
                      <Link href={`/report-cards/${s.id}`} className="btn-ghost inline-flex">
                        <Icon name="file-text" className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
