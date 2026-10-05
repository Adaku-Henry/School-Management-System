"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/rbac";
import type { SessionPayload } from "@/lib/auth";

export default function Topbar({ session, avatarUrl }: { session: SessionPayload; avatarUrl?: string | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const refreshUnread = () => fetch("/api/notifications?unread=true")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setUnreadCount(data.unreadCount || 0); })
      .catch(() => setUnreadCount(0));
    void refreshUnread();
    const interval = window.setInterval(() => { void refreshUnread(); }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <div className="lg:hidden w-8" />
      <div className="hidden sm:block">
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <Link href="/notifications" aria-label={`${unreadCount} unread notifications`} className="relative text-slate-500 hover:text-navy-900">
          <Icon name="bell" className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100"
          >
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : (
              <div className="w-8 h-8 rounded-full bg-brandGreen text-white flex items-center justify-center text-xs font-bold">{initials}</div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-navy-900 leading-tight">{session.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {ROLE_LABELS[session.role as keyof typeof ROLE_LABELS] || session.role}
              </p>
            </div>
            <Icon name="chevron-down" className="w-4 h-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Icon name="user" className="w-4 h-4" /> My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Icon name="log-out" className="w-4 h-4" /> {loading ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
