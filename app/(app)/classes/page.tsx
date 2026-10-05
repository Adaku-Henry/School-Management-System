"use client";

import CrudPage from "@/components/CrudPage";

export default function ClassesPage() {
  return (
    <div className="space-y-10">
      <CrudPage
        title="Classes"
        description="Manage the class levels offered at your school (e.g. Senior One, Senior Two)."
        apiPath="/api/classes"
        searchKeys={["name"]}
        addLabel="Add Class"
        columns={[
          { key: "name", label: "Class Name" },
          { key: "streams", label: "Streams", render: (r) => (r.streams?.length ? r.streams.map((s: any) => s.name).join(", ") : "—") },
          { key: "_count", label: "Students", render: (r) => r._count?.students ?? 0 },
        ]}
        fields={[
          { name: "name", label: "Class Name", required: true, placeholder: "e.g. Senior One" },
          { name: "order", label: "Display Order", type: "number", placeholder: "0" },
        ]}
      />

      <CrudPage
        title="Streams"
        description="Manage streams/sections within each class (e.g. Blue, Green, Red)."
        apiPath="/api/streams"
        searchKeys={["name"]}
        addLabel="Add Stream"
        color="green"
        columns={[
          { key: "name", label: "Stream Name" },
          { key: "className", label: "Class" },
          { key: "teacherName", label: "Class Teacher", render: (r) => r.teacherName || "Unassigned" },
        ]}
        fields={[
          { name: "name", label: "Stream Name", required: true, placeholder: "e.g. Blue" },
          { name: "classId", label: "Class", type: "select", required: true, optionsUrl: "/api/classes" },
          { name: "teacherId", label: "Class Teacher", type: "select", optionsUrl: "/api/teachers", optionsMap: (t: any) => ({ value: t.id, label: t.user?.name || t.employeeId }) },
        ]}
      />
    </div>
  );
}
