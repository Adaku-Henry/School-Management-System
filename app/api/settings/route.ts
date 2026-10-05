import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const item = await prisma.schoolSettings.upsert({
      where: { id: "settings" },
      update: {},
      create: { id: "settings" },
    });
    return NextResponse.json({ item: { ...item, attachments: parseAttachments(item.attachments) } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "You do not have permission to change school settings." }, { status: 403 });
    }
    const body = await req.json();
    const item = await prisma.schoolSettings.upsert({
      where: { id: "settings" },
      update: {
        schoolName: body.schoolName,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        motto: body.motto || null,
        schoolRegistrationNumber: body.schoolRegistrationNumber || null,
        logoUrl: body.logoUrl || null,
        coverUrl: body.coverUrl || null,
        primaryColor: body.primaryColor || "#102a56",
        secondaryColor: body.secondaryColor || "#167d72",
        accentColor: body.accentColor || "#f4b400",
        watermarkEnabled: body.watermarkEnabled !== false,
        watermarkOpacity: Math.min(20, Math.max(5, Number(body.watermarkOpacity) || 10)),
        watermarkPosition: body.watermarkPosition || "CENTER",
        watermarkAppliesTo: Array.isArray(body.watermarkAppliesTo) ? JSON.stringify(body.watermarkAppliesTo) : body.watermarkAppliesTo || "[\"RECEIPTS\",\"INVOICES\",\"FEE_STATEMENTS\",\"REPORT_CARDS\",\"CERTIFICATES\"]",
        attachments: stringifyAttachments(body.attachments),
        academicYear: body.academicYear,
        currentTerm: body.currentTerm,
      },
      create: {
        id: "settings",
        schoolName: body.schoolName || "My School",
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        motto: body.motto || null,
        schoolRegistrationNumber: body.schoolRegistrationNumber || null,
        logoUrl: body.logoUrl || null,
        coverUrl: body.coverUrl || null,
        primaryColor: body.primaryColor || "#102a56",
        secondaryColor: body.secondaryColor || "#167d72",
        accentColor: body.accentColor || "#f4b400",
        watermarkEnabled: body.watermarkEnabled !== false,
        watermarkOpacity: Math.min(20, Math.max(5, Number(body.watermarkOpacity) || 10)),
        watermarkPosition: body.watermarkPosition || "CENTER",
        watermarkAppliesTo: Array.isArray(body.watermarkAppliesTo) ? JSON.stringify(body.watermarkAppliesTo) : body.watermarkAppliesTo || "[\"RECEIPTS\",\"INVOICES\",\"FEE_STATEMENTS\",\"REPORT_CARDS\",\"CERTIFICATES\"]",
        attachments: stringifyAttachments(body.attachments),
        academicYear: body.academicYear || "2026",
        currentTerm: body.currentTerm || "Term 1",
      },
    });
    return NextResponse.json({ item });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update settings." }, { status: 400 });
  }
}

function parseAttachments(value: string | null) {
  try { return value ? JSON.parse(value) : []; } catch { return []; }
}

function stringifyAttachments(value: unknown) {
  return Array.isArray(value) && value.length ? JSON.stringify(value) : null;
}
