"use client";

import CrudPage from "@/components/CrudPage";

export default function HostelPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Hostel Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage rooms and student allocations.</p>
      </div>

      <CrudPage
        title="Rooms"
        apiPath="/api/hostel/rooms"
        color="navy"
        addLabel="Add Room"
        searchKeys={["name"]}
        columns={[
          { key: "name", label: "Room" },
          { key: "capacity", label: "Capacity" },
          {
            key: "occupied", label: "Occupied",
            render: (r) => (
              <span className={r.occupied >= r.capacity ? "badge-red" : "badge-green"}>
                {r.occupied} / {r.capacity}
              </span>
            ),
          },
        ]}
        fields={[
          { name: "name", label: "Room Name", required: true, colSpan: 2, placeholder: "e.g. Dorm A - Room 1" },
          { name: "capacity", label: "Capacity", type: "number", required: true, colSpan: 2 },
        ]}
      />

      <CrudPage
        title="Room Allocations"
        apiPath="/api/hostel/allocations"
        color="yellow"
        addLabel="Allocate Room"
        searchKeys={["studentName", "roomName"]}
        columns={[
          { key: "studentName", label: "Student" },
          { key: "roomName", label: "Room" },
          { key: "allocatedAt", label: "Allocated On", render: (r) => new Date(r.allocatedAt).toLocaleDateString() },
        ]}
        fields={[
          {
            name: "studentId", label: "Student", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/students",
            optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }),
          },
          {
            name: "roomId", label: "Room", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/hostel/rooms",
            optionsMap: (r: any) => ({ value: r.id, label: `${r.name} (${r.occupied ?? 0}/${r.capacity})` }),
          },
        ]}
      />
    </div>
  );
}
