"use client";

import React, { useState, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Bug,
  Users,
  FolderGit2,
  Activity,
  Layers,
  ShieldAlert,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Defect, User, Project, TestRun, Portal, VaptFinding, ReportEntry } from "@/lib/types";

const COLORS = {
  bg: "#F8FAFC",
  panel: "#FFFFFF",
  panel2: "#F1F5F9",
  border: "#E2E8F0",
  ink: "#0F172A",
  sub: "#64748B",
  accent: "#6366F1",
  teal: "#0D9488",
  emerald: "#10B981",
  rose: "#EF4444",
  amber: "#F59E0B",
  indigo: "#4F46E5",
};

export function GlobalRecycleBin({ onNavigate }: { onNavigate?: (moduleKey: string) => void }) {
  const {
    defects,
    restoreDefect,
    purgeDefect,
    users,
    restoreUser,
    purgeUser,
    projects,
    restoreProject,
    purgeProject,
    testRuns,
    restoreTestRun,
    purgeTestRun,
    portals,
    restorePortal,
    purgePortal,
    vapt,
    restoreVapt,
    purgeVapt,
    reports,
    restoreReport,
    purgeReport,
  } = useQAStore();

  const [activeTab, setActiveTab] = useState<"defects" | "users" | "projects" | "testruns" | "portals" | "vapt" | "reports">("defects");
  const [search, setSearch] = useState("");

  // Confirmation modal state for permanent wipe
  const [purgeTarget, setPurgeTarget] = useState<{
    type: "defect" | "user" | "project" | "testrun" | "portal" | "vapt" | "report";
    id: string | number;
    title: string;
  } | null>(null);

  // Filtered soft-deleted items across all domains
  const deletedDefects = useMemo(() => defects.filter((d) => !!d.is_deleted), [defects]);
  const deletedUsers = useMemo(() => users.filter((u) => !!u.is_deleted), [users]);
  const deletedProjects = useMemo(() => projects.filter((p) => !!p.is_deleted), [projects]);
  const deletedRuns = useMemo(() => testRuns.filter((r) => !!r.is_deleted), [testRuns]);
  const deletedPortals = useMemo(() => portals.filter((p) => !!p.is_deleted), [portals]);
  const deletedVapt = useMemo(() => vapt.filter((v) => !!v.is_deleted), [vapt]);
  const deletedReports = useMemo(
    () =>
      Object.entries(reports)
        .filter(([_, r]) => !!r?.is_deleted)
        .map(([key, r]) => ({ key, ...r })),
    [reports]
  );

  const totalPreserved =
    deletedDefects.length +
    deletedUsers.length +
    deletedProjects.length +
    deletedRuns.length +
    deletedPortals.length +
    deletedVapt.length +
    deletedReports.length;

  const handleConfirmPurge = async () => {
    if (!purgeTarget) return;
    try {
      if (purgeTarget.type === "defect") await purgeDefect(String(purgeTarget.id));
      else if (purgeTarget.type === "user") await purgeUser(Number(purgeTarget.id));
      else if (purgeTarget.type === "project") await purgeProject(Number(purgeTarget.id));
      else if (purgeTarget.type === "testrun") await purgeTestRun(Number(purgeTarget.id));
      else if (purgeTarget.type === "portal") await purgePortal(Number(purgeTarget.id));
      else if (purgeTarget.type === "vapt") await purgeVapt(Number(purgeTarget.id));
      else if (purgeTarget.type === "report") await purgeReport(String(purgeTarget.id));
    } finally {
      setPurgeTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
        style={{ background: COLORS.panel, borderColor: COLORS.border }}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Global Recycle Bin</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {totalPreserved} Preserved
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Centralized recovery and audit hub for all soft-deleted records across Defects, Users, Projects, Test Cycles, Portals, VAPT, and Reports.
            </p>
          </div>
        </div>

        {/* Policy Guarantee Badge */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Permanent Preservation</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            No automatic timers or expiration dates. All deleted data remains recoverable indefinitely until manually purged.
          </p>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: "defects", label: "Defects & Bugs", icon: Bug, count: deletedDefects.length },
          { key: "users", label: "Users & Accounts", icon: Users, count: deletedUsers.length },
          { key: "projects", label: "Projects & Clients", icon: FolderGit2, count: deletedProjects.length },
          { key: "testruns", label: "Test Execution Runs", icon: Activity, count: deletedRuns.length },
          { key: "portals", label: "Portals & Suites", icon: Layers, count: deletedPortals.length },
          { key: "vapt", label: "Security Findings", icon: ShieldAlert, count: deletedVapt.length },
          { key: "reports", label: "Uploaded Reports", icon: FileText, count: deletedReports.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as any);
                setSearch("");
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? COLORS.panel : "transparent",
                color: active ? COLORS.indigo : COLORS.sub,
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                border: active ? `1px solid ${COLORS.border}` : "1px solid transparent",
              }}
            >
              <Icon size={14} className={active ? "text-indigo-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab.count > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Content */}
      <div className="rounded-2xl border shadow-xs overflow-hidden" style={{ background: COLORS.panel, borderColor: COLORS.border }}>
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search deleted ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none"
              style={{ background: COLORS.panel2, borderColor: COLORS.border }}
            />
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => {
                if (activeTab === "defects") onNavigate("defects");
                else if (activeTab === "users") onNavigate("users");
                else if (activeTab === "projects") onNavigate("projects");
                else if (activeTab === "testruns" || activeTab === "portals") onNavigate("testcases");
                else if (activeTab === "vapt") onNavigate("security");
                else if (activeTab === "reports") onNavigate("reports");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>Manage in {activeTab.toUpperCase()} Module</span>
              <ExternalLink size={13} />
            </button>
          )}
        </div>

        {/* 1. DEFECTS */}
        {activeTab === "defects" && (
          <div className="overflow-x-auto">
            {deletedDefects.length === 0 ? (
              <EmptyTrashMessage label="defects" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold w-24">Bug ID</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold w-32">Client & Project</th>
                    <th className="px-4 py-3 font-semibold w-24">Severity</th>
                    <th className="px-4 py-3 font-semibold w-28">Status</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedDefects
                    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()))
                    .map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{d.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{d.title}</td>
                        <td className="px-4 py-3 text-slate-500">
                          <div>{d.project_name}</div>
                          <div className="text-[10px] text-slate-400">{d.client_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {d.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {d.deleted_at ? new Date(d.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restoreDefect(d.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "defect", id: d.id, title: `${d.id}: ${d.title}` })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 2. USERS */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            {deletedUsers.length === 0 ? (
              <EmptyTrashMessage label="users" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">User Name & Email</th>
                    <th className="px-4 py-3 font-semibold w-32">Role</th>
                    <th className="px-4 py-3 font-semibold w-32">Client</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedUsers
                    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.client_name || "Internal"}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restoreUser(u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "user", id: u.id, title: u.name })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. PROJECTS */}
        {activeTab === "projects" && (
          <div className="overflow-x-auto">
            {deletedProjects.length === 0 ? (
              <EmptyTrashMessage label="projects" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold w-28">Project Code</th>
                    <th className="px-4 py-3 font-semibold">Project Name</th>
                    <th className="px-4 py-3 font-semibold w-36">Client Organization</th>
                    <th className="px-4 py-3 font-semibold w-28">Modules</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedProjects
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{p.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.client_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {p.modules?.length || 0} Modules
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restoreProject(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "project", id: p.id, title: p.name })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. TEST RUNS */}
        {activeTab === "testruns" && (
          <div className="overflow-x-auto">
            {deletedRuns.length === 0 ? (
              <EmptyTrashMessage label="test runs" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold w-28">Run ID</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold w-32">Project</th>
                    <th className="px-4 py-3 font-semibold w-28">Environment</th>
                    <th className="px-4 py-3 font-semibold w-24">Status</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedRuns
                    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.run_id.toLowerCase().includes(search.toLowerCase()))
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{r.run_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                        <td className="px-4 py-3 text-slate-600">{r.project_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {r.environment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.status}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {r.deleted_at ? new Date(r.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restoreTestRun(r.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "testrun", id: r.id, title: `${r.run_id}: ${r.title}` })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 5. PORTALS */}
        {activeTab === "portals" && (
          <div className="overflow-x-auto">
            {deletedPortals.length === 0 ? (
              <EmptyTrashMessage label="portals" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Portal Name</th>
                    <th className="px-4 py-3 font-semibold w-24 text-center">Smoke</th>
                    <th className="px-4 py-3 font-semibold w-24 text-center">Functional</th>
                    <th className="px-4 py-3 font-semibold w-24 text-center">Regression</th>
                    <th className="px-4 py-3 font-semibold w-24 text-center">Total</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedPortals
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-center text-teal-600 font-bold">{p.smoke}</td>
                        <td className="px-4 py-3 text-center text-indigo-600 font-bold">{p.functional}</td>
                        <td className="px-4 py-3 text-center text-sky-600 font-bold">{p.regression}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{p.total}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restorePortal(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "portal", id: p.id, title: p.name })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 6. VAPT FINDINGS */}
        {activeTab === "vapt" && (
          <div className="overflow-x-auto">
            {deletedVapt.length === 0 ? (
              <EmptyTrashMessage label="security findings" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vulnerability Finding</th>
                    <th className="px-4 py-3 font-semibold w-28">Severity</th>
                    <th className="px-4 py-3 font-semibold w-28">Status</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedVapt
                    .filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))
                    .map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{v.title}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {v.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{v.status}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {v.deleted_at ? new Date(v.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restoreVapt(v.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "vapt", id: v.id, title: v.title })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 7. REPORTS */}
        {activeTab === "reports" && (
          <div className="overflow-x-auto">
            {deletedReports.length === 0 ? (
              <EmptyTrashMessage label="reports" />
            ) : (
              <table className="w-full text-left text-xs">
                <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Report Key & Name</th>
                    <th className="px-4 py-3 font-semibold">File Name</th>
                    <th className="px-4 py-3 font-semibold w-24">Format</th>
                    <th className="px-4 py-3 font-semibold w-32">Uploaded By</th>
                    <th className="px-4 py-3 font-semibold w-32">Deleted At</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedReports
                    .filter((r) => r.fileName.toLowerCase().includes(search.toLowerCase()) || r.key.toLowerCase().includes(search.toLowerCase()))
                    .map((r) => (
                      <tr key={r.key} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-900">{r.key}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{r.fileName}</td>
                        <td className="px-4 py-3 font-medium text-indigo-600">{r.format}</td>
                        <td className="px-4 py-3 text-slate-600">{r.uploadedBy}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {r.deleted_at ? new Date(r.deleted_at).toLocaleDateString() : "Preserved"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => restoreReport(r.key)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={11} />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgeTarget({ type: "report", id: r.key, title: r.fileName })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            >
                              <Trash2 size={11} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR PERMANENT WIPE */}
      {purgeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setPurgeTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-700">Permanently Delete Item?</h3>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{purgeTarget.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              <b>Warning:</b> This record will be permanently wiped from the database. This action is irreversible and the item cannot be restored later.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPurgeTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
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

function EmptyTrashMessage({ label }: { label: string }) {
  return (
    <div className="p-12 text-center text-slate-400">
      <CheckCircle2 size={32} className="mx-auto text-emerald-500/60 mb-2.5" />
      <div className="text-xs font-bold text-slate-700">No soft-deleted {label}</div>
      <div className="text-[11px] text-slate-400 mt-1">
        All active items in this category are intact and live.
      </div>
    </div>
  );
}
