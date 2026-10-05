import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUploadDirectory } from "@/lib/upload-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/avif"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Files must be between 1 byte and 20 MB." }, { status: 400 });
    }
    if (form.get("imageOnly") === "true" && !SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Choose a JPEG, PNG, GIF, WebP, BMP, or AVIF image." }, { status: 400 });
    }

    const id = randomUUID();
    const directory = getUploadDirectory();
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${id}.bin`), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    await writeFile(
      path.join(directory, `${id}.json`),
      JSON.stringify({ name: file.name, type: file.type, size: file.size }),
      { flag: "wx" },
    );

    return NextResponse.json({
      file: { url: `/api/uploads/${id}`, name: file.name, type: file.type, size: file.size },
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The file could not be uploaded." }, { status: 500 });
  }
}