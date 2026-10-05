"use client";

import CrudPage from "@/components/CrudPage";

export default function InventoryPage() {
  return (
    <CrudPage
      title="Inventory"
      description="Track school equipment, furniture and supplies."
      apiPath="/api/inventory"
      color="navy"
      addLabel="Add Item"
      searchKeys={["name", "category", "location"]}
      columns={[
        { key: "name", label: "Item" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        {
          key: "condition", label: "Condition",
          render: (r) => (
            <span className={r.condition === "Good" ? "badge-green" : r.condition === "Fair" ? "badge-yellow" : "badge-red"}>
              {r.condition}
            </span>
          ),
        },
        { key: "location", label: "Location" },
      ]}
      fields={[
        { name: "name", label: "Item Name", required: true, colSpan: 2 },
        { name: "category", label: "Category", required: true, colSpan: 1, placeholder: "e.g. Computers" },
        { name: "quantity", label: "Quantity", type: "number", required: true, colSpan: 1 },
        {
          name: "condition", label: "Condition", type: "select", colSpan: 1,
          options: [{ value: "Good", label: "Good" }, { value: "Fair", label: "Fair" }, { value: "Poor", label: "Poor" }],
        },
        { name: "location", label: "Location", colSpan: 1 },
      ]}
    />
  );
}
