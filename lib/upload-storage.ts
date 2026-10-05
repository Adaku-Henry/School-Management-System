import path from "node:path";

export function getUploadDirectory() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}