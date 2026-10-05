"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function MarksEntry({ examId }: { examId: string }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then((d) => setSubjects(d.items || []));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setRoster([]);
      return;
    }
    setLoading(true);
    setMessage("");
    fetch(`/api/exams/${examId}/results?subjectId=${subjectId}`)
      .then((r) => r.json())
      .then((d) => setRoster(d.items || []))
      .finally(() => setLoading(false));
  }, [subjectId, examId]);

  function setMarks(studentId: string, marks: string) {
    setRoster((prev) => prev.map((r) => (r.id === studentId ? { ...r, marks } : r)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/exams/${examId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          records: roster.map((r) => ({ studentId: r.id, marks: r.marks === "" ? null : Number(r.marks) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setMessage(`Marks saved for ${data.count} students.`);
      // reload to get computed grades
      const refreshed = await fetch(`/api/exams/${examId}/results?subjectId=${subjectId}`).then((r) => r.json());
      setRoster(refreshed.items || []);
    } catch (e: any) {
      setMessage(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function gradeBadge(grade: string) {
    if (!grade) return "badge-gray";
    if (grade === "A") return "badge-green";
    if (grade === "B") return "badge-navy";
    if (grade === "C") return "badge-yellow";
    if (grade === "D") return "badge-gray";
    return "badge-red";
  }

  return (
    <div>
      <div className="card p-5 mb-6">
        <label className="label">Subject</label>
        <select className="input max-w-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select subject...</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {subjectId && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <p className="text-sm text-slate-500">Enter marks out of 100. Grades are calculated automatically.</p>
            <button onClick={save} disabled={saving || roster.length === 0} className="btn-primary">
              <Icon name="check-circle" className="w-4 h-4" /> {saving ? "Saving..." : "Save Marks"}
            </button>
          </div>
          {message && <div className="px-4 py-2 text-sm text-brandGreen-700 bg-brandGreen-50">{message}</div>}
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading roster...</div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No students found for this exam's class.</div>
          ) : (
            <table className="table-base w-full">
              <thead><tr><th>Admission No.</th><th>Student</th><th>Marks</th><th>Grade</th></tr></thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id}>
                    <td>{r.admissionNumber}</td>
                    <td className="font-medium text-slate-800">{r.name}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input w-24"
                        value={r.marks}
                        onChange={(e) => setMarks(r.id, e.target.value)}
                      />
                    </td>
                    <td><span className={gradeBadge(r.grade)}>{r.grade || "—"}</span></td>
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
