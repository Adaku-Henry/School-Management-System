"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import FileUploadField from "@/components/FileUploadField";

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setForm(d.item))
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          logoUrl: typeof form.logoUrl === "string" ? form.logoUrl : form.logoUrl?.url || null,
          coverUrl: typeof form.coverUrl === "string" ? form.coverUrl : form.coverUrl?.url || null,
          attachments: form.attachments || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");
      setForm(data.item);
      setMessage("Settings saved successfully.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>;
  if (!form) return <div className="p-10 text-center text-red-500 text-sm">{error || "Could not load settings."}</div>;

  let watermarkTargets: string[] = [];
  try { watermarkTargets = JSON.parse(form.watermarkAppliesTo || "[]"); } catch { watermarkTargets = []; }
  const documentTypes = ["RECEIPTS", "INVOICES", "FEE_STATEMENTS", "REPORT_CARDS", "CERTIFICATES"];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">School Settings</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Core information used across the system: report cards, receipts and certificates.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">School Name</label>
          <input className="input" value={form.schoolName || ""} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">School Motto</label><input className="input" value={form.motto || ""} onChange={(e) => setForm({ ...form, motto: e.target.value })} /></div>
          <div><label className="label">Registration Number</label><input className="input" value={form.schoolRegistrationNumber || ""} onChange={(e) => setForm({ ...form, schoolRegistrationNumber: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Academic Year</label>
            <input className="input" value={form.academicYear || ""} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required />
          </div>
          <div>
            <label className="label">Current Term</label>
            <select className="input" value={form.currentTerm || ""} onChange={(e) => setForm({ ...form, currentTerm: e.target.value })}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" type="url" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://school.example" />
        </div>
        <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
          <div>
            <label className="label">School Logo</label>
            <FileUploadField value={form.logoUrl} imageOnly onChange={(logoUrl) => setForm({ ...form, logoUrl })} />
          </div>
          <div>
            <label className="label">School Cover Image</label>
            <FileUploadField value={form.coverUrl} imageOnly onChange={(coverUrl) => setForm({ ...form, coverUrl })} />
          </div>
        </div>
        <div>
          <label className="label">School Documents / Other Files</label>
          <FileUploadField value={form.attachments || []} multiple onChange={(attachments) => setForm({ ...form, attachments })} />
        </div>
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {[["primaryColor", "Primary color"], ["secondaryColor", "Secondary color"], ["accentColor", "Accent color"]].map(([key, label]) => (
              <div key={key}><label className="label">{label}</label><input className="h-10 w-full cursor-pointer rounded border border-slate-200 p-1" type="color" value={form[key] || "#102a56"} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.watermarkEnabled !== false} onChange={(e) => setForm({ ...form, watermarkEnabled: e.target.checked })} /> Enable school logo watermark</label>
            <label className="flex items-center gap-2 text-sm text-slate-600">Opacity <input className="input w-20" type="number" min={5} max={20} value={form.watermarkOpacity ?? 10} onChange={(e) => setForm({ ...form, watermarkOpacity: Number(e.target.value) })} />%</label>
            <label className="flex items-center gap-2 text-sm text-slate-600">Position <select className="input w-32" value={form.watermarkPosition || "CENTER"} onChange={(e) => setForm({ ...form, watermarkPosition: e.target.value })}><option value="CENTER">Center</option><option value="DIAGONAL">Diagonal</option></select></label>
          </div>
          <fieldset>
            <legend className="label">Apply watermark to</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">{documentTypes.map((type) => <label key={type} className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={watermarkTargets.includes(type)} onChange={(event) => {
              const next = event.target.checked ? [...watermarkTargets, type] : watermarkTargets.filter((item) => item !== type);
              setForm({ ...form, watermarkAppliesTo: JSON.stringify(next) });
            }} />{type.replaceAll("_", " ")}</label>)}</div>
          </fieldset>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        {message && <div className="rounded-lg bg-brandGreen-50 border border-brandGreen-200 text-brandGreen-700 text-sm px-3 py-2">{message}</div>}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

        <button type="submit" disabled={saving} className="btn-primary">
          <Icon name="check-circle" className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
