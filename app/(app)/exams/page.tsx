"use client";

import CrudPage from "@/components/CrudPage";

export default function ExamsPage() {
  return (
    <CrudPage
      title="Examinations"
      description="Create exams (CAT, Midterm, End of Term) and enter results per subject."
      apiPath="/api/exams"
      searchKeys={["name", "term", "academicYear"]}
      addLabel="Create Exam"
      rowHref={(r) => `/exams/${r.id}`}
      columns={[
        { key: "name", label: "Exam Name" },
        { key: "type", label: "Type" },
        { key: "className", label: "Class", render: (r) => r.className || "All Classes" },
        { key: "term", label: "Term" },
        { key: "academicYear", label: "Year" },
        { key: "resultsCount", label: "Results Entered" },
      ]}
      fields={[
        { name: "name", label: "Exam Name", required: true, placeholder: "e.g. Midterm Exam", colSpan: 2 },
        { name: "type", label: "Type", type: "select", options: [
          { value: "CAT", label: "CAT" },
          { value: "Midterm", label: "Midterm" },
          { value: "End of Term", label: "End of Term" },
        ], colSpan: 1 },
        { name: "classId", label: "Class", type: "select", optionsUrl: "/api/classes", required: true, colSpan: 1 },
        { name: "term", label: "Term", required: true, colSpan: 1, placeholder: "e.g. Term 2" },
        { name: "academicYear", label: "Academic Year", required: true, colSpan: 1, placeholder: "e.g. 2026" },
        { name: "date", label: "Exam Date", type: "date", colSpan: 2 },
      ]}
    />
  );
}
