"use client";

import CrudPage from "@/components/CrudPage";

export default function TeachersPage() {
  return (
    <CrudPage
      title="Teachers"
      description="Manage teaching staff, qualifications, and subject assignments."
      apiPath="/api/teachers"
      searchKeys={["name", "email", "employeeId"]}
      addLabel="Add Teacher"
      rowHref={(r) => `/teachers/${r.id}`}
      columns={[
        { key: "name", label: "Name", render: (r) => (
          <div className="flex items-center gap-2">
            {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-800">{r.name?.[0]}</span>}
            <span>{r.name}</span>
          </div>
        ) },
        { key: "employeeId", label: "Employee ID" },
        { key: "email", label: "Email" },
        { key: "subjectNames", label: "Subjects", render: (r) => r.subjectNames || "—" },
        {
          key: "status",
          label: "Status",
          render: (r) => <span className={r.status === "ACTIVE" ? "badge-green" : "badge-red"}>{r.status}</span>,
        },
      ]}
      fields={[
        { name: "name", label: "Full Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "avatarUrl", label: "Profile Photo", type: "file", imageOnly: true },
        { name: "attachments", label: "Documents / Other Files", type: "files" },
        { name: "phone", label: "Phone", colSpan: 1 },
        { name: "employeeId", label: "Employee ID", required: true, colSpan: 1 },
        { name: "qualification", label: "Qualification", colSpan: 2 },
        { name: "experience", label: "Experience", colSpan: 1, placeholder: "e.g. 5 years" },
        { name: "salary", label: "Monthly Salary (UGX)", type: "number", colSpan: 1 },
        { name: "subjectId", label: "Primary Subject", type: "select", optionsUrl: "/api/subjects", colSpan: 2 },
        { name: "password", label: "Login Password (new teachers only)", type: "password", colSpan: 2, placeholder: "Default: password123" },
      ]}
    />
  );
}
