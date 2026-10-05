import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

// A small factory that generates consistent GET/POST (collection) and
// GET/PUT/DELETE (item) handlers for a Prisma model, so every module's
// API routes behave the same way and stay easy to maintain.

type Delegate = any;

type ListOptions = {
  include?: any;
  orderBy?: any;
  transformIn?: (body: any) => any; // shape incoming body before create/update
  transformOut?: (row: any) => any; // shape outgoing row before sending to client
};

export function collectionHandlers(delegate: Delegate, opts: ListOptions = {}) {
  async function GET() {
    try {
      const items = await delegate.findMany({
        include: opts.include,
        orderBy: opts.orderBy || { id: "desc" },
      });
      const out = opts.transformOut ? items.map(opts.transformOut) : items;
      return NextResponse.json({ items: out });
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: "Failed to load records." }, { status: 500 });
    }
  }

  async function POST(req: NextRequest) {
    try {
      const raw = await req.json();
      const data = opts.transformIn ? opts.transformIn(raw) : raw;
      const item = await delegate.create({ data, include: opts.include });
      return NextResponse.json({ item }, { status: 201 });
    } catch (err: any) {
      console.error(err);
      const message = friendlyPrismaError(err);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return { GET, POST };
}

export function itemHandlers(delegate: Delegate, opts: ListOptions = {}) {
  async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const item = await delegate.findUnique({ where: { id: params.id }, include: opts.include });
      if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ item: opts.transformOut ? opts.transformOut(item) : item });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to load record." }, { status: 500 });
    }
  }

  async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const raw = await req.json();
      const data = opts.transformIn ? opts.transformIn(raw) : raw;
      const item = await delegate.update({ where: { id: params.id }, data, include: opts.include });
      return NextResponse.json({ item });
    } catch (err: any) {
      console.error(err);
      const message = friendlyPrismaError(err);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      await delegate.delete({ where: { id: params.id } });
      return NextResponse.json({ ok: true });
    } catch (err: any) {
      console.error(err);
      const message = friendlyPrismaError(err);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return { GET, PUT, DELETE };
}

function friendlyPrismaError(err: any): string {
  if (err?.code === "P2002") {
    const field = err?.meta?.target?.join?.(", ") || "field";
    return `A record with that ${field} already exists.`;
  }
  if (err?.code === "P2025") return "Record not found.";
  if (err?.code === "P2003") return "This record is linked to other data and cannot be changed that way.";
  return err?.message || "Something went wrong.";
}
