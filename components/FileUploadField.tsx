"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export type UploadedFile = { url: string; name: string; type: string; size: number };

export default function FileUploadField({
  value,
  multiple = false,
  imageOnly = false,
  onChange,
}: {
  value: UploadedFile | UploadedFile[] | string | null | undefined;
  multiple?: boolean;
  imageOnly?: boolean;
  onChange: (value: UploadedFile | UploadedFile[] | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const rawFiles: Array<UploadedFile | string> = multiple
    ? (Array.isArray(value) ? value as UploadedFile[] : [])
    : value ? [value as UploadedFile | string] : [];
  const files = rawFiles.map((file) => typeof file === "string"
    ? { url: file, name: file.split("/").pop() || "Uploaded file", type: imageOnly ? "image/unknown" : "", size: 0 }
    : file);

  async function upload(selected: FileList | null) {
    if (!selected?.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(selected)) {
        const form = new FormData();
        form.append("file", file);
        form.append("imageOnly", String(imageOnly));
        const response = await fetch("/api/uploads", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Could not upload ${file.name}.`);
        uploaded.push(data.file);
      }
      if (multiple) onChange([...files, ...uploaded]);
      else onChange(uploaded[0]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removeFile(file: UploadedFile) {
    if (multiple) onChange(files.filter((current) => current.url !== file.url));
    else onChange(null);
  }

  return (
    <div className="space-y-3">
      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-navy-700 hover:border-navy-500 hover:bg-navy-50">
        <Icon name="upload" className="h-4 w-4" />
        {uploading ? "Uploading..." : multiple ? "Choose files" : "Choose a file"}
        <input
          className="sr-only"
          type="file"
          accept={imageOnly ? "image/jpeg,image/png,image/gif,image/webp,image/bmp,image/avif" : "*/*"}
          multiple={multiple}
          disabled={uploading}
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.url} className="flex items-center gap-3 rounded-md border border-slate-200 p-2">
              {file.type?.startsWith("image/") ? (
                <img src={file.url} alt={file.name} className="h-12 w-12 rounded object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-100 text-navy-700">
                  <Icon name="file-text" className="h-5 w-5" />
                </span>
              )}
              <a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-navy-700 hover:underline">
                {file.name}
              </a>
              <button type="button" onClick={() => removeFile(file)} aria-label={`Remove ${file.name}`} className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                <Icon name="x" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">Any file type, up to 20 MB per file.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}