import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalStaff,
      totalClasses,
      feeAgg,
      paidAgg,
      todayAttendance,
      upcomingEvents,
      recentAnnouncements,
      pendingBooks,
      hostelOccupied,
    ] = await Promise.all([
      prisma.studentProfile.count({ where: { status: "ACTIVE" } }),
      prisma.teacherProfile.count(),
      prisma.parentProfile.count(),
      prisma.user.count({ where: { role: { in: ["ACCOUNTANT", "LIBRARIAN", "HOSTEL_WARDEN", "NURSE", "SECURITY"] } } }),
      prisma.schoolClass.count(),
      prisma.feeStructure.aggregate({ _sum: { amount: true } }),
      prisma.feePayment.aggregate({ _sum: { amount: true } }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { date: { gte: startOfDay, lte: endOfDay } },
        _count: true,
      }),
      prisma.schoolEvent.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 5 }),
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { createdBy: true } }),
      prisma.bookLoan.count({ where: { returnDate: null } }),
      prisma.hostelAllocation.count(),
    ]);

    const revenueCollected = paidAgg._sum.amount || 0;
    const revenueExpected = feeAgg._sum.amount || 0;
    const presentToday = todayAttendance.find((t) => t.status === "Present")?._count || 0;
    const absentToday = todayAttendance.find((t) => t.status === "Absent")?._count || 0;

    let myClasses = 0;
    let myStudents = 0;
    let myChildren: any[] = [];
    let myResults: any[] = [];
    let myFees: any = null;

    if (session.role === "TEACHER") {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.userId },
        include: { streams: true, subjects: true },
      });
      myClasses = teacher?.streams?.length || 0;
    }
    if (session.role === "PARENT") {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: session.userId },
        include: { children: { include: { class: true, stream: true } } },
      });
      myChildren = parent?.children || [];
    }
    if (session.role === "STUDENT") {
      const student = await prisma.studentProfile.findUnique({ where: { userId: session.userId } });
      if (student) {
        myResults = await prisma.examResult.findMany({
          where: { studentId: student.id },
          orderBy: { id: "desc" },
          take: 5,
          include: { subject: true },
        });
        myFees = await prisma.feePayment.aggregate({ where: { studentId: student.id }, _sum: { amount: true } });
      }
    }

    return NextResponse.json({
      totals: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalStaff,
        totalClasses,
        revenueCollected,
        revenueExpected,
        outstanding: Math.max(revenueExpected - revenueCollected, 0),
        presentToday,
        absentToday,
        pendingBooks,
        hostelOccupied,
        myClasses,
      },
      upcomingEvents,
      recentAnnouncements: recentAnnouncements.map((a) => ({ ...a, authorName: a.createdBy?.name })),
      myChildren,
      myResults,
      myFees: myFees?._sum?.amount || 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load dashboard data." }, { status: 500 });
  }
}
