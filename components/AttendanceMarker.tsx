"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";

const STATUS_OPTIONS = ["Present", "Absent", "Sick", "Permission", "Late"];
const STATUS_COLORS: Record<string, string> = {
  Present: "badge-green",
  Absent: "badge-red",
  Sick: "badge-yellow",
  Permission: "badge-navy",
  Late: "badge-gray",
};

export default function AttendanceMarker() {
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then((d) => setClasses(d.items || []));
    fetch("/api/streams").then((r) => r.json()).then((d) => setStreams(d.items || []));
  }, []);

  const filteredStreams = useMemo(() => streams.filter((s) => s.classId === classId), [streams, classId]);

  useEffect(() => {
    if (!streamId || !date) {
      setRoster([]);
      return;
    }
    setLoading(true);
    fetch(`/api/attendance/roster?streamId=${streamId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => setRoster(d.items || []))
      .finally(() => setLoading(false));
  }, [streamId, date]);

  function setStatus(studentId: string, status: string) {
    setRoster((prev) => prev.map((r) => (r.id === studentId ? { ...r, status } : r)));
  }

  function markAll(status: string) {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records: roster.map((r) => ({ studentId: r.id, status: r.status })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setMessage(`Attendance saved for ${data.count} students.`);
    } catch (e: any) {
      setMessage(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="card p-5 mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setStreamId(""); }}>
              <option value="">Select class...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Stream</label>
            <select className="input" value={streamId} onChange={(e) => setStreamId(e.target.value)} disabled={!classId}>
              <option value="">Select stream...</option>
              {filteredStreams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {streamId && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => markAll(s)} className="btn-ghost text-xs py-1.5">
                  Mark all {s}
                </button>
              ))}
            </div>
            <button onClick={save} disabled={saving || roster.length === 0} className="btn-primary">
              <Icon name="check-circle" className="w-4 h-4" /> {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>

          {message && <div className="px-4 py-2 text-sm text-brandGreen-700 bg-brandGreen-50">{message}</div>}

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading roster...</div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No students found in this stream.</div>
          ) : (
            <table className="table-base w-full">
              <thead><tr><th>Admission No.</th><th>Student</th><th>Status</th></tr></thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id}>
                    <td>{r.admissionNumber}</td>
                    <td className="font-medium text-slate-800">{r.name}</td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(r.id, s)}
                            className={`${r.status === s ? STATUS_COLORS[s] : "badge-gray opacity-50"} hover:opacity-100`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
