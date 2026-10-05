"use client";

import CrudPage from "@/components/CrudPage";

export default function AssignmentsPage() {
  return (
    <CrudPage
      title="Assignments"
      description="Teachers upload assignments for their classes; submissions are tracked automatically."
      apiPath="/api/assignments"
      color="navy"
      addLabel="Upload Assignment"
      searchKeys={["title"]}
      columns={[
        { key: "title", label: "Title" },
        { key: "dueDate", label: "Due Date", render: (r) => new Date(r.dueDate).toLocaleDateString() },
        { key: "submissionCount", label: "Submissions" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        { name: "subjectId", label: "Subject", type: "select", colSpan: 1, optionsUrl: "/api/subjects" },
        { name: "classId", label: "Class", type: "select", colSpan: 1, optionsUrl: "/api/classes" },
        { name: "dueDate", label: "Due Date", type: "date", required: true, colSpan: 2 },
      ]}
    />
  );
}
