"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import FileUploadField from "./FileUploadField";

export type FieldOption = { value: string; label: string };

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "email" | "password" | "checkbox" | "file" | "files";
  imageOnly?: boolean;
  required?: boolean;
  options?: FieldOption[];
  optionsUrl?: string;
  optionsMap?: (item: any) => FieldOption;
  placeholder?: string;
  defaultValue?: any;
  colSpan?: 1 | 2;
  step?: string;
};

export type ColumnConfig = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
};

export default function CrudPage({
  title,
  description,
  apiPath,
  columns,
  fields,
  searchKeys = [],
  addLabel = "Add New",
  emptyMessage = "No records yet. Click \"Add New\" to create the first one.",
  rowHref,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  color = "navy",
  extraHeaderContent,
}: {
  title: string;
  description?: string;
  apiPath: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  searchKeys?: string[];
  addLabel?: string;
  emptyMessage?: string;
  rowHref?: (row: any) => string | undefined;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  color?: "navy" | "green" | "yellow";
  extraHeaderContent?: React.ReactNode;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, FieldOption[]>>({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load data.");
      setRows(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  useEffect(() => {
    const withUrls = fields.filter((f) => f.optionsUrl);
    withUrls.forEach(async (f) => {
      try {
        const res = await fetch(f.optionsUrl!);
        const data = await res.json();
        const list = data.items || data || [];
        const mapped = list.map(f.optionsMap || ((i: any) => ({ value: i.id, label: i.name })));
        setDynamicOptions((prev) => ({ ...prev, [f.name]: mapped }));
      } catch {
        // silently ignore - form still usable
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))
    );
  }, [rows, search, searchKeys]);

  function openCreate() {
    const defaults: Record<string, any> = {};
    fields.forEach((f) => (defaults[f.name] = f.defaultValue ?? (f.type === "checkbox" ? false : f.type === "files" ? [] : "")));
    setFormValues(defaults);
    setEditingRow(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(row: any) {
    const vals: Record<string, any> = {};
    fields.forEach((f) => {
      let v = row[f.name];
      if (f.type === "date" && v) v = String(v).slice(0, 10);
      if (f.type === "files" && typeof v === "string") {
        try { v = JSON.parse(v); } catch { v = []; }
      }
      vals[f.name] = v ?? (f.type === "checkbox" ? false : f.type === "files" ? [] : "");
    });
    setFormValues(vals);
    setEditingRow(row);
    setFormError("");
    setModalOpen(true);
  }

  async function handleDelete(row: any) {
    if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    try {
      const res = await fetch(`${apiPath}/${row.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete.");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: any) {
      alert(e.message || "Failed to delete.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const method = editingRow ? "PUT" : "POST";
      const url = editingRow ? `${apiPath}/${editingRow.id}` : apiPath;
      const payload = { ...formValues };
      fields.forEach((field) => {
        if (field.type === "file") {
          const file = payload[field.name];
          payload[field.name] = typeof file === "string" ? file : file?.url || null;
        }
      });
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setModalOpen(false);
      load();
    } catch (e: any) {
      setFormError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const accent =
    color === "green" ? "btn-success" : color === "yellow" ? "btn-accent" : "btn-primary";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {extraHeaderContent}
          {canCreate && (
            <button onClick={openCreate} className={accent}>
              <Icon name="plus" className="w-4 h-4" /> {addLabel}
            </button>
          )}
        </div>
      </div>

      {searchKeys.length > 0 && (
        <div className="mb-4 relative max-w-sm">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500 text-sm">{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  {(canEdit || canDelete) && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const href = rowHref?.(row);
                  return (
                    <tr key={row.id}>
                      {columns.map((c) => (
                        <td key={c.key}>
                          {c.render ? (
                            c.render(row)
                          ) : href && c === columns[0] ? (
                            <Link href={href} className="font-semibold text-navy-800 hover:underline">
                              {String(row[c.key] ?? "-")}
                            </Link>
                          ) : (
                            String(row[c.key] ?? "-")
                          )}
                        </td>
                      ))}
                      {(canEdit || canDelete) && (
                        <td className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {href && (
                              <Link href={href} className="p-1.5 text-slate-500 hover:text-navy-800 hover:bg-slate-100 rounded-md">
                                <Icon name="eye" className="w-4 h-4" />
                              </Link>
                            )}
                            {canEdit && (
                              <button onClick={() => openEdit(row)} className="p-1.5 text-slate-500 hover:text-navy-800 hover:bg-slate-100 rounded-md">
                                <Icon name="pencil" className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(row)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="font-bold text-navy-900">{editingRow ? "Edit" : addLabel}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {fields.map((f) => {
                  const options = f.options || dynamicOptions[f.name] || [];
                  return (
                    <div key={f.name} className={f.colSpan === 1 ? "col-span-1" : "col-span-2"}>
                      <label className="label">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      {f.type === "file" || f.type === "files" ? (
                        <FileUploadField
                          value={formValues[f.name]}
                          multiple={f.type === "files"}
                          imageOnly={f.imageOnly}
                          onChange={(value) => setFormValues((p) => ({ ...p, [f.name]: value }))}
                        />
                      ) : f.type === "select" ? (
                        <select
                          className="input"
                          required={f.required}
                          value={formValues[f.name] ?? ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [f.name]: e.target.value }))}
                        >
                          <option value="">Select...</option>
                          {options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea
                          className="input"
                          rows={3}
                          required={f.required}
                          placeholder={f.placeholder}
                          value={formValues[f.name] ?? ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [f.name]: e.target.value }))}
                        />
                      ) : f.type === "checkbox" ? (
                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={!!formValues[f.name]}
                            onChange={(e) => setFormValues((p) => ({ ...p, [f.name]: e.target.checked }))}
                          />
                          <span className="text-sm text-slate-600">Yes</span>
                        </label>
                      ) : (
                        <input
                          className="input"
                          type={f.type || "text"}
                          step={f.step}
                          required={f.required}
                          placeholder={f.placeholder}
                          value={formValues[f.name] ?? ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [f.name]: e.target.value }))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {formError && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={accent}>
                  {saving ? "Saving..." : editingRow ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
