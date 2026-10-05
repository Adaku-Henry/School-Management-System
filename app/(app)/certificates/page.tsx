"use client";

import CrudPage from "@/components/CrudPage";

export default function CertificatesPage() {
  return (
    <CrudPage
      title="Certificates"
      description="Issue leaving certificates, completion certificates and transcripts."
      apiPath="/api/certificates"
      color="navy"
      addLabel="Issue Certificate"
      searchKeys={["studentName", "type"]}
      columns={[
        { key: "studentName", label: "Student" },
        { key: "type", label: "Type" },
        { key: "issueDate", label: "Issued On", render: (r) => new Date(r.issueDate).toLocaleDateString() },
      ]}
      fields={[
        {
          name: "studentId", label: "Student", type: "select", required: true, colSpan: 2,
          optionsUrl: "/api/students",
          optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }),
        },
        {
          name: "type", label: "Certificate Type", type: "select", required: true, colSpan: 2,
          options: [
            { value: "Leaving Certificate", label: "Leaving Certificate" },
            { value: "Completion Certificate", label: "Completion Certificate" },
            { value: "Transcript", label: "Transcript" },
          ],
        },
      ]}
    />
  );
}
