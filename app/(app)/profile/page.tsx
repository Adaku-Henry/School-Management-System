"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import FileUploadField from "@/components/FileUploadField";
import { ROLE_LABELS } from "@/lib/rbac";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setForm(d.item))
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          avatarUrl: typeof form.avatarUrl === "string" ? form.avatarUrl : form.avatarUrl?.url || null,
          attachments: form.attachments || [],
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      setForm(data.item);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile updated successfully.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>;
  if (!form) return <div className="p-10 text-center text-red-500 text-sm">{error || "Could not load profile."}</div>;

  const initials = (form.name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const avatarUrl = typeof form.avatarUrl === "string" ? form.avatarUrl : form.avatarUrl?.url;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">My Profile</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Manage your personal details and password.</p>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          {avatarUrl ? <img src={avatarUrl} alt={form.name} className="h-16 w-16 rounded-full object-cover" /> : (
            <div className="w-16 h-16 rounded-full bg-navy-900 text-white flex items-center justify-center text-xl font-bold">{initials}</div>
          )}
          <div>
            <p className="font-bold text-navy-900 text-lg">{form.name}</p>
            <p className="text-sm text-slate-500">{ROLE_LABELS[form.role as keyof typeof ROLE_LABELS] || form.role}</p>
            <p className="text-xs text-slate-400 mt-0.5">{form.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Profile Photo</label>
            <FileUploadField value={form.avatarUrl} imageOnly onChange={(avatarUrl) => setForm({ ...form, avatarUrl })} />
          </div>
          <div>
            <label className="label">Documents / Other Files</label>
            <FileUploadField value={form.attachments || []} multiple onChange={(attachments) => setForm({ ...form, attachments })} />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm font-semibold text-navy-900 mb-3">Change Password</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Current Password</label>
                <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Required to set a new password" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" />
              </div>
            </div>
          </div>

          {message && <div className="rounded-lg bg-brandGreen-50 border border-brandGreen-200 text-brandGreen-700 text-sm px-3 py-2">{message}</div>}
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

          <button type="submit" disabled={saving} className="btn-primary">
            <Icon name="check-circle" className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
