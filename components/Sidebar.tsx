"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import { navForRole, ROLE_LABELS } from "@/lib/rbac";

export default function Sidebar({ role, schoolName, schoolLogoUrl }: { role: string; schoolName?: string; schoolLogoUrl?: string | null }) {
  const pathname = usePathname();
  const nav = navForRole(role);
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full bg-navy-900 text-white w-64 shrink-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
        {schoolLogoUrl ? <img src={schoolLogoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain" /> : (
          <div className="w-9 h-9 rounded-lg bg-brandYellow flex items-center justify-center shrink-0">
            <Icon name="graduation-cap" className="w-5 h-5 text-navy-900" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">{schoolName || "Greenfield SMS"}</p>
          <p className="text-navy-300 text-[11px] truncate">{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brandYellow text-navy-900"
                  : "text-navy-100 hover:bg-navy-800 hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-navy-700 text-[11px] text-navy-400">
        {schoolName || "Greenfield High School"} &copy; 2026
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{content}</div>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 bg-navy-900 text-white p-2 rounded-lg shadow-md"
        aria-label="Open menu"
      >
        <Icon name="layout-dashboard" className="w-5 h-5" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="relative z-50">{content}</div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-50 text-white bg-navy-800 p-1.5 rounded-md lg:hidden"
            style={{ left: "16.5rem" }}
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
