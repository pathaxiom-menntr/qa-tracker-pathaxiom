"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Plus, Pencil, Trash2, X, CheckCircle2 } from "lucide-react";
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
  const { vapt, createVapt, updateVapt, deleteVapt, currentUser } = useQAStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<VaptFinding | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VaptFinding | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Major");
  const [status, setStatus] = useState("Open");

  const openCount = vapt.filter((v) => v.status === "Open").length;
  const majorCount = vapt.filter((v) => v.severity === "Major" || v.severity === "Critical").length;
  const closedCount = vapt.filter((v) => v.status === "Closed").length;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Findings" value={vapt.length} tone={COLORS.accent} />
        <StatCard label="Major / High" value={majorCount} tone={COLORS.red} />
        <StatCard label="Open Vulnerabilities" value={openCount} tone={COLORS.amber} />
        <StatCard label="Remediated & Closed" value={closedCount} tone={COLORS.green} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>VAPT Findings & Remediation Tracker</div>
            <div className="text-xs" style={{ color: COLORS.sub }}>Security testing vulnerabilities identified during penetration audits</div>
          </div>
          {canEdit(currentUser?.role) && (
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

        <table className="w-full text-left text-xs">
          <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
            <tr>
              <th className="px-4 py-3 font-semibold w-16">#</th>
              <th className="px-4 py-3 font-semibold">Vulnerability Title</th>
              <th className="px-4 py-3 font-semibold w-32">Severity</th>
              <th className="px-4 py-3 font-semibold w-32">Status</th>
              {canEdit(currentUser?.role) && <th className="px-4 py-3 font-semibold text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
            {vapt.map((f, i) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono" style={{ color: COLORS.sub }}>{i + 1}</td>
                <td className="px-4 py-3 font-medium" style={{ color: COLORS.ink }}>{f.title}</td>
                <td className="px-4 py-3">
                  <Badge color={SEV_COLOR[f.severity] || COLORS.sub}>{f.severity}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={STATUS_COLOR[f.status] || COLORS.sub}>{f.status}</Badge>
                </td>
                {canEdit(currentUser?.role) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(f)} className="p-1 rounded hover:bg-slate-100" style={{ color: COLORS.sub }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(f)} className="p-1 rounded hover:bg-red-50" style={{ color: COLORS.red }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000AA" }} onClick={() => setConfirmDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.red} />
              <span className="text-sm font-semibold">Delete Security Finding?</span>
            </div>
            <p className="text-xs mb-5" style={{ color: COLORS.sub }}>
              Are you sure you want to delete finding &quot;{confirmDelete.title}&quot;?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: COLORS.sub }}>Cancel</button>
              <button
                onClick={() => {
                  deleteVapt(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: COLORS.red, color: "#fff" }}
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
