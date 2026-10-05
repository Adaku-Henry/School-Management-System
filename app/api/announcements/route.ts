import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createInAppNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const items = await prisma.announcement.findMany({
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const out = items.map((a) => ({ ...a, authorName: a.createdBy?.name }));
    return NextResponse.json({ items: out });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load announcements." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(session.role)) {
      return NextResponse.json({ error: "Only school leaders and teachers can publish announcements." }, { status: 403 });
    }
    const body = await req.json();
    if (!body.title || !body.message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }
    const targetRole = body.targetRole || "ALL";
    const validRoles = ["ALL", "SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT", "PARENT", "ACCOUNTANT", "LIBRARIAN", "HOSTEL_WARDEN", "NURSE", "SECURITY"];
    if (!validRoles.includes(targetRole)) return NextResponse.json({ error: "Choose a valid announcement audience." }, { status: 400 });
    const recipients = await prisma.user.findMany({
      where: { status: "ACTIVE", ...(targetRole === "ALL" ? {} : { role: targetRole }), id: { not: session.userId } },
      select: { id: true },
    });
    const item = await prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: { title: body.title, message: body.message, targetRole, createdById: session.userId },
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      await Promise.all(recipients.map((recipient) => createInAppNotification(tx, recipient.id, {
        eventKey: `announcement:${announcement.id}`,
        eventType: "ANNOUNCEMENT_PUBLISHED",
        category: "ANNOUNCEMENTS",
        title: announcement.title,
        message: announcement.message,
        href: "/announcements",
      })));
      return announcement;
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to post announcement." }, { status: 400 });
  }
}
