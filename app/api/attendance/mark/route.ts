import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createInAppNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(session.role)) {
      return NextResponse.json({ error: "Only school leaders and teachers can record attendance." }, { status: 403 });
    }
    const body = await req.json();
    const { date: dateStr, records } = body as { date: string; records: { studentId: string; status: string }[] };
    if (!dateStr || !Array.isArray(records)) {
      return NextResponse.json({ error: "date and records are required." }, { status: 400 });
    }
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const school = await prisma.schoolSettings.findUnique({ where: { id: "settings" }, select: { schoolName: true } });
    const eventNotifications: Array<{ studentId: string; userId: string; name: string }> = [];
    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        await tx.attendance.upsert({
          where: { studentId_date: { studentId: record.studentId, date } },
          update: { status: record.status, markedById: session.userId },
          create: { studentId: record.studentId, date, status: record.status, markedById: session.userId },
        });
        if (["Absent", "Late"].includes(record.status)) {
          const student = await tx.studentProfile.findUnique({
            where: { id: record.studentId },
            select: { id: true, firstName: true, lastName: true, parent: { select: { userId: true } } },
          });
          if (student?.parent?.userId) eventNotifications.push({ studentId: student.id, userId: student.parent.userId, name: `${student.firstName} ${student.lastName}` });
        }
      }
      await Promise.all(eventNotifications.map((recipient) => createInAppNotification(tx, recipient.userId, {
        eventKey: `attendance:${recipient.studentId}:${date.toISOString().slice(0, 10)}:${records.find((record) => record.studentId === recipient.studentId)?.status}`,
        eventType: records.find((record) => record.studentId === recipient.studentId)?.status === "Late" ? "STUDENT_LATE" : "STUDENT_ABSENT",
        category: "ATTENDANCE",
        title: records.find((record) => record.studentId === recipient.studentId)?.status === "Late" ? "Student marked late" : "Student absence recorded",
        message: `${recipient.name} was marked ${records.find((record) => record.studentId === recipient.studentId)?.status?.toLowerCase()} at ${school?.schoolName || "school"} on ${date.toLocaleDateString()}.`,
        href: "/attendance",
        priority: "HIGH",
      })));
    });

    return NextResponse.json({ ok: true, count: records.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save attendance." }, { status: 500 });
  }
}
