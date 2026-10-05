"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "superadmin@school.com" },
  { role: "School Admin", email: "admin@school.com" },
  { role: "Teacher", email: "teacher@school.com" },
  { role: "Student", email: "student@school.com" },
  { role: "Parent", email: "parent@school.com" },
  { role: "Accountant", email: "accountant@school.com" },
  { role: "Librarian", email: "librarian@school.com" },
  { role: "Hostel Warden", email: "warden@school.com" },
  { role: "Nurse", email: "nurse@school.com" },
  { role: "Security", email: "security@school.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@school.com");
  const [password, setPassword] = useState("password123");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-navy-800/60" />
        <div className="absolute -right-10 bottom-0 w-72 h-72 rounded-full bg-brandGreen-700/30" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brandYellow flex items-center justify-center">
            <Icon name="graduation-cap" className="w-6 h-6 text-navy-900" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">AUTOMATED SMS</p>
            <p className="text-navy-200 text-xs">School Management System</p>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            One platform for your <span className="text-brandYellow">entire school.</span>
          </h1>
          <p className="text-navy-200 max-w-md">
            Students, teachers, parents, fees, attendance, exams, library, hostel, transport
            and more all connected in a single, role-based system.
          </p>
          <div className="flex gap-6 pt-4">
            <div>
              <p className="text-2xl font-bold text-brandYellow">10</p>
              <p className="text-navy-300 text-xs">User Roles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brandGreen-400">20+</p>
              <p className="text-navy-300 text-xs">Modules</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-navy-300 text-xs">Connected</p>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-navy-400 text-xs">© 2026 AUTOMATED SCHOOL MANAGEMENT SYSTEM</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
              <Icon name="graduation-cap" className="w-6 h-6 text-brandYellow" />
            </div>
            <p className="font-bold text-navy-900 text-lg">AUTOMATED SMS</p>
          </div>

          <h2 className="text-2xl font-bold text-navy-900">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1 mb-8">Sign in to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-700"
                >
                  <Icon name={showPw ? "eye-off" : "eye"} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <Icon name="chevron-right" className="w-4 h-4" />}
            </button>
          </form>

          <button
            onClick={() => setShowDemo((s) => !s)}
            className="mt-6 text-xs font-semibold text-navy-600 hover:text-navy-900 flex items-center gap-1"
          >
            <Icon name="id-card" className="w-4 h-4" />
            {showDemo ? "Hide demo accounts" : "View demo accounts for every role"}
          </button>

          {showDemo && (
            <div className="mt-3 card p-3 max-h-64 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-2">
                Password for every account: <span className="font-mono font-semibold">password123</span>
              </p>
              <div className="space-y-1">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("password123");
                    }}
                    className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md hover:bg-brandYellow-50 text-sm"
                  >
                    <span className="font-medium text-navy-800">{acc.role}</span>
                    <span className="text-slate-400 text-xs">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
