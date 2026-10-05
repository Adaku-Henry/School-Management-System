import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get("streamId");
    const dateStr = searchParams.get("date");
    if (!streamId || !dateStr) {
      return NextResponse.json({ error: "streamId and date are required." }, { status: 400 });
    }
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const students = await prisma.studentProfile.findMany({
      where: { streamId },
      orderBy: { firstName: "asc" },
      include: { attendance: { where: { date } } },
    });

    const roster = students.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admissionNumber: s.admissionNumber,
      status: s.attendance[0]?.status || "Present",
    }));

    return NextResponse.json({ items: roster });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load roster." }, { status: 500 });
  }
}
