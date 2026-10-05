import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/Icon";
import MarksEntry from "@/components/MarksEntry";

export default async function ExamDetailPage({ params }: { params: { id: string } }) {
  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: { class: true },
  });
  if (!exam) notFound();

  return (
    <div className="space-y-6">
      <Link href="/exams" className="text-sm text-navy-600 hover:underline flex items-center gap-1">
        <Icon name="chevron-right" className="w-4 h-4 rotate-180" /> Back to Examinations
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-navy-900">{exam.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {exam.type} &middot; {exam.class?.name || "All Classes"} &middot; {exam.term} {exam.academicYear}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-3">Enter Marks</h2>
        <MarksEntry examId={exam.id} />
      </div>
    </div>
  );
}
