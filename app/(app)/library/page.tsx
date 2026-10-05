"use client";

import CrudPage from "@/components/CrudPage";

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Library</h1>
        <p className="text-sm text-slate-500 mt-1">Manage the book catalog and track borrowing.</p>
      </div>

      <CrudPage
        title="Books"
        apiPath="/api/library/books"
        color="navy"
        addLabel="Add Book"
        searchKeys={["title", "author", "isbn"]}
        columns={[
          { key: "title", label: "Title" },
          { key: "author", label: "Author" },
          { key: "isbn", label: "ISBN" },
          { key: "copies", label: "Copies" },
          {
            key: "available", label: "Available",
            render: (r) => (
              <span className={r.available > 0 ? "badge-green" : "badge-red"}>{r.available} left</span>
            ),
          },
        ]}
        fields={[
          { name: "title", label: "Title", required: true, colSpan: 2 },
          { name: "author", label: "Author", required: true, colSpan: 1 },
          { name: "isbn", label: "ISBN", required: true, colSpan: 1 },
          { name: "copies", label: "Total Copies", type: "number", required: true, colSpan: 1 },
          { name: "available", label: "Available Copies", type: "number", colSpan: 1 },
        ]}
      />

      <CrudPage
        title="Borrowing"
        description="Issue and return books. Edit a record and set a return date to check a book back in."
        apiPath="/api/library/loans"
        color="yellow"
        addLabel="Issue Book"
        searchKeys={["bookTitle", "studentName"]}
        columns={[
          { key: "bookTitle", label: "Book" },
          { key: "studentName", label: "Student" },
          { key: "borrowDate", label: "Borrowed", render: (r) => new Date(r.borrowDate).toLocaleDateString() },
          { key: "dueDate", label: "Due", render: (r) => new Date(r.dueDate).toLocaleDateString() },
          {
            key: "status", label: "Status",
            render: (r) => <span className={r.status === "Returned" ? "badge-green" : "badge-yellow"}>{r.status}</span>,
          },
          { key: "fine", label: "Fine (UGX)", render: (r) => Number(r.fine || 0).toLocaleString() },
        ]}
        fields={[
          {
            name: "bookId", label: "Book", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/library/books",
            optionsMap: (b: any) => ({ value: b.id, label: `${b.title} (${b.available} available)` }),
          },
          {
            name: "studentId", label: "Student", type: "select", required: true, colSpan: 2,
            optionsUrl: "/api/students",
            optionsMap: (s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }),
          },
          { name: "dueDate", label: "Due Date", type: "date", required: true, colSpan: 1 },
          { name: "returnDate", label: "Return Date", type: "date", colSpan: 1 },
          { name: "fine", label: "Fine (UGX)", type: "number", colSpan: 2 },
        ]}
      />
    </div>
  );
}
