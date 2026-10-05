"use client";

import CrudPage from "@/components/CrudPage";

export default function DisciplinePage() {
  return (
    <CrudPage
      title="Discipline"
      description="Record warnings, misconduct, suspensions and commendations."
      apiPath="/api/discipline"
      color="navy"
      addLabel="Add Record"
      searchKeys={["studentName", "type"]}
      columns={[
        { key: "studentName", label: "Student" },
        {
          key: "type", label: "Type",
          render: (r) => (
            <span className={r.type === "Reward" ? "badge-green" : r.type === "Suspension" ? "badge-red" : "badge-yellow"}>
              {r.type}
            </span>
          ),
        },
        { key: "description", label: "Description" },
        { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
      ]}
      fields={[
        {
          name: "studentId", label: "Student", type: "select", required: true, colSpan: 2,
          optionsUrl: "/api/students",
          optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }),
        },
        {
          name: "type", label: "Type", type: "select", required: true, colSpan: 2,
          options: [
            { value: "Warning", label: "Warning" },
            { value: "Suspension", label: "Suspension" },
            { value: "Misconduct", label: "Misconduct" },
            { value: "Reward", label: "Reward" },
          ],
        },
        { name: "description", label: "Description", type: "textarea", required: true, colSpan: 2 },
      ]}
    />
  );
}
