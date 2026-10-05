import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFeeRecipients, totalFeeAmount } from "@/lib/notifications";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getSession();
  const cronSecret = process.env.FEE_REMINDER_CRON_TOKEN;
  const authorizedCron = Boolean(cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`);
  if (!authorizedCron && (!session || !FINANCE_ROLES.includes(session.role))) {
    return NextResponse.json({ error: "Not authorized to run fee reminders." }, { status: session ? 403 : 401 });
  }

  try {
    const [structures, settings] = await Promise.all([
      prisma.feeStructure.findMany({ where: { dueDate: { not: null } } }),
      prisma.schoolSettings.findUnique({ where: { id: "settings" }, select: { schoolName: true } }),
    ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let matchingStudents = 0;

    for (const structure of structures) {
      let reminderDays: number[] = [];
      try { reminderDays = JSON.parse(structure.reminderDays); } catch { continue; }
      const dueDate = new Date(structure.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);
      if (!reminderDays.includes(daysUntilDue)) continue;

      const students = await prisma.studentProfile.findMany({
        where: {
          classId: structure.classId,
          ...(structure.streamId ? { streamId: structure.streamId } : {}),
          ...(structure.category ? { category: structure.category } : {}),
        },
        select: { id: true, parentId: true },
      });
      const total = totalFeeAmount(structure);
      const eligible = [] as Array<{ id: string; parentId: string | null; balance: number }>;
      for (const student of students) {
        const paid = await prisma.feePayment.aggregate({
          where: { studentId: student.id, term: structure.term, academicYear: structure.academicYear, status: "SUCCESS" },
          _sum: { amount: true },
        });
        const balance = Math.max(0, total - Number(paid._sum.amount || 0));
        if (balance > structure.minimumBalance) eligible.push({ ...student, balance });
      }
      if (!eligible.length) continue;
      matchingStudents += eligible.length;

      const parents = await prisma.parentProfile.findMany({
        where: { id: { in: eligible.map((student) => student.parentId).filter((id): id is string => !!id) } },
        select: { id: true, userId: true },
      });
      const parentUserIds = eligible.flatMap((student) => {
        const parent = parents.find((profile) => profile.id === student.parentId);
        return parent ? [{ studentId: student.id, userId: parent.userId }] : [];
      });
      const schoolName = settings?.schoolName || "School";
      const dayLabel = daysUntilDue === 0 ? "due today" : daysUntilDue > 0 ? `due in ${daysUntilDue} days` : `${Math.abs(daysUntilDue)} days overdue`;
      const balanceByStudent = new Map(eligible.map((student) => [student.id, student.balance]));

      await notifyFeeRecipients(prisma, {
        eventKey: `fee-reminder:${structure.id}:${today.toISOString().slice(0, 10)}:${daysUntilDue}`,
        eventType: "FEE_REMINDER",
        title: daysUntilDue < 0 ? "Overdue fee reminder" : "Fee payment reminder",
        messageFor: (name, studentId) => `${schoolName}: fees for ${name}, ${structure.term} ${structure.academicYear}, are ${dayLabel}. Outstanding balance: UGX ${balanceByStudent.get(studentId)?.toLocaleString() || "0"}.`,
        statusMessageFor: (name) => `${schoolName} sent a fee reminder for ${name}. View the fee account for details.`,
        href: () => "/fees",
        studentIds: eligible.map((student) => student.id),
        parentUserIds,
      });
    }

    return NextResponse.json({ ok: true, matchingStudents, channels: ["IN_APP"] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to run fee reminders." }, { status: 500 });
  }
}