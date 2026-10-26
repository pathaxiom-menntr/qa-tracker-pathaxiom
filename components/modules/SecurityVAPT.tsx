"use client";

import React, { useState, useMemo } from "react";
import { ShieldAlert, AlertTriangle, Plus, Pencil, Trash2, X, CheckCircle2, RotateCcw, Search, ChevronDown, Filter } from "lucide-react";
import { useQAStore } from "@/lib/store";
import { VaptFinding, Role } from "@/lib/types";

const COLORS = {
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  red: "#DC2626",
  green: "#16A34A",
  amber: "#D97706",
  sky: "#0284C7",
};

const EDIT_ROLES: Role[] = ["Super Admin", "Admin", "QA Manager"];
const canEdit = (role?: Role) => !!role && EDIT_ROLES.includes(role);

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

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: COLORS.sub }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <ShieldAlert size={14} color={tone} />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: COLORS.ink }}>{value}</div>
    </div>
  );
}

export function SecurityVAPT() {
  const { vapt, createVapt, updateVapt, deleteVapt, restoreVapt, purgeVapt, currentUser } = useQAStore();

  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<VaptFinding | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VaptFinding | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<VaptFinding | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Major");
  const [status, setStatus] = useState("Open");

  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const activeFindings = vapt.filter((v) => !v.is_deleted);
  const trashFindings = vapt.filter((v) => !!v.is_deleted);
  const currentList = activeTab === "active" ? activeFindings : trashFindings;

  const filteredList = useMemo(() => {
    return currentList.filter((f) => {
      const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase());
      const matchSev = sevFilter === "All" || f.severity === sevFilter;
      const matchStatus = statusFilter === "All" || f.status === statusFilter;
      return matchSearch && matchSev && matchStatus;
    });
  }, [currentList, search, sevFilter, statusFilter]);

  const openCount = activeFindings.filter((v) => v.status === "Open").length;
  const majorCount = activeFindings.filter((v) => v.severity === "Major" || v.severity === "Critical").length;
  const closedCount = activeFindings.filter((v) => v.status === "Closed").length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createVapt({ title: title.trim(), severity, status });
    setTitle("");
    setShowAdd(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateVapt(editing.id, {
      title: editing.title,
      severity: editing.severity,
      status: editing.status,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Active Findings" value={activeFindings.length} tone={COLORS.accent} />
        <StatCard label="Major / High" value={majorCount} tone={COLORS.red} />
        <StatCard label="Open Vulnerabilities" value={openCount} tone={COLORS.amber} />
        <StatCard label="Remediated & Closed" value={closedCount} tone={COLORS.green} />
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl overflow-hidden shadow-xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>VAPT Findings & Remediation Tracker</div>
            <div className="text-xs" style={{ color: COLORS.sub }}>Security testing vulnerabilities identified during penetration audits</div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-tabs: Active Findings vs Recycle Bin */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  background: activeTab === "active" ? "#FFFFFF" : "transparent",
                  color: activeTab === "active" ? COLORS.ink : COLORS.sub,
                  boxShadow: activeTab === "active" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <span>Active ({activeFindings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trash")}
                className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  background: activeTab === "trash" ? "#FFFFFF" : "transparent",
                  color: activeTab === "trash" ? "#DC2626" : COLORS.sub,
                  boxShadow: activeTab === "trash" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <Trash2 size={12} className={activeTab === "trash" ? "text-rose-600" : "text-slate-400"} />
                <span>Recycle Bin ({trashFindings.length})</span>
              </button>
            </div>

            {activeTab === "active" && canEdit(currentUser?.role) && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: COLORS.accent, color: "#fff" }}
              >
                <Plus size={14} />
                Add Finding
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search size={14} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vulnerability title..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50/80 border border-slate-200/90 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Severity Filter */}
            <div className="relative group">
              <ShieldAlert
                size={13}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  sevFilter !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value)}
                className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                  sevFilter !== "All"
                    ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                    : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
                } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown
                size={12}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  sevFilter !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <CheckCircle2
                size={13}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  statusFilter !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                  statusFilter !== "All"
                    ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                    : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
                } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              <ChevronDown
                size={12}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  statusFilter !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
            </div>

            {(search || sevFilter !== "All" || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSevFilter("All");
                  setStatusFilter("All");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                title="Reset filters"
              >
                <RotateCcw size={12} className="text-slate-400" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <b className="text-slate-800">{filteredList.length}</b> of <b>{currentList.length}</b> findings
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            {activeTab === "trash"
              ? "Recycle Bin is empty. No security findings currently soft-deleted."
              : "No findings match the selected filters."}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
              <tr>
                <th className="px-4 py-3 font-semibold w-16">#</th>
                <th className="px-4 py-3 font-semibold">Vulnerability Title</th>
                <th className="px-4 py-3 font-semibold w-32">Severity</th>
                <th className="px-4 py-3 font-semibold w-32">Status</th>
                {activeTab === "trash" && <th className="px-4 py-3 font-semibold w-40">Deleted At</th>}
                {canEdit(currentUser?.role) && <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {filteredList.map((f, i) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono" style={{ color: COLORS.sub }}>{i + 1}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.ink }}>
                    <div className="flex items-center gap-2">
                      <span>{f.title}</span>
                      {f.is_deleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Recycle Bin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={SEV_COLOR[f.severity] || COLORS.sub}>{f.severity}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLOR[f.status] || COLORS.sub}>{f.status}</Badge>
                  </td>
                  {activeTab === "trash" && (
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {f.deleted_at ? new Date(f.deleted_at).toLocaleDateString() : "Preserved"}
                    </td>
                  )}
                  {canEdit(currentUser?.role) && (
                    <td className="px-4 py-3 text-right">
                      {activeTab === "active" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(f)}
                            className="p-1 rounded hover:bg-slate-100"
                            style={{ color: COLORS.sub }}
                            title="Edit Finding"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(f)}
                            className="p-1 rounded hover:bg-red-50"
                            style={{ color: COLORS.red }}
                            title="Move to Recycle Bin"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => restoreVapt(f.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Restore Finding"
                          >
                            <RotateCcw size={11} />
                            Restore
                          </button>
                          <button
                            onClick={() => setConfirmPurge(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                            title="Permanently Delete Finding"
                          >
                            <Trash2 size={11} />
                            Purge
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000AA" }} onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Add Security Finding</span>
              <button onClick={() => setShowAdd(false)} style={{ color: COLORS.sub }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: COLORS.sub }}>Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Vulnerability finding title"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Medium">Medium</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: COLORS.sub }}>Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: COLORS.accent, color: "#fff" }}>Add Finding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000AA" }} onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Edit Finding #{editing.id}</span>
              <button onClick={() => setEditing(null)} style={{ color: COLORS.sub }}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: COLORS.sub }}>Title</label>
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>Severity</label>
                  <select
                    value={editing.severity}
                    onChange={(e) => setEditing({ ...editing, severity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Medium">Medium</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: COLORS.sub }}>Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: COLORS.sub }}>Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: COLORS.accent, color: "#fff" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MOVE TO RECYCLE BIN MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000AA" }} onClick={() => setConfirmDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={16} color={COLORS.amber} />
              <span className="text-sm font-semibold">Move Finding to Recycle Bin?</span>
            </div>
            <p className="text-xs mb-5 text-slate-600 leading-relaxed">
              Are you sure you want to move &quot;<b>{confirmDelete.title}</b>&quot; to the Recycle Bin? The finding will remain preserved indefinitely and can be restored at any time.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: COLORS.sub }}>Cancel</button>
              <button
                onClick={() => {
                  deleteVapt(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PERMANENT PURGE MODAL */}
      {confirmPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000AA" }} onClick={() => setConfirmPurge(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.red} />
              <span className="text-sm font-semibold text-rose-700">Permanently Delete Finding?</span>
            </div>
            <p className="text-xs mb-5 text-slate-600 leading-relaxed">
              <b>Warning:</b> Are you sure you want to permanently wipe &quot;<b>{confirmPurge.title}</b>&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmPurge(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: COLORS.sub }}>Cancel</button>
              <button
                onClick={() => {
                  purgeVapt(confirmPurge.id);
                  setConfirmPurge(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
