"use client";

import CrudPage from "@/components/CrudPage";

export default function StudentsPage() {
  return (
    <CrudPage
      title="Students"
      description="Register new students and manage the complete student lifecycle."
      apiPath="/api/students"
      searchKeys={["firstName", "lastName", "admissionNumber", "className"]}
      addLabel="Register Student"
      rowHref={(r) => `/students/${r.id}`}
      columns={[
        { key: "firstName", label: "Name", render: (r) => (
          <div className="flex items-center gap-2">
            {r.photoUrl ? <img src={r.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-800">{r.firstName?.[0]}{r.lastName?.[0]}</span>}
            <span>{r.firstName} {r.lastName}</span>
          </div>
        ) },
        { key: "admissionNumber", label: "Admission No." },
        { key: "className", label: "Class", render: (r) => `${r.className || "—"} ${r.streamName || ""}` },
        { key: "gender", label: "Gender" },
        { key: "category", label: "Category" },
        {
          key: "status",
          label: "Status",
          render: (r) => (
            <span className={r.status === "ACTIVE" ? "badge-green" : r.status === "SUSPENDED" ? "badge-yellow" : "badge-gray"}>
              {r.status}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "admissionNumber", label: "Admission Number", required: true, colSpan: 1 },
        { name: "category", label: "Category", type: "select", colSpan: 1, options: [
          { value: "Day", label: "Day" },
          { value: "Boarding", label: "Boarding" },
        ] },
        { name: "firstName", label: "First Name", required: true, colSpan: 1 },
        { name: "lastName", label: "Last Name", required: true, colSpan: 1 },
        { name: "photoUrl", label: "Student Profile Photo", type: "file", imageOnly: true, colSpan: 2 },
        { name: "attachments", label: "Documents / Other Files", type: "files", colSpan: 2 },
        { name: "middleName", label: "Middle Name", colSpan: 1 },
        { name: "gender", label: "Gender", type: "select", colSpan: 1, options: [
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
        ] },
        { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true, colSpan: 1 },
        { name: "nationality", label: "Nationality", colSpan: 1 },
        { name: "classId", label: "Class", type: "select", optionsUrl: "/api/classes", colSpan: 1 },
        { name: "streamId", label: "Stream", type: "select", optionsUrl: "/api/streams", optionsMap: (s: any) => ({ value: s.id, label: `${s.className} - ${s.name}` }), colSpan: 1 },
        { name: "parentId", label: "Parent / Guardian", type: "select", optionsUrl: "/api/parents", optionsMap: (p: any) => ({ value: p.id, label: p.name }), colSpan: 2 },
        { name: "bloodGroup", label: "Blood Group", colSpan: 1 },
        { name: "allergies", label: "Allergies", colSpan: 1 },
        { name: "medicalConditions", label: "Medical Conditions", colSpan: 2 },
        { name: "address", label: "Home Address", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}
