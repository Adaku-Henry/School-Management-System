import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function gradeFor(marks: number) {
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "F";
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const exam = await prisma.exam.findUnique({ where: { id: params.id }, include: { class: true } });
    if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });
    if (!exam.classId) return NextResponse.json({ error: "This exam is not linked to a class." }, { status: 400 });
    if (!subjectId) return NextResponse.json({ error: "subjectId is required." }, { status: 400 });

    const students = await prisma.studentProfile.findMany({
      where: { classId: exam.classId },
      orderBy: { firstName: "asc" },
      include: { examResults: { where: { examId: params.id, subjectId } } },
    });

    const roster = students.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admissionNumber: s.admissionNumber,
      marks: s.examResults[0]?.marks ?? "",
      grade: s.examResults[0]?.grade ?? "",
    }));

    return NextResponse.json({ items: roster, exam });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load results." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { subjectId, records } = body as { subjectId: string; records: { studentId: string; marks: number }[] };
    if (!subjectId || !Array.isArray(records)) {
      return NextResponse.json({ error: "subjectId and records are required." }, { status: 400 });
    }

    for (const r of records) {
      if (r.marks === null || r.marks === undefined || Number.isNaN(Number(r.marks))) continue;
      const marks = Number(r.marks);
      await prisma.examResult.upsert({
        where: { examId_studentId_subjectId: { examId: params.id, studentId: r.studentId, subjectId } },
        update: { marks, grade: gradeFor(marks) },
        create: { examId: params.id, studentId: r.studentId, subjectId, marks, grade: gradeFor(marks) },
      });
    }

    return NextResponse.json({ ok: true, count: records.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save results." }, { status: 500 });
  }
}
