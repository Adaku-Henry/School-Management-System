import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  const category = req.nextUrl.searchParams.get("category");
  const where = {
    userId: session.userId,
    archivedAt: null,
    ...(unreadOnly ? { readAt: null } : {}),
    ...(category ? { category } : {}),
  };
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "desc" }], take: 100 }),
    prisma.notification.count({ where: { userId: session.userId, archivedAt: null, readAt: null } }),
  ]);
  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const body = await req.json();
    const action = body.action;
    const now = new Date();
    if (action === "MARK_ALL_READ") {
      await prisma.notification.updateMany({ where: { userId: session.userId, readAt: null }, data: { readAt: now } });
    } else if (["MARK_READ", "ARCHIVE"].includes(action) && body.id) {
      const result = await prisma.notification.updateMany({
        where: { id: String(body.id), userId: session.userId },
        data: action === "MARK_READ" ? { readAt: now } : { archivedAt: now },
      });
      if (!result.count) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Choose a valid notification action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 400 });
  }
}