import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const streamId = searchParams.get("streamId");
    const parentId = searchParams.get("parentId");

    const items = await prisma.studentProfile.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(streamId ? { streamId } : {}),
        ...(parentId ? { parentId } : {}),
      },
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
      },
      orderBy: { admissionDate: "desc" },
    });
    const out = items.map((s) => ({
      ...s,
      attachments: parseAttachments(s.attachments),
      className: s.class?.name,
      streamName: s.stream?.name,
      parentName: s.parent?.user?.name,
    }));
    return NextResponse.json({ items: out });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load students." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.admissionNumber || !body.firstName || !body.lastName || !body.dateOfBirth) {
      return NextResponse.json({ error: "Admission number, name and date of birth are required." }, { status: 400 });
    }

    const item = await prisma.studentProfile.create({
      data: {
        admissionNumber: body.admissionNumber,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        gender: body.gender || "Male",
        dateOfBirth: new Date(body.dateOfBirth),
        nationality: body.nationality || null,
        bloodGroup: body.bloodGroup || null,
        medicalConditions: body.medicalConditions || null,
        allergies: body.allergies || null,
        photoUrl: body.photoUrl || null,
        attachments: stringifyAttachments(body.attachments),
        address: body.address || null,
        category: body.category || "Day",
        classId: body.classId || null,
        streamId: body.streamId || null,
        parentId: body.parentId || null,
      },
      include: { class: true, stream: true },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A student with that admission number already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to register student." }, { status: 400 });
  }
}

function parseAttachments(value: string | null) {
  try { return value ? JSON.parse(value) : []; } catch { return []; }
}

function stringifyAttachments(value: unknown) {
  return Array.isArray(value) && value.length ? JSON.stringify(value) : null;
}
