"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Bug, Plus, X, Trash2, Search, AlertTriangle, Pencil, Loader2 } from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Defect, Role } from "@/lib/types";

const COLORS = {
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  red: "#DC2626",
  amber: "#D97706",
  green: "#16A34A",
  sky: "#0284C7",
};

const SEV_COLOR: Record<string, string> = {
  Critical: "#991B1B",
  Major: COLORS.red,
  Medium: COLORS.amber,
  Minor: COLORS.sky,
  High: COLORS.red,
  Low: COLORS.sky,
};

const STATUS_COLOR: Record<string, string> = {
  Open: COLORS.red,
  Closed: COLORS.green,
  "In Progress": COLORS.amber,
  Deferred: COLORS.sub,
  Reopened: COLORS.accent,
};

const STATUS_OPTIONS = ["Open", "In Progress", "Closed", "Reopened", "Deferred"];
const SEVERITY_OPTIONS = ["Critical", "Major", "Medium", "Minor"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

const EDIT_ROLES: Role[] = ["Super Admin", "Admin", "QA Manager"];
const canEdit = (role?: Role) => !!role && EDIT_ROLES.includes(role);

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: color + "1E", color }}
    >
      {children}
    </span>
  );
}

export function Defects() {
  const { defects, createDefect, updateDefect, deleteDefect, currentUser } = useQAStore();

  const [q, setQ] = useState("");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modFilter, setModFilter] = useState("All");

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Defect | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Defect | null>(null);

  // Compute next suggested Bug ID based on existing database IDs
  const nextIdGuess = useMemo(() => {
    const nums = defects
      .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    return `BUG-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  }, [defects]);

  // Form states
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState("Admin Portal");
  const [severity, setSeverity] = useState("Medium");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Open");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Update id guess whenever modal opens or nextIdGuess updates
  useEffect(() => {
    if (showAdd) {
      setId(nextIdGuess);
      setError("");
    }
  }, [showAdd, nextIdGuess]);

  const modules = useMemo(() => Array.from(new Set(defects.map((d) => d.module))), [defects]);

  const filtered = defects.filter((d) => {
    const matchQ =
      !q ||
      d.id.toLowerCase().includes(q.toLowerCase()) ||
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.module.toLowerCase().includes(q.toLowerCase());
    const matchSev = sevFilter === "All" || d.severity === sevFilter;
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    const matchMod = modFilter === "All" || d.module === modFilter;
    return matchQ && matchSev && matchStatus && matchMod;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !module.trim() || !id.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      await createDefect({
        id: id.trim(),
        module: module.trim(),
        title: title.trim(),
        description: description.trim(),
        severity,
        priority,
        status,
      });

      setTitle("");
      setDescription("");
      setShowAdd(false);
    } catch (err: any) {
      setError(err.message || "Failed to log defect");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateDefect(editing.id, {
        title: editing.title,
        description: editing.description,
        module: editing.module,
        severity: editing.severity,
        priority: editing.priority,
        status: editing.status,
      });
      setEditing(null);
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl shadow-sm"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} color={COLORS.sub} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, title, module…"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          >
            <option value="All">All Severities</option>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {modules.length > 0 && (
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs outline-none max-w-[140px] truncate"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              <option value="All">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: COLORS.sub }}>
            Showing <b>{filtered.length}</b> of <b>{defects.length}</b> defects
          </span>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ background: COLORS.accent }}
          >
            <Plus size={14} /> Log Defect
          </button>
        </div>
      </div>

      {/* Defects Table */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              style={{
                background: COLORS.panel2,
                borderBottom: `1px solid ${COLORS.border}`,
                color: COLORS.sub,
              }}
            >
              <th className="py-2.5 px-4 font-semibold">ID</th>
              <th className="py-2.5 px-4 font-semibold">Module</th>
              <th className="py-2.5 px-4 font-semibold">Severity</th>
              <th className="py-2.5 px-4 font-semibold">Priority</th>
              <th className="py-2.5 px-4 font-semibold">Title</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">Reported By</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs" style={{ color: COLORS.sub }}>
                  No defects matching the selected criteria.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium" style={{ color: COLORS.accent }}>
                    {d.id}
                  </td>
                  <td className="py-2.5 px-4" style={{ color: COLORS.ink }}>
                    {d.module}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge color={SEV_COLOR[d.severity] || COLORS.sub}>{d.severity}</Badge>
                  </td>
                  <td className="py-2.5 px-4" style={{ color: COLORS.ink }}>
                    {d.priority}
                  </td>
                  <td className="py-2.5 px-4 font-medium max-w-md truncate" style={{ color: COLORS.ink }} title={d.title}>
                    {d.title}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: (STATUS_COLOR[d.status] || COLORS.sub) + "18",
                        color: STATUS_COLOR[d.status] || COLORS.sub,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: STATUS_COLOR[d.status] || COLORS.sub }}
                      />
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4" style={{ color: COLORS.sub }}>
                    {d.created_by || "QA Team"}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(d)}
                        className="p-1 rounded hover:bg-slate-100"
                        style={{ color: COLORS.sub }}
                        title="Edit defect"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(d)}
                        className="p-1 rounded hover:bg-red-50"
                        style={{ color: COLORS.red }}
                        title="Delete defect"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => {
            if (!busy) setShowAdd(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl p-5 shadow-2xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug size={16} color={COLORS.accent} />
                <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                  Log New Defect
                </span>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ color: COLORS.sub }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Defect ID
                  </label>
                  <input
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="BUG-156"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Module
                  </label>
                  <input
                    required
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    placeholder="e.g. Admin Portal"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Concise defect title"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                  Description / Steps to Reproduce
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or steps"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none resize-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Status
                  </label>
                  <select
                    value="Open"
                    disabled
                    className="w-full mt-1 px-2.5 py-2 rounded-lg text-xs outline-none cursor-not-allowed opacity-80"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    title="Status is always Open when creating a new defect"
                  >
                    <option value="Open">Open</option>
                  </select>
                </div>
              </div>

              {error && (
                <div
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{
                    background: COLORS.red + "14",
                    border: `1px solid ${COLORS.red}44`,
                    color: COLORS.red,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: COLORS.sub }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                  style={{ background: COLORS.accent, opacity: busy ? 0.7 : 1 }}
                >
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  {busy ? "Saving…" : "Log Defect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl p-5 shadow-2xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Edit Defect: {editing.id}
              </span>
              <button onClick={() => setEditing(null)} style={{ color: COLORS.sub }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                  Title
                </label>
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none resize-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Module
                  </label>
                  <input
                    required
                    value={editing.module}
                    onChange={(e) => setEditing({ ...editing, module: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Severity
                  </label>
                  <select
                    value={editing.severity}
                    onChange={(e) => setEditing({ ...editing, severity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Priority
                  </label>
                  <select
                    value={editing.priority}
                    onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                    Status
                  </label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: COLORS.sub }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                  style={{ background: COLORS.accent }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.red} />
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Delete Defect {confirmDelete.id}?
              </span>
            </div>
            <p className="text-xs mb-5" style={{ color: COLORS.sub }}>
              Are you sure you want to permanently delete this defect record from PostgreSQL?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ color: COLORS.sub }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteDefect(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                style={{ background: COLORS.red }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
