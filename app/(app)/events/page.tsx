"use client";

import CrudPage from "@/components/CrudPage";

export default function EventsPage() {
  return (
    <CrudPage
      title="Events"
      description="Sports days, PTA meetings, music festivals and the academic calendar."
      apiPath="/api/events"
      color="yellow"
      addLabel="Add Event"
      searchKeys={["title", "category"]}
      columns={[
        { key: "title", label: "Event" },
        { key: "category", label: "Category" },
        { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        {
          name: "category", label: "Category", type: "select", required: true, colSpan: 1,
          options: [
            { value: "Sports", label: "Sports" }, { value: "PTA Meetings", label: "PTA Meetings" },
            { value: "Music Festivals", label: "Music Festivals" }, { value: "Academic Calendar", label: "Academic Calendar" },
          ],
        },
        { name: "date", label: "Date", type: "date", required: true, colSpan: 1 },
        { name: "description", label: "Description", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}
