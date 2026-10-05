"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const CATEGORIES = ["ALL", "FINANCE", "ACADEMIC", "ATTENDANCE", "ANNOUNCEMENTS", "SECURITY"];

function dateLabel(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [category, setCategory] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [preference, setPreference] = useState<any>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (unreadOnly) query.set("unread", "true");
      if (category !== "ALL") query.set("category", category);
      const [notificationResponse, preferenceResponse, userResponse] = await Promise.all([
        fetch(`/api/notifications?${query.toString()}`),
        fetch("/api/notification-preferences"),
        fetch("/api/auth/me"),
      ]);
      const [notificationData, preferenceData, userData] = await Promise.all([
        notificationResponse.json(), preferenceResponse.json(), userResponse.json(),
      ]);
      if (!notificationResponse.ok) throw new Error(notificationData.error || "Could not load notifications.");
      if (!preferenceResponse.ok) throw new Error(preferenceData.error || "Could not load notification preferences.");
      setItems(notificationData.items || []);
      setUnreadCount(notificationData.unreadCount || 0);
      setPreference(preferenceData);
      setRole(userData.user?.role || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [category, unreadOnly]);

  async function updateNotification(id: string, action: "MARK_READ" | "ARCHIVE") {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not update notification.");
      return;
    }
    await load();
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    });
    if (!response.ok) {
      setError("Could not mark notifications as read.");
      return;
    }
    await load();
  }

  async function savePreferences(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: preference.channels,
          studentFinanceVisibility: preference.studentFinanceVisibility,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save preferences.");
      setPreference(data);
      setMessage("Preferences saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Your school updates and account alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-navy">{unreadCount} unread</span>
          {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} className="btn-ghost">Mark all read</button>}
        </div>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-md border border-brandGreen-200 bg-brandGreen-50 px-3 py-2 text-sm text-brandGreen-700">{message}</p>}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded px-3 py-1.5 text-xs font-semibold ${category === item ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item.replaceAll("_", " ")}</button>)}
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} /> Unread only</label>
          </div>
        </div>

        {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading...</div> : items.length === 0 ? (
          <div className="p-10 text-center"><Icon name="bell" className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm text-slate-500">No notifications in this view.</p></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => <li key={item.id} className={`flex gap-3 p-4 ${item.readAt ? "bg-white" : "bg-sky-50/60"}`}>
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-300" : "bg-navy-600"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-navy-900">{item.title}</p><span className="badge-gray">{item.category}</span>{item.priority === "URGENT" && <span className="badge-red">URGENT</span>}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">{dateLabel(item.createdAt)}</p>
                <div className="mt-2 flex gap-3">
                  {item.href && <Link href={item.href} onClick={() => { if (!item.readAt) void updateNotification(item.id, "MARK_READ"); }} className="text-xs font-semibold text-navy-700 hover:underline">Open</Link>}
                  {!item.readAt && <button type="button" onClick={() => void updateNotification(item.id, "MARK_READ")} className="text-xs text-slate-500 hover:text-navy-700">Mark read</button>}
                  <button type="button" onClick={() => void updateNotification(item.id, "ARCHIVE")} className="text-xs text-slate-500 hover:text-navy-700">Archive</button>
                </div>
              </div>
            </li>)}
          </ul>
        )}
      </section>

      {preference && <section className="card p-5">
        <h2 className="font-bold text-navy-900">Notification preferences</h2>
        <p className="mt-1 text-sm text-slate-500">In-app notifications are active. External delivery channels require a configured provider.</p>
        <form onSubmit={savePreferences} className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={preference.channels?.IN_APP !== false} onChange={(event) => setPreference({ ...preference, channels: { ...preference.channels, IN_APP: event.target.checked } })} /> In-app alerts</label>
          {role === "STUDENT" && <div className="max-w-sm"><label className="label">Financial notification detail</label><select className="input" value={preference.studentFinanceVisibility || "NONE"} onChange={(event) => setPreference({ ...preference, studentFinanceVisibility: event.target.value })}><option value="NONE">No financial notifications</option><option value="STATUS">Payment status only</option><option value="FULL">Full financial details</option></select></div>}
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save preferences"}</button>
        </form>
      </section>}
    </div>
  );
}