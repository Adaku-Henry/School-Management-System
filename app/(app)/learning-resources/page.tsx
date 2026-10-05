"use client";

import CrudPage from "@/components/CrudPage";

export default function LearningResourcesPage() {
  return (
    <CrudPage
      title="Learning Resources"
      description="Notes, videos, PDFs and books shared with students."
      apiPath="/api/learning-resources"
      color="green"
      addLabel="Add Resource"
      searchKeys={["title", "type"]}
      columns={[
        { key: "title", label: "Title" },
        { key: "type", label: "Type" },
        {
          key: "url", label: "Link",
          render: (r) => r.url ? <a href={r.url} target="_blank" className="text-navy-700 underline">Open</a> : "-",
        },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        {
          name: "type", label: "Type", type: "select", required: true, colSpan: 1,
          options: [
            { value: "Notes", label: "Notes" }, { value: "Videos", label: "Videos" },
            { value: "PDFs", label: "PDFs" }, { value: "Books", label: "Books" },
          ],
        },
        { name: "subjectId", label: "Subject", type: "select", colSpan: 1, optionsUrl: "/api/subjects" },
        { name: "url", label: "URL", colSpan: 2, placeholder: "https://" },
      ]}
    />
  );
}
