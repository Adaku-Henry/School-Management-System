"use client";

import CrudPage from "@/components/CrudPage";

export default function AnnouncementsPage() {
  return (
    <CrudPage
      title="Announcements"
      description="Post school-wide or role-targeted announcements. Everyone sees announcements meant for them."
      apiPath="/api/announcements"
      color="yellow"
      addLabel="New Announcement"
      searchKeys={["title", "message", "authorName"]}
      columns={[
        { key: "title", label: "Title" },
        { key: "targetRole", label: "Audience" },
        { key: "authorName", label: "Posted By" },
        { key: "createdAt", label: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        { name: "message", label: "Message", type: "textarea", required: true, colSpan: 2 },
        {
          name: "targetRole", label: "Audience", type: "select", colSpan: 2,
          options: [
            { value: "ALL", label: "Everyone" },
            { value: "TEACHER", label: "Teachers" },
            { value: "STUDENT", label: "Students" },
            { value: "PARENT", label: "Parents" },
            { value: "ADMIN", label: "Administrators" },
          ],
        },
      ]}
    />
  );
}
