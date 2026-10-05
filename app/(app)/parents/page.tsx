"use client";

import CrudPage from "@/components/CrudPage";

export default function ParentsPage() {
  return (
    <CrudPage
      title="Parents / Guardians"
      description="Manage parent accounts and link them to their children."
      apiPath="/api/parents"
      searchKeys={["name", "email", "childrenNames"]}
      addLabel="Add Parent"
      columns={[
        { key: "name", label: "Name", render: (r) => (
          <div className="flex items-center gap-2">
            {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-800">{r.name?.[0]}</span>}
            <span>{r.name}</span>
          </div>
        ) },
        { key: "email", label: "Email" },
        { key: "relationship", label: "Relationship" },
        { key: "childrenNames", label: "Children", render: (r) => r.childrenNames || "Not linked yet" },
      ]}
      fields={[
        { name: "name", label: "Full Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "avatarUrl", label: "Profile Photo", type: "file", imageOnly: true },
        { name: "attachments", label: "Documents / Other Files", type: "files" },
        { name: "phone", label: "Phone", colSpan: 1 },
        { name: "relationship", label: "Relationship", type: "select", colSpan: 1, options: [
          { value: "Father", label: "Father" },
          { value: "Mother", label: "Mother" },
          { value: "Guardian", label: "Guardian" },
        ] },
        { name: "occupation", label: "Occupation", colSpan: 2 },
        { name: "studentId", label: "Link to Child (Student)", type: "select", optionsUrl: "/api/students", optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }), colSpan: 2 },
        { name: "password", label: "Login Password (new parents only)", type: "password", colSpan: 2, placeholder: "Default: password123" },
      ]}
    />
  );
}
