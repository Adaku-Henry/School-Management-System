import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icon";
import PrintButton from "@/components/PrintButton";
import BrandedDocument from "@/components/BrandedDocument";

function gradeFor(marks: number) {
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "F";
}
function remarkFor(grade: string) {
  return { A: "Excellent", B: "Very Good", C: "Good", D: "Fair", F: "Fail" }[grade] || "-";
}

export default async function ReportCardDetailPage({ params }: { params: { id: string } }) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      stream: true,
      examResults: { include: { subject: true, exam: true }, orderBy: { id: "asc" } },
    },
  });
  if (!student) notFound();

  const settings = await prisma.schoolSettings.findUnique({ where: { id: "settings" } });

  // Group results by exam
  const examMap = new Map<string, { exam: any; results: typeof student.examResults }>();
  for (const r of student.examResults) {
    if (!examMap.has(r.examId)) examMap.set(r.examId, { exam: r.exam, results: [] as any });
    examMap.get(r.examId)!.results.push(r);
  }
  const examGroups = Array.from(examMap.values()).sort(
    (a, b) => new Date(b.exam.date).getTime() - new Date(a.exam.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/report-cards" className="text-sm text-navy-600 hover:underline flex items-center gap-1">
          <Icon name="chevron-right" className="w-4 h-4 rotate-180" /> Back to Report Cards
        </Link>
        <PrintButton />
      </div>

      {examGroups.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          No exam results have been recorded for this student yet.
        </div>
      ) : (
        examGroups.map(({ exam, results }) => {
          const total = results.reduce((s: number, r: any) => s + r.marks, 0);
          const average = results.length ? Math.round(total / results.length) : 0;
          const overallGrade = gradeFor(average);

          return (
            <BrandedDocument key={exam.id} settings={settings} documentType="REPORT_CARDS" title="Report Card">
              <div className="mb-6 border-b border-slate-100 pb-4 text-right text-sm text-slate-500">{exam.name} · {exam.term} {exam.academicYear}</div>

              {/* Student info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Student</p>
                  <p className="font-semibold text-navy-900">{student.firstName} {student.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Admission No.</p>
                  <p className="font-semibold text-navy-900">{student.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Class</p>
                  <p className="font-semibold text-navy-900">{student.class?.name} {student.stream?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Exam Type</p>
                  <p className="font-semibold text-navy-900">{exam.type}</p>
                </div>
              </div>

              {/* Marks table */}
              <table className="table-base w-full mb-6">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any) => (
                    <tr key={r.id}>
                      <td>{r.subject?.name}</td>
                      <td className="font-semibold">{r.marks}</td>
                      <td>
                        <span className={r.grade === "F" ? "badge-red" : r.grade === "A" ? "badge-green" : "badge-yellow"}>
                          {r.grade}
                        </span>
                      </td>
                      <td>{remarkFor(r.grade || "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg bg-navy-900 text-white p-4 text-center">
                  <p className="text-xs uppercase text-navy-200">Total</p>
                  <p className="text-xl font-bold">{total}</p>
                </div>
                <div className="rounded-lg bg-brandGreen text-white p-4 text-center">
                  <p className="text-xs uppercase text-brandGreen-100">Average</p>
                  <p className="text-xl font-bold">{average}%</p>
                </div>
                <div className="rounded-lg bg-brandYellow text-navy-900 p-4 text-center">
                  <p className="text-xs uppercase">Overall Grade</p>
                  <p className="text-xl font-bold">{overallGrade}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Class Teacher's Remarks</p>
                  <p className="text-slate-600">
                    {average >= 70 ? "An excellent performance this term. Keep it up." :
                     average >= 50 ? "A satisfactory performance. There is room for improvement." :
                     "Needs to put in more effort next term."}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Head Teacher's Remarks</p>
                  <p className="text-slate-600">Promoted to the next class, pending final confirmation.</p>
                </div>
              </div>
            </BrandedDocument>
          );
        })
      )}
    </div>
  );
}
