"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import Icon from "@/components/Icon";

type DashboardData = {
  totals: Record<string, number>;
  upcomingEvents: any[];
  recentAnnouncements: any[];
  myChildren: any[];
  myResults: any[];
  myFees: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([dash, me]) => {
        setData(dash);
        setRole(me?.user?.role || "");
        setName(me?.user?.name || "");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="p-10 text-center text-slate-400 text-sm">Loading dashboard...</div>;

  const t = data.totals;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Welcome back, {name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Admin / Super Admin */}
      {(role === "SUPER_ADMIN" || role === "ADMIN") && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={t.totalStudents} icon="users" color="navy" />
          <StatCard label="Total Teachers" value={t.totalTeachers} icon="user-check" color="green" />
          <StatCard label="Total Parents" value={t.totalParents} icon="users-round" color="yellow" />
          <StatCard label="Total Classes" value={t.totalClasses} icon="school" color="navy" />
          <StatCard label="Fees Collected" value={`UGX ${t.revenueCollected.toLocaleString()}`} icon="banknote" color="green" />
          <StatCard label="Outstanding Fees" value={`UGX ${t.outstanding.toLocaleString()}`} icon="wallet" color="red" />
          <StatCard label="Present Today" value={t.presentToday} icon="calendar-check" color="green" sub={`${t.absentToday} absent`} />
          <StatCard label="Staff (Support)" value={t.totalStaff} icon="shield" color="yellow" />
        </div>
      )}

      {/* Teacher */}
      {role === "TEACHER" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="My Classes" value={t.myClasses} icon="school" color="navy" />
          <StatCard label="Present Today" value={t.presentToday} icon="calendar-check" color="green" />
          <StatCard label="Absent Today" value={t.absentToday} icon="shield-alert" color="yellow" />
        </div>
      )}

      {/* Accountant */}
      {role === "ACCOUNTANT" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Fees Collected" value={`UGX ${t.revenueCollected.toLocaleString()}`} icon="banknote" color="green" />
          <StatCard label="Outstanding Fees" value={`UGX ${t.outstanding.toLocaleString()}`} icon="wallet" color="red" />
          <StatCard label="Fees Expected" value={`UGX ${t.revenueExpected.toLocaleString()}`} icon="bar-chart-3" color="navy" />
        </div>
      )}

      {/* Librarian */}
      {role === "LIBRARIAN" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Books Out on Loan" value={t.pendingBooks} icon="library" color="yellow" />
        </div>
      )}

      {/* Hostel Warden / Nurse */}
      {(role === "HOSTEL_WARDEN" || role === "NURSE") && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Students in Hostel" value={t.hostelOccupied} icon="building-2" color="navy" />
        </div>
      )}

      {/* Student */}
      {role === "STUDENT" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card p-5">
            <p className="text-sm font-semibold text-navy-900 mb-3">Recent Results</p>
            {data.myResults.length === 0 ? (
              <p className="text-sm text-slate-400">No results recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.myResults.map((r: any) => (
                  <li key={r.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{r.subject?.name}</span>
                    <span className="font-semibold text-navy-900">{r.marks} ({r.grade})</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/report-cards" className="text-xs text-navy-700 font-semibold hover:underline mt-3 inline-block">
              View full report card &rarr;
            </Link>
          </div>
          <StatCard label="Total Fees Paid" value={`UGX ${data.myFees.toLocaleString()}`} icon="banknote" color="green" />
        </div>
      )}

      {/* Parent */}
      {role === "PARENT" && (
        <div>
          <p className="text-sm font-semibold text-navy-900 mb-3">My Children</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.myChildren.length === 0 ? (
              <p className="text-sm text-slate-400">No children linked to your account yet.</p>
            ) : (
              data.myChildren.map((c: any) => (
                <div key={c.id} className="card p-4">
                  <p className="font-semibold text-navy-900">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.class?.name} {c.stream?.name}</p>
                  <Link href={`/students/${c.id}`} className="text-xs text-navy-700 font-semibold hover:underline mt-2 inline-block">
                    View Profile &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Security */}
      {role === "SECURITY" && (
        <div className="card p-6 text-sm text-slate-500">
          Use the sidebar to register visitors and record student movement. Recent incidents will appear here.
        </div>
      )}

      {/* Common: announcements + events for everyone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-navy-900">Recent Announcements</p>
            <Link href="/announcements" className="text-xs text-navy-700 hover:underline">View all</Link>
          </div>
          {data.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-400">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentAnnouncements.map((a: any) => (
                <li key={a.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brandYellow-100 text-brandYellow-600 flex items-center justify-center shrink-0">
                    <Icon name="megaphone" className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">{a.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{a.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-navy-900">Upcoming Events</p>
            <Link href="/events" className="text-xs text-navy-700 hover:underline">View all</Link>
          </div>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingEvents.map((e: any) => (
                <li key={e.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brandGreen-100 text-brandGreen-700 flex items-center justify-center shrink-0">
                    <Icon name="calendar-days" className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">{e.title}</p>
                    <p className="text-xs text-slate-500">{new Date(e.date).toLocaleDateString()} &middot; {e.category}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
