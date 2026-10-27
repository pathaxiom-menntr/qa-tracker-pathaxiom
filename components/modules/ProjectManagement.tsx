"use client";

import React, { useState, useMemo } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  Building2,
  Layers,
  Users,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Shield,
  UserCheck,
  Check,
  Tag,
  Settings2,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Project, User } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";

const COLORS = {
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  accent2: "#4F46E5",
  teal: "#0D9488",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#D97706",
};

export function ProjectManagement() {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    restoreProject,
    purgeProject,
    users,
    editUser,
    defects,
    currentUser,
  } = useQAStore();

  const isClient = currentUser?.role === "Client";
  const isAdmin = currentUser?.role === "Admin";
  const isLockedOrg = isClient || (isAdmin && Boolean(currentUser?.client_name));
  const clientOrgName = currentUser?.client_name || "PathAxiom";
  const canManageProjects = hasPermission(currentUser, "projects:manage") || currentUser?.role === "Super Admin" || currentUser?.role === "Admin";

  const [viewTab, setViewTab] = useState<"active" | "trash">("active");
  const [confirmPurge, setConfirmPurge] = useState<Project | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>(isLockedOrg ? clientOrgName : "All");

  // Keep client locked for Client & Admin users
  React.useEffect(() => {
    if (isLockedOrg) {
      setSelectedClient(clientOrgName);
    }
  }, [isLockedOrg, clientOrgName]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [accessProject, setAccessProject] = useState<Project | null>(null);
  const [hierarchyProject, setHierarchyProject] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const activeProjects = useMemo(() => projects.filter((p) => !p.is_deleted), [projects]);
  const trashProjects = useMemo(() => projects.filter((p) => !!p.is_deleted), [projects]);

  // Available clients
  const availableClients = useMemo(() => {
    if (isLockedOrg) return [clientOrgName];
    const clientSet = new Set<string>();
    projects.forEach((p) => {
      if (p.client_name) {
        p.client_name.split(",").map((s) => s.trim()).filter(Boolean).forEach((c) => clientSet.add(c));
      }
      if (p.client_names && Array.isArray(p.client_names)) {
        p.client_names.forEach((c) => clientSet.add(c));
      }
    });
    // Ensure default clients exist if none
    ["PathAxiom", "FinTech Global", "HealthPlus Systems"].forEach((c) => clientSet.add(c));
    return Array.from(clientSet);
  }, [projects, isLockedOrg, clientOrgName]);

  // Filtered projects based on active sub-tab
  const filteredProjects = useMemo(() => {
    const baseList = viewTab === "active" ? activeProjects : trashProjects;
    return baseList.filter((p) => {
      const pClients = (p.client_names && p.client_names.length > 0)
        ? p.client_names.map((c) => c.toLowerCase())
        : (p.client_name || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);

      if (isLockedOrg) {
        const matchesClient = pClients.includes(clientOrgName.toLowerCase()) || Boolean(p.is_shared);
        if (!matchesClient) return false;
      }
      if (selectedClient !== "All") {
        if (selectedClient === "Shared / Multi-Tenant") {
          if (!p.is_shared && (!p.client_names || p.client_names.length <= 1)) return false;
        } else {
          const matchesSelected = pClients.includes(selectedClient.toLowerCase()) || (p.is_shared && pClients.length === 0);
          if (!matchesSelected) return false;
        }
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchCode = p.code.toLowerCase().includes(query);
        const matchClient = (p.client_name || "").toLowerCase().includes(query) || pClients.some((c) => c.includes(query));
        const matchDesc = (p.description || "").toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchClient && !matchDesc) return false;
      }
      return true;
    });
  }, [viewTab, activeProjects, trashProjects, isClient, clientOrgName, selectedClient, search]);

  // Dynamic KPI Metrics
  const totalProjects = activeProjects.length;
  const totalClients = availableClients.length;
  const totalModules = useMemo(
    () => activeProjects.reduce((acc, p) => acc + (p.modules?.length || 0), 0),
    [activeProjects]
  );
  const totalFeatures = useMemo(() => {
    return activeProjects.reduce((acc, p) => {
      if (!p.features) return acc;
      const fCount = Object.values(p.features).reduce((sum, fList) => sum + (fList?.length || 0), 0);
      return acc + fCount;
    }, 0);
  }, [activeProjects]);

  return (
    <div className="space-y-5">
      {/* Client Access Notice if Client Role */}
      {isClient && (
        <div
          className="px-4 py-3 rounded-xl border flex items-center justify-between text-xs"
          style={{ background: COLORS.accent2 + "12", borderColor: COLORS.accent2 + "40" }}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} color={COLORS.accent2} />
            <span style={{ color: COLORS.ink }}>
              <b>Client Project Scope:</b> Viewing projects belonging exclusively to <b>{clientOrgName}</b>.
            </span>
          </div>
          <span
            className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider"
            style={{ background: COLORS.accent2 + "20", color: COLORS.accent2 }}
          >
            Client Restricted
          </span>
        </div>
      )}

      {/* Sub-Tab Navigation: Active Projects vs Recycle Bin */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab("active")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewTab === "active"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FolderGit2 size={14} />
            <span>Active Projects</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                viewTab === "active" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {activeProjects.length}
            </span>
          </button>

          <button
            onClick={() => setViewTab("trash")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewTab === "trash"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Trash2 size={14} />
            <span>Recycle Bin (Trash)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                viewTab === "trash" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {trashProjects.length}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 shadow-xs bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Active Projects
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderGit2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">{totalProjects}</div>
          <div className="text-xs text-slate-500 mt-1">Live in QA Tracker</div>
        </div>

        <div className="rounded-xl p-4 shadow-xs bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Client Orgs
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">{totalClients}</div>
          <div className="text-xs text-slate-500 mt-1">Enterprise organizations</div>
        </div>

        <div className="rounded-xl p-4 shadow-xs bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Tracked Modules
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">{totalModules}</div>
          <div className="text-xs text-slate-500 mt-1">Categories across projects</div>
        </div>

        <div className="rounded-xl p-4 shadow-xs bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Recycle Bin
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-600">{trashProjects.length}</div>
          <div className="text-xs text-slate-500 mt-1">Soft-deleted (restorable)</div>
        </div>
      </div>

      {/* Primary Action & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl shadow-xs bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search size={14} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project name, code, client…"
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

          {/* Client Filter */}
          <div className="relative group">
            <Building2
              size={13}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                selectedClient !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <select
              value={selectedClient}
              disabled={isLockedOrg}
              onChange={(e) => setSelectedClient(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs max-w-[190px] truncate ${
                selectedClient !== "All"
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
              } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
              title={isLockedOrg ? "Client filter is locked to your organization" : "Filter by Client Organization"}
            >
              {!isLockedOrg && (
                <>
                  <option value="All">All Clients</option>
                  <option value="Shared / Multi-Tenant">Shared / Multi-Tenant</option>
                </>
              )}
              {availableClients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                selectedClient !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </div>

          <span className="text-xs text-slate-500 font-medium ml-1">
            Showing <b className="text-slate-800">{filteredProjects.length}</b> of <b>{projects.length}</b> projects
          </span>
        </div>

        {/* Action Button: Create New Project */}
        {canManageProjects && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white space-y-2">
          <FolderGit2 size={32} className="mx-auto text-slate-300" />
          <h4 className="text-sm font-semibold text-slate-700">No projects found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No projects match the current search or client filter.
          </p>
          {canManageProjects && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            // Count active defects for this project
            const projectDefects = defects.filter(
              (d) =>
                !d.is_deleted &&
                ((d.project_code && d.project_code.toLowerCase() === p.code.toLowerCase()) ||
                  (d.project_name && d.project_name.toLowerCase() === p.name.toLowerCase()))
            );
            const criticalDefects = projectDefects.filter(
              (d) => d.severity === "Critical" || d.severity === "Major"
            );

            // Assigned team members
            const assignedUsers = users.filter((u) => {
              const byId = (p.assigned_user_ids || []).includes(u.id);
              const byCode = (u.assigned_projects || []).includes(p.code);
              return byId || byCode;
            });

            return (
              <div
                key={p.id}
                className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {p.code}
                    </span>
                    {p.is_shared || (p.client_names && p.client_names.length > 1) ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                        title={`Shared across: ${(p.client_names && p.client_names.length > 0 ? p.client_names : [p.client_name]).join(", ")}`}
                      >
                        <Users size={11} className="text-purple-600" />
                        <span>Shared Project ({p.client_names?.length || "Multi-Client"})</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[160px]">
                        {p.client_name || "PathAxiom"}
                      </span>
                    )}
                  </div>

                  {/* Project Title & Description */}
                  <h3 className="font-bold text-sm text-slate-900 mb-1">{p.name}</h3>

                  {/* Multi-Client Tags preview */}
                  {(p.is_shared || (p.client_names && p.client_names.length > 1)) && (
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      <span className="text-[10px] font-medium text-slate-400 mr-0.5 flex items-center gap-0.5">
                        <Building2 size={10} /> Clients:
                      </span>
                      {(p.client_names && p.client_names.length > 0 ? p.client_names : (p.client_name || "").split(",")).map((c) => (
                        <span
                          key={c.trim()}
                          className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {c.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-3">
                    {p.description || "No project description provided."}
                  </p>

                  {/* Metrics Badges: Defects & Modules */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Bug size={13} className="text-amber-600" />
                      <span className="text-slate-600 font-medium">Defects:</span>
                      <span className="font-bold text-slate-900">{projectDefects.length}</span>
                      {criticalDefects.length > 0 && (
                        <span className="text-[10px] text-red-600 font-bold">
                          ({criticalDefects.length} crit)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={13} className="text-purple-600" />
                      <span className="text-slate-600 font-medium">Modules:</span>
                      <span className="font-bold text-slate-900">{p.modules?.length || 0}</span>
                    </div>
                  </div>

                  {/* Modules Preview Pills */}
                  {p.modules && p.modules.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                        Modules ({p.modules.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.modules.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[120px]"
                          >
                            {m}
                          </span>
                        ))}
                        {p.modules.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            +{p.modules.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Team Access Badges */}
                  <div className="mb-4">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
                      <span>Assigned Access ({assignedUsers.length})</span>
                      {canManageProjects && (
                        <button
                          onClick={() => setAccessProject(p)}
                          className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                        >
                          Manage Access
                        </button>
                      )}
                    </div>
                    {assignedUsers.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">
                        All users have standard role access
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {assignedUsers.slice(0, 4).map((u) => (
                          <span
                            key={u.id}
                            title={`${u.name} (${u.role})`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            <UserCheck size={10} />
                            <span className="truncate max-w-[100px]">{u.name}</span>
                          </span>
                        ))}
                        {assignedUsers.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            +{assignedUsers.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  {viewTab === "trash" ? (
                    <>
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        <Trash2 size={12} />
                        <span>Deleted by: <b>{p.deleted_by || "Admin"}</b></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Restore Button */}
                        <button
                          onClick={async () => {
                            setRestoringId(p.id);
                            try {
                              await restoreProject(p.id);
                            } finally {
                              setRestoringId(null);
                            }
                          }}
                          disabled={restoringId === p.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          title="Restore project back to active tracking"
                        >
                          <RotateCcw size={12} />
                          <span>{restoringId === p.id ? "Restoring..." : "Restore"}</span>
                        </button>

                        {/* Permanently Delete Button */}
                        <button
                          onClick={() => setConfirmPurge(p)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                          title="Permanently purge project from database"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        {/* Structure Manager (Modules & Features) */}
                        <button
                          onClick={() => setHierarchyProject(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Manage modules and features for this project"
                        >
                          <Layers size={13} />
                          <span>Modules & Features</span>
                        </button>

                        {/* Give Access / Team */}
                        {canManageProjects && (
                          <button
                            onClick={() => setAccessProject(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Give team members access to this project"
                          >
                            <Users size={13} />
                            <span>Access</span>
                          </button>
                        )}
                      </div>

                      {canManageProjects && (
                        <div className="flex items-center gap-1">
                          {/* Edit Project */}
                          <button
                            onClick={() => setEditingProject(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit project details"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Delete Project */}
                          <button
                            onClick={() => setConfirmDelete(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Move project to Recycle Bin"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE PROJECT MODAL ==================== */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          availableClients={availableClients}
          isClient={isLockedOrg}
          clientOrgName={clientOrgName}
          users={users}
          existingCodes={projects.map((p) => p.code)}
          onCreate={async (projectData, assignedUserIds) => {
            await addProject(projectData);
            // Also update any assigned users' profiles
            if (assignedUserIds.length > 0) {
              for (const uid of assignedUserIds) {
                const userObj = users.find((u) => u.id === uid);
                if (userObj) {
                  const currentList = userObj.assigned_projects || [];
                  if (!currentList.includes(projectData.code!)) {
                    await editUser(userObj.id, userObj.name, userObj.email, userObj.role, undefined, userObj.client_name, [...currentList, projectData.code!]);
                  }
                }
              }
            }
          }}
        />
      )}

      {/* ==================== EDIT PROJECT MODAL ==================== */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          availableClients={availableClients}
          isClient={isLockedOrg}
          onClose={() => setEditingProject(null)}
          onUpdate={async (patch) => {
            await updateProject(editingProject.id, patch);
            setEditingProject(null);
          }}
        />
      )}

      {/* ==================== MANAGE ACCESS / USERS MODAL ==================== */}
      {accessProject && (
        <ManageAccessModal
          project={accessProject}
          users={users}
          onClose={() => setAccessProject(null)}
          onSave={async (assignedUserIds) => {
            await updateProject(accessProject.id, { assigned_user_ids: assignedUserIds });

            // Sync user profiles
            for (const u of users) {
              const shouldHave = assignedUserIds.includes(u.id);
              const currentList = u.assigned_projects || [];
              const hasIt = currentList.includes(accessProject.code);

              if (shouldHave && !hasIt) {
                await editUser(u.id, u.name, u.email, u.role, undefined, u.client_name, [...currentList, accessProject.code]);
              } else if (!shouldHave && hasIt) {
                await editUser(u.id, u.name, u.email, u.role, undefined, u.client_name, currentList.filter((c) => c !== accessProject.code));
              }
            }

            setAccessProject(null);
          }}
        />
      )}

      {/* ==================== MODULES & FEATURES HIERARCHY MODAL ==================== */}
      {hierarchyProject && (
        <ManageProjectStructureModal
          project={hierarchyProject}
          onClose={() => setHierarchyProject(null)}
          onUpdateProject={updateProject}
        />
      )}

      {/* ==================== CONFIRM MOVE PROJECT TO RECYCLE BIN MODAL ==================== */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl p-5 shadow-2xl bg-white border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Trash2 size={18} />
              <span className="text-sm font-semibold text-slate-900">
                Move Project {confirmDelete.code} to Recycle Bin?
              </span>
            </div>
            <p className="text-xs mb-2 text-slate-600">
              Are you sure you want to move <b>{confirmDelete.name}</b> ({confirmDelete.code}) to the Recycle Bin?
            </p>
            <p className="text-[11px] mb-5 text-slate-400">
              The project will be hidden from active cycles and test runs. It will remain in the Recycle Bin indefinitely and can be restored at any time.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteProject(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm cursor-pointer"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM PERMANENT PURGE PROJECT MODAL ==================== */}
      {confirmPurge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setConfirmPurge(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl p-5 shadow-2xl bg-white border border-red-200"
          >
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle size={18} />
              <span className="text-sm font-bold text-slate-900">
                Permanently Delete Project {confirmPurge.code}?
              </span>
            </div>
            <p className="text-xs mb-2 text-slate-700">
              Permanently delete <b>{confirmPurge.name}</b> ({confirmPurge.code}) from PostgreSQL?
            </p>
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[11px] mb-5 border border-red-200 leading-relaxed">
              ⚠️ <b>Warning:</b> This action CANNOT be undone. All project settings, module configurations, and metadata will be permanently erased.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmPurge(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await purgeProject(confirmPurge.id);
                  setConfirmPurge(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm cursor-pointer"
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

// ==================== CREATE PROJECT MODAL ====================
function CreateProjectModal({
  onClose,
  availableClients,
  isClient,
  clientOrgName,
  users,
  existingCodes,
  onCreate,
}: {
  onClose: () => void;
  availableClients: string[];
  isClient: boolean;
  clientOrgName: string;
  users: User[];
  existingCodes: string[];
  onCreate: (project: Partial<Project>, assignedUserIds: number[]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  // Auto-suggest next PRJ code
  const suggestedCode = useMemo(() => {
    const nums = existingCodes
      .map((c) => parseInt(c.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    return `PRJ-${String(next).padStart(3, "0")}`;
  }, [existingCodes]);

  const [code, setCode] = useState(suggestedCode);
  const [isSharedProject, setIsSharedProject] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([
    isClient ? clientOrgName : availableClients[0] || "PathAxiom",
  ]);
  const [customClientInput, setCustomClientInput] = useState("");
  const [client, setClient] = useState(isClient ? clientOrgName : availableClients[0] || "PathAxiom");
  const [newClientName, setNewClientName] = useState("");
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [description, setDescription] = useState("");
  const [modulesInput, setModulesInput] = useState("Authentication, Billing, Dashboard");
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert("Please provide both project name and code.");
      return;
    }

    let finalClient = "";
    let finalClients: string[] = [];

    if (isSharedProject) {
      if (selectedClients.length === 0) {
        alert("Please tag at least one client for this shared project.");
        return;
      }
      finalClients = selectedClients;
      finalClient = selectedClients.join(", ");
    } else {
      finalClient = isCreatingNewClient ? newClientName.trim() : client;
      if (!finalClient) {
        alert("Please specify a client organization.");
        return;
      }
      finalClients = [finalClient];
    }

    // Split modules input into clean array
    const rawModules = modulesInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const modules = rawModules.length > 0 ? Array.from(new Set(rawModules)) : ["General"];

    // Default features
    const features: Record<string, string[]> = {};
    modules.forEach((m) => {
      features[m] = ["General"];
    });

    setBusy(true);
    try {
      await onCreate(
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          client_name: finalClient,
          client_names: finalClients,
          is_shared: isSharedProject,
          description: description.trim(),
          modules,
          features,
          assigned_user_ids: assignedUserIds,
        },
        assignedUserIds
      );
      onClose();
    } catch (err: any) {
      alert("Failed to create project: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleUser = (id: number) => {
    setAssignedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl p-6 shadow-2xl bg-white border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderGit2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Project</h3>
              <p className="text-[11px] text-slate-500">Configure project credentials, modules, and access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Project Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Project Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Healthcare Patient Portal"
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Project Code *
              </label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRJ-004"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono font-bold bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Client Organization & Multi-Client Scope */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Client Organization & Scope *
              </label>
              {!isClient && (
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSharedProject}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsSharedProject(checked);
                      if (checked && selectedClients.length === 0) {
                        setSelectedClients([client || availableClients[0] || "PathAxiom"]);
                      }
                    }}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-indigo-700">Shared Project Across Multiple Clients</span>
                </label>
              )}
            </div>

            {isSharedProject ? (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-indigo-900 flex items-center gap-1">
                    <Users size={12} className="text-indigo-600" />
                    <span>Tagged Clients ({selectedClients.length})</span>
                  </span>
                  {selectedClients.length < availableClients.length && (
                    <button
                      type="button"
                      onClick={() => setSelectedClients([...availableClients])}
                      className="text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer text-[10px]"
                    >
                      + Tag All Existing Clients
                    </button>
                  )}
                </div>

                {/* Selected Client Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-lg border border-indigo-100">
                  {selectedClients.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No clients tagged yet. Select or type below.</span>
                  ) : (
                    selectedClients.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                      >
                        <Building2 size={11} className="text-indigo-500" />
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedClients(selectedClients.filter((sc) => sc !== c))}
                          className="p-0.5 rounded-full hover:bg-indigo-200 text-indigo-600 cursor-pointer"
                          title={`Remove ${c}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Client Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedClients.includes(val)) {
                        setSelectedClients([...selectedClients, val]);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">+ Add from Existing Clients...</option>
                    {availableClients
                      .filter((c) => !selectedClients.includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>

                  <div className="flex gap-1.5">
                    <input
                      value={customClientInput}
                      onChange={(e) => setCustomClientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customClientInput.trim() && !selectedClients.includes(customClientInput.trim())) {
                            setSelectedClients([...selectedClients, customClientInput.trim()]);
                            setCustomClientInput("");
                          }
                        }
                      }}
                      placeholder="Type client name…"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customClientInput.trim() && !selectedClients.includes(customClientInput.trim())) {
                          setSelectedClients([...selectedClients, customClientInput.trim()]);
                          setCustomClientInput("");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  💡 This project will be shared across all tagged client workspaces and allow tenant-specific defect filtering.
                </div>
              </div>
            ) : (
              <div>
                {!isClient && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewClient(false)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                        !isCreatingNewClient ? "bg-indigo-100 text-indigo-800" : "text-slate-500"
                      }`}
                    >
                      Existing Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewClient(true)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                        isCreatingNewClient ? "bg-indigo-100 text-indigo-800" : "text-slate-500"
                      }`}
                    >
                      + Add New Client
                    </button>
                  </div>
                )}

                {isCreatingNewClient ? (
                  <input
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Type new client organization name…"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
                  />
                ) : (
                  <select
                    disabled={isClient}
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none cursor-pointer"
                  >
                    {availableClients.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the application scope, stack, or target audience…"
              className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Initial Modules */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Initial Modules (Comma separated)
            </label>
            <input
              value={modulesInput}
              onChange={(e) => setModulesInput(e.target.value)}
              placeholder="Authentication, Billing, Dashboard, Settings"
              className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Modules will be created with default features. You can customize them anytime in &apos;Modules &amp; Features&apos;.
            </p>
          </div>

          {/* Give Access / Assign Team Members */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">
                Give Project Access to Users ({assignedUserIds.length} of {users.length} selected)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (userSearch.trim()) {
                    const filteredIds = filteredUsers.map((u) => u.id);
                    const allFilteredSelected = filteredIds.every((id) => assignedUserIds.includes(id));
                    if (allFilteredSelected) {
                      setAssignedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
                    } else {
                      setAssignedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
                    }
                  } else {
                    if (assignedUserIds.length === users.length) setAssignedUserIds([]);
                    else setAssignedUserIds(users.map((u) => u.id));
                  }
                }}
                className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline"
              >
                {userSearch.trim()
                  ? filteredUsers.length > 0 && filteredUsers.every((u) => assignedUserIds.includes(u.id))
                    ? "Deselect Filtered"
                    : "Select Filtered"
                  : assignedUserIds.length === users.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* User Search Bar */}
            <div className="relative mb-2">
              <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, email, or role…"
                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1 bg-slate-50/50">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No users found matching &quot;{userSearch}&quot;
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const checked = assignedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUser(u.id)}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                        <span className="font-medium text-slate-800">{u.name}</span>
                        <span className="text-[10px] text-slate-400">({u.email})</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {u.role}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              {busy ? "Creating Project…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== EDIT PROJECT MODAL ====================
function EditProjectModal({
  project,
  availableClients,
  isClient,
  onClose,
  onUpdate,
}: {
  project: Project;
  availableClients: string[];
  isClient: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Project>) => Promise<void>;
}) {
  const [name, setName] = useState(project.name);
  
  const initialShared = Boolean(
    project.is_shared ||
    (project.client_names && project.client_names.length > 1) ||
    (project.client_name && project.client_name.includes(","))
  );

  const initialClients = project.client_names && project.client_names.length > 0
    ? project.client_names
    : (project.client_name || "PathAxiom").split(",").map(c => c.trim()).filter(Boolean);

  const [isSharedProject, setIsSharedProject] = useState(initialShared);
  const [selectedClients, setSelectedClients] = useState<string[]>(initialClients.length > 0 ? initialClients : ["PathAxiom"]);
  const [customClientInput, setCustomClientInput] = useState("");
  const [singleClient, setSingleClient] = useState(initialClients[0] || project.client_name || "PathAxiom");
  const [description, setDescription] = useState(project.description || "");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalClient = "";
    let finalClients: string[] = [];

    if (isSharedProject) {
      if (selectedClients.length === 0) {
        alert("Please select or tag at least one client for this shared project.");
        return;
      }
      finalClients = selectedClients;
      finalClient = selectedClients.join(", ");
    } else {
      finalClient = singleClient.trim() || "PathAxiom";
      finalClients = [finalClient];
    }

    setBusy(true);
    try {
      await onUpdate({
        name: name.trim(),
        client_name: finalClient,
        client_names: finalClients,
        is_shared: isSharedProject,
        description: description.trim(),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-6 shadow-2xl bg-white border border-slate-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Pencil size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Edit Project {project.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Project Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Client Scope & Multi-Client Assignment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Client Organization & Scope *
              </label>
              {!isClient && (
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSharedProject}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsSharedProject(checked);
                      if (checked && selectedClients.length === 0) {
                        setSelectedClients([singleClient || availableClients[0] || "PathAxiom"]);
                      }
                    }}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-indigo-700">Shared Project Across Multiple Clients</span>
                </label>
              )}
            </div>

            {isSharedProject ? (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-indigo-900 flex items-center gap-1">
                    <Users size={12} className="text-indigo-600" />
                    <span>Tagged Clients ({selectedClients.length})</span>
                  </span>
                  {selectedClients.length < availableClients.length && (
                    <button
                      type="button"
                      onClick={() => setSelectedClients([...availableClients])}
                      className="text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer text-[10px]"
                    >
                      + Tag All Existing Clients
                    </button>
                  )}
                </div>

                {/* Selected Client Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-lg border border-indigo-100">
                  {selectedClients.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No clients tagged yet.</span>
                  ) : (
                    selectedClients.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                      >
                        <Building2 size={11} className="text-indigo-500" />
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedClients(selectedClients.filter((sc) => sc !== c))}
                          className="p-0.5 rounded-full hover:bg-indigo-200 text-indigo-600 cursor-pointer"
                          title={`Remove ${c}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Client controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedClients.includes(val)) {
                        setSelectedClients([...selectedClients, val]);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">+ Add from Existing Clients...</option>
                    {availableClients
                      .filter((c) => !selectedClients.includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>

                  <div className="flex gap-1.5">
                    <input
                      value={customClientInput}
                      onChange={(e) => setCustomClientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customClientInput.trim() && !selectedClients.includes(customClientInput.trim())) {
                            setSelectedClients([...selectedClients, customClientInput.trim()]);
                            setCustomClientInput("");
                          }
                        }
                      }}
                      placeholder="Type client name…"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customClientInput.trim() && !selectedClients.includes(customClientInput.trim())) {
                          setSelectedClients([...selectedClients, customClientInput.trim()]);
                          setCustomClientInput("");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <select
                  disabled={isClient}
                  value={singleClient}
                  onChange={(e) => setSingleClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none cursor-pointer"
                >
                  {availableClients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== GIVE ACCESS / MANAGE TEAM MODAL ====================
function ManageAccessModal({
  project,
  users,
  onClose,
  onSave,
}: {
  project: Project;
  users: User[];
  onClose: () => void;
  onSave: (assignedUserIds: number[]) => Promise<void>;
}) {
  const initialSelected = useMemo(() => {
    return users
      .filter(
        (u) =>
          (project.assigned_user_ids || []).includes(u.id) ||
          (u.assigned_projects || []).includes(project.code)
      )
      .map((u) => u.id);
  }, [project, users]);

  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const toggleUser = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave(selectedIds);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-6 shadow-2xl bg-white border border-slate-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Give Project Access: {project.name} ({project.code})
              </h3>
              <p className="text-[11px] text-slate-500">
                Select which team members have active access to this project
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Quick select and selection counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">
            {selectedIds.length} of {users.length} users selected
          </span>
          <button
            type="button"
            onClick={() => {
              if (search.trim()) {
                const filteredIds = filteredUsers.map((u) => u.id);
                const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id));
                if (allFilteredSelected) {
                  setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
                } else {
                  setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
                }
              } else {
                if (selectedIds.length === users.length) setSelectedIds([]);
                else setSelectedIds(users.map((u) => u.id));
              }
            }}
            className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline"
          >
            {search.trim()
              ? filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id))
                ? "Deselect Filtered"
                : "Select Filtered"
              : selectedIds.length === users.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, role…"
            className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* User Selection List */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1 bg-slate-50/50">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No users found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isAssigned = selectedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                    isAssigned
                      ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                      : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                        isAssigned ? "bg-indigo-600" : "border border-slate-300"
                      }`}
                    >
                      {isAssigned && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                    {u.role}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            <b>{selectedIds.length}</b> team members selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={busy}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              {busy ? "Saving…" : "Save Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== PROJECT STRUCTURE (MODULES & FEATURES) MODAL ====================
function ManageProjectStructureModal({
  project,
  onClose,
  onUpdateProject,
}: {
  project: Project;
  onClose: () => void;
  onUpdateProject: (id: number, patch: Partial<Project>) => Promise<void>;
}) {
  const [newModName, setNewModName] = useState("");
  const [featInputs, setFeatInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const modules = project.modules || [];
  const features = project.features || {};

  // Add a new module
  const handleAddModule = async () => {
    if (!newModName.trim()) return;
    const mod = newModName.trim();
    setSaving(true);
    try {
      const updatedModules = Array.from(new Set([...modules, mod]));
      const updatedFeatures = {
        ...features,
        [mod]: features[mod] && features[mod].length > 0 ? features[mod] : ["General"],
      };
      await onUpdateProject(project.id, {
        modules: updatedModules,
        features: updatedFeatures,
      });
      setNewModName("");
    } finally {
      setSaving(false);
    }
  };

  // Delete an entire module
  const handleDeleteModule = async (modToDelete: string) => {
    if (!confirm(`Are you sure you want to delete module "${modToDelete}" and its features?`)) return;
    setSaving(true);
    try {
      const updatedModules = modules.filter((m) => m !== modToDelete);
      const updatedFeatures = { ...features };
      delete updatedFeatures[modToDelete];
      await onUpdateProject(project.id, {
        modules: updatedModules,
        features: updatedFeatures,
      });
    } finally {
      setSaving(false);
    }
  };

  // Add a feature inside a module
  const handleAddFeature = async (mod: string) => {
    const val = (featInputs[mod] || "").trim();
    if (!val) return;
    setSaving(true);
    try {
      const current = features[mod] || [];
      const updatedFeats = Array.from(new Set([...current, val]));
      const updatedFeatures = { ...features, [mod]: updatedFeats };
      await onUpdateProject(project.id, { features: updatedFeatures });
      setFeatInputs((prev) => ({ ...prev, [mod]: "" }));
    } finally {
      setSaving(false);
    }
  };

  // Delete a feature
  const handleDeleteFeature = async (mod: string, featToDelete: string) => {
    setSaving(true);
    try {
      const current = features[mod] || [];
      const updatedFeats = current.filter((f) => f !== featToDelete);
      const updatedFeatures = { ...features, [mod]: updatedFeats };
      await onUpdateProject(project.id, { features: updatedFeatures });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col bg-white border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {project.name} ({project.code}) — Modules & Features
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure hierarchy categories and feature test items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Add Module Bar */}
        <div className="pt-3 pb-3 border-b border-slate-100 flex items-center gap-2">
          <input
            value={newModName}
            onChange={(e) => setNewModName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddModule();
              }
            }}
            placeholder="+ Type new module name and press Enter…"
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-500"
          />
          <button
            onClick={handleAddModule}
            disabled={saving || !newModName.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            Add Module
          </button>
        </div>

        {/* Module & Feature Cards List */}
        <div className="py-3 space-y-3 overflow-y-auto flex-1 pr-1">
          {modules.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No modules configured yet. Add your first module above.
            </p>
          ) : (
            modules.map((m) => {
              const feats = features[m] || ["General"];
              const currentInput = featInputs[m] || "";

              return (
                <div
                  key={m}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                        📁
                      </span>
                      <span className="font-bold text-xs text-slate-900">{m}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({feats.length} {feats.length === 1 ? "feature" : "features"})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteModule(m)}
                      title={`Delete module "${m}"`}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Feature Tags & Direct Inline Quick-Add */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    {feats.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-slate-200/80 transition-colors"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(m, f)}
                          title={`Remove feature "${f}"`}
                          className="text-slate-400 hover:text-red-500 rounded p-0.5 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}

                    {/* Inline Feature Input */}
                    <div className="inline-flex items-center gap-1">
                      <input
                        value={currentInput}
                        onChange={(e) => setFeatInputs((prev) => ({ ...prev, [m]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFeature(m);
                          }
                        }}
                        placeholder="+ Add feature (Press Enter)..."
                        className="px-2.5 py-1 rounded-md text-[11px] bg-slate-50 border border-dashed border-slate-300 outline-none focus:bg-white focus:border-indigo-500 focus:border-solid w-44 placeholder:text-slate-400 transition-all"
                      />
                      {currentInput.trim() && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleAddFeature(m)}
                          className="px-1.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-medium shadow-xs cursor-pointer"
                          title="Add feature"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            💡 Press <b>Enter</b> inside any module to add features instantly.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagement;
