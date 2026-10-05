"use client";

import CrudPage from "@/components/CrudPage";

export default function SubjectsPage() {
  return (
    <CrudPage
      title="Subjects"
      description="Manage the subjects taught across your school."
      apiPath="/api/subjects"
      searchKeys={["name", "code"]}
      addLabel="Add Subject"
      columns={[
        { key: "name", label: "Subject Name" },
        { key: "code", label: "Code" },
        { key: "creditUnits", label: "Credit Units" },
      ]}
      fields={[
        { name: "name", label: "Subject Name", required: true, colSpan: 1, placeholder: "e.g. Mathematics" },
        { name: "code", label: "Subject Code", required: true, colSpan: 1, placeholder: "e.g. MTH" },
        { name: "creditUnits", label: "Credit Units", type: "number", colSpan: 1 },
      ]}
    />
  );
}
