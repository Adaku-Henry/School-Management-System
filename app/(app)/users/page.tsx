"use client";

import CrudPage from "@/components/CrudPage";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Administrator" },
  { value: "ADMIN", label: "School Administrator" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
  { value: "PARENT", label: "Parent" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "LIBRARIAN", label: "Librarian" },
  { value: "HOSTEL_WARDEN", label: "Hostel Warden" },
  { value: "NURSE", label: "Nurse" },
  { value: "SECURITY", label: "Security" },
];

export default function UsersPage() {
  return (
    <CrudPage
      title="Users & Roles"
      description="Create and manage login accounts for every role. Only the Super Administrator can access this page."
      apiPath="/api/users"
      color="navy"
      addLabel="Add User"
      searchKeys={["name", "email", "role"]}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        {
          key: "status", label: "Status",
          render: (r) => <span className={r.status === "ACTIVE" ? "badge-green" : "badge-red"}>{r.status}</span>,
        },
      ]}
      fields={[
        { name: "name", label: "Full Name", required: true, colSpan: 2 },
        { name: "email", label: "Email", type: "email", required: true, colSpan: 1 },
        { name: "phone", label: "Phone", colSpan: 1 },
        { name: "role", label: "Role", type: "select", required: true, colSpan: 1, options: ROLE_OPTIONS },
        {
          name: "status", label: "Status", type: "select", colSpan: 1,
          options: [{ value: "ACTIVE", label: "Active" }, { value: "SUSPENDED", label: "Suspended" }],
        },
        { name: "password", label: "Password", type: "password", colSpan: 2, placeholder: "Leave blank to keep unchanged when editing" },
      ]}
    />
  );
}
