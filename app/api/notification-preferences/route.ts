import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_CHANNELS = ["IN_APP", "SMS", "WHATSAPP", "EMAIL", "PUSH"];
const DEFAULT_CHANNELS = { IN_APP: true, SMS: false, WHATSAPP: false, EMAIL: false, PUSH: false };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const preference = await prisma.notificationPreference.upsert({
    where: { userId: session.userId },
    update: {},
    create: { userId: session.userId, channels: JSON.stringify(DEFAULT_CHANNELS) },
  });
  return NextResponse.json({ ...preference, channels: parseChannels(preference.channels), availableChannels: ["IN_APP"] });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const body = await req.json();
    const requested = body.channels && typeof body.channels === "object" ? body.channels : {};
    const channels = { ...DEFAULT_CHANNELS, IN_APP: requested.IN_APP !== false };
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    const studentFinanceVisibility = user?.role === "STUDENT" && ["NONE", "STATUS", "FULL"].includes(body.studentFinanceVisibility)
      ? body.studentFinanceVisibility
      : "NONE";
    const preference = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      update: { channels: JSON.stringify(channels), studentFinanceVisibility },
      create: { userId: session.userId, channels: JSON.stringify(channels), studentFinanceVisibility },
    });
    return NextResponse.json({ ...preference, channels, availableChannels: ["IN_APP"] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save notification preferences." }, { status: 400 });
  }
}

function parseChannels(value: string) {
  try { return { ...DEFAULT_CHANNELS, ...JSON.parse(value) }; } catch { return DEFAULT_CHANNELS; }
}