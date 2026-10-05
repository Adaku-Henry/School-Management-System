"use client";

import CrudPage from "@/components/CrudPage";

export default function PayrollPage() {
  return (
    <CrudPage
      title="Payroll"
      description="Generate and manage teacher payslips. Net salary is calculated automatically."
      apiPath="/api/payroll"
      color="navy"
      addLabel="Generate Payslip"
      searchKeys={["teacherName", "month", "year"]}
      columns={[
        { key: "teacherName", label: "Teacher" },
        { key: "month", label: "Month" },
        { key: "year", label: "Year" },
        { key: "basicSalary", label: "Basic", render: (r) => Number(r.basicSalary).toLocaleString() },
        { key: "allowances", label: "Allowances", render: (r) => Number(r.allowances).toLocaleString() },
        { key: "deductions", label: "Deductions", render: (r) => Number(r.deductions).toLocaleString() },
        {
          key: "netSalary", label: "Net Salary",
          render: (r) => <span className="font-semibold text-brandGreen-700">{Number(r.netSalary).toLocaleString()}</span>,
        },
      ]}
      fields={[
        {
          name: "teacherId", label: "Teacher", type: "select", required: true, colSpan: 2,
          optionsUrl: "/api/teachers",
          optionsMap: (t: any) => ({ value: t.id, label: t.name }),
        },
        { name: "month", label: "Month", type: "select", required: true, colSpan: 1, options: [
          "January","February","March","April","May","June","July","August","September","October","November","December",
        ].map((m) => ({ value: m, label: m })) },
        { name: "year", label: "Year", required: true, colSpan: 1, placeholder: "2026" },
        { name: "basicSalary", label: "Basic Salary (UGX)", type: "number", required: true, colSpan: 1 },
        { name: "allowances", label: "Allowances (UGX)", type: "number", colSpan: 1 },
        { name: "deductions", label: "Deductions (UGX)", type: "number", colSpan: 2 },
      ]}
    />
  );
}
