import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUploadDirectory } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const directory = getUploadDirectory();
    const [contents, metadataText] = await Promise.all([
      readFile(path.join(directory, `${params.id}.bin`)),
      readFile(path.join(directory, `${params.id}.json`), "utf8"),
    ]);
    const metadata = JSON.parse(metadataText) as { name: string; type: string };
    const safeType = /^image\/(jpeg|png|gif|webp|bmp|avif)$/.test(metadata.type) ? metadata.type : "application/octet-stream";
    const disposition = safeType.startsWith("image/") ? "inline" : "attachment";
    const safeName = String(metadata.name || "download").replace(/[\r\n"\\]/g, "_");

    return new NextResponse(new Uint8Array(contents), {
      headers: {
        "Content-Type": safeType,
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Content-Length": String(contents.byteLength),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}