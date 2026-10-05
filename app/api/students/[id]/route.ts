import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      stream: true,
      parent: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, attachments: true, avatarColor: true, status: true },
          },
        },
      },
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
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const item = await prisma.studentProfile.update({
      where: { id: params.id },
      data: {
        admissionNumber: body.admissionNumber,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        nationality: body.nationality || null,
        bloodGroup: body.bloodGroup || null,
        medicalConditions: body.medicalConditions || null,
        allergies: body.allergies || null,
        photoUrl: body.photoUrl || null,
        attachments: Array.isArray(body.attachments) && body.attachments.length ? JSON.stringify(body.attachments) : null,
        address: body.address || null,
        category: body.category || "Day",
        status: body.status || undefined,
        classId: body.classId || null,
        streamId: body.streamId || null,
        parentId: body.parentId || null,
      },
    });
    return NextResponse.json({ item });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A student with that admission number already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update student." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.studentProfile.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete student." }, { status: 400 });
  }
}
