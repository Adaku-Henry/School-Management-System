"use client";

import CrudPage from "@/components/CrudPage";

export default function TransportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Transport</h1>
        <p className="text-sm text-slate-500 mt-1">Manage school vehicles, routes and student allocations.</p>
      </div>

      <CrudPage
        title="Vehicles"
        apiPath="/api/transport/vehicles"
        color="navy"
        addLabel="Add Vehicle"
        searchKeys={["plateNumber", "driverName"]}
        columns={[
          { key: "plateNumber", label: "Plate Number" },
          { key: "driverName", label: "Driver" },
          { key: "capacity", label: "Capacity" },
        ]}
        fields={[
          { name: "plateNumber", label: "Plate Number", required: true, colSpan: 1 },
          { name: "capacity", label: "Capacity", type: "number", required: true, colSpan: 1 },
          { name: "driverName", label: "Driver Name", colSpan: 2 },
        ]}
      />

      <CrudPage
        title="Routes"
        apiPath="/api/transport/routes"
        color="green"
        addLabel="Add Route"
        searchKeys={["name", "vehiclePlate"]}
        columns={[
          { key: "name", label: "Route" },
          { key: "vehiclePlate", label: "Vehicle" },
        ]}
        fields={[
          { name: "name", label: "Route Name", required: true, colSpan: 2, placeholder: "e.g. Route 1 - Ntinda" },
          {
            name: "vehicleId", label: "Vehicle", type: "select", colSpan: 2,
            optionsUrl: "/api/transport/vehicles",
            optionsMap: (v: any) => ({ value: v.id, label: v.plateNumber }),
          },
        ]}
      />

      <CrudPage
        title="Student Allocations"
        apiPath="/api/transport/allocations"
        color="yellow"
        addLabel="Allocate Student"
        searchKeys={["studentName", "routeName"]}
        columns={[
          { key: "studentName", label: "Student" },
          { key: "routeName", label: "Route" },
        ]}
        fields={[
          {
            name: "studentId", label: "Student", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/students",
            optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }),
          },
          {
            name: "routeId", label: "Route", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/transport/routes",
            optionsMap: (r: any) => ({ value: r.id, label: r.name }),
          },
        ]}
      />
    </div>
  );
}
