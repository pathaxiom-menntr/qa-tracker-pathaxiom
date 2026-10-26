"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  X,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  KeyRound,
  Eye,
  EyeOff,
  Bug,
  FileText,
  FolderGit2,
  ListChecks,
  Activity,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Role, User } from "@/lib/types";

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
  sky: "#0284C7",
};

const ALL_ROLES: Role[] = [
  "Super Admin",
  "Admin",
  "QA Manager",
  "QA Lead",
  "QA Engineer",
  "Client",
];

const ROLE_COLORS: Record<Role, string> = {
  "Super Admin": COLORS.accent,
  Admin: COLORS.accent2,
  "QA Manager": COLORS.teal,
  "QA Lead": COLORS.sky,
  "QA Engineer": COLORS.green,
  Client: COLORS.amber,
};

export interface PermissionItem {
  id: string;
  label: string;
  desc: string;
}

export interface PermissionGroup {
  category: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: "Defects & Bug Tracking",
    description: "Manage bug life-cycle, severity, and resolution",
    icon: Bug,
    permissions: [
      { id: "defects:view", label: "View Defects", desc: "Browse, filter, and inspect bug listings" },
      { id: "defects:create", label: "Log Defects", desc: "Report and file new defects in the tracker" },
      { id: "defects:edit", label: "Edit Defects", desc: "Modify bug details, assignees, and statuses" },
      { id: "defects:delete", label: "Delete Defects", desc: "Remove defect entries from PostgreSQL" },
    ],
  },
  {
    category: "Reports & Downloads",
    description: "Generate and export QA documentation",
    icon: FileText,
    permissions: [
      { id: "reports:download", label: "Download Reports", desc: "Download Excel (.xlsx) and PDF bug reports" },
      { id: "reports:upload", label: "Upload & Save Reports", desc: "Publish and archive QA test run reports" },
    ],
  },
  {
    category: "Projects & Structure",
    description: "Manage project modules and sub-features",
    icon: FolderGit2,
    permissions: [
      { id: "projects:manage", label: "Manage Hierarchy", desc: "Configure project categories, modules & features" },
    ],
  },
  {
    category: "Test Cases & Portals",
    description: "Test execution coverage and portal banks",
    icon: ListChecks,
    permissions: [
      { id: "testcases:view", label: "View Test Cases", desc: "Inspect test case banks and execution numbers" },
      { id: "testcases:manage", label: "Manage Test Cases", desc: "Add or update test suites across portals" },
    ],
  },
  {
    category: "Specialized QA Testing",
    description: "Performance, security, and compatibility monitoring",
    icon: Activity,
    permissions: [
      { id: "performance:access", label: "Performance Monitoring", desc: "Access latency metrics & log performance reports" },
      { id: "vapt:access", label: "Security (VAPT) Findings", desc: "View security vulnerability reports & remediation" },
      { id: "browsers:access", label: "Browser Compatibility", desc: "View cross-browser and platform parity matrix" },
    ],
  },
  {
    category: "User Administration",
    description: "Manage accounts and credential provisioning",
    icon: Shield,
    permissions: [
      { id: "users:manage", label: "Manage Users", desc: "Provision, edit, and deactivate user accounts" },
    ],
  },
];

export const PERMISSION_LABELS: Record<string, string> = {
  "defects:view": "View Bugs",
  "defects:create": "Log Bugs",
  "defects:edit": "Edit Bugs",
  "defects:delete": "Delete Bugs",
  "reports:download": "Download Reports",
  "reports:upload": "Upload Reports",
  "projects:manage": "Manage Structure",
  "testcases:view": "View Test Cases",
  "testcases:manage": "Manage Test Cases",
  "performance:access": "Performance",
  "vapt:access": "VAPT Security",
  "browsers:access": "Browsers",
  "users:manage": "Manage Users",
};

import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
export { DEFAULT_ROLE_PERMISSIONS };

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tone: string;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: COLORS.sub }}>
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <Icon size={16} color={tone} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: COLORS.ink }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: COLORS.sub }}>
        {sub}
      </div>
    </div>
  );
}

export function UserManagement() {
  const { users, addUser, editUser, toggleUserStatus, deleteUser, restoreUser, purgeUser, currentUser } = useQAStore();

  const [viewTab, setViewTab] = useState<"active" | "trash">("active");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmPurgeUser, setConfirmPurgeUser] = useState<User | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isSuperAdmin = currentUser?.role === "Super Admin";
  const isAdmin = currentUser?.role === "Admin";
  const canCreateUsers = isSuperAdmin || isAdmin;

  // Determine allowed roles when adding a user (Super Admin role is single & predefined, cannot be created):
  const creatableRoles: Role[] = isSuperAdmin
    ? ["Admin", "QA Manager", "QA Lead", "QA Engineer", "Client"]
    : isAdmin
    ? ["QA Manager", "QA Lead", "QA Engineer", "Client"]
    : [];

  const activeUsers = useMemo(() => users.filter((u) => !u.is_deleted), [users]);
  const trashUsers = useMemo(() => users.filter((u) => !!u.is_deleted), [users]);

  // Filtered users list based on active sub-tab
  const filteredUsers = useMemo(() => {
    const baseList = viewTab === "active" ? activeUsers : trashUsers;
    return baseList.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [viewTab, activeUsers, trashUsers, search, roleFilter, statusFilter]);

  const activeCount = activeUsers.filter((u) => u.status === "active").length;
  const deactivatedCount = activeUsers.filter((u) => u.status === "deactivated").length;

  // Check if current user can manage/edit/delete a target user
  const canManageTargetUser = (target: User) => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      // Admin can manage QA roles and Clients, but not Super Admin or other Admins
      return target.role !== "Super Admin" && target.role !== "Admin";
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Role Permission Notice Banner */}
      <div
        className="px-4 py-3 rounded-xl border flex items-center justify-between text-xs"
        style={{
          background: isSuperAdmin ? COLORS.accent + "10" : isAdmin ? COLORS.accent2 + "10" : COLORS.panel2,
          borderColor: isSuperAdmin ? COLORS.accent + "40" : isAdmin ? COLORS.accent2 + "40" : COLORS.border,
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} color={isSuperAdmin ? COLORS.accent : isAdmin ? COLORS.accent2 : COLORS.sub} />
          <span>
            {isSuperAdmin ? (
              <>
                Logged in as <b>Super Admin</b>: You have full authority to provision credentials, assign roles, and define <b>custom permissions</b> for all users.
              </>
            ) : isAdmin ? (
              <>
                Logged in as <b>Admin</b>: You have authorization to manage credentials and customize <b>permissions</b> for QA Managers, QA Leads, QA Engineers, and Clients.
              </>
            ) : (
              <>
                Logged in as <b>{currentUser?.role}</b>: User account provisioning and permission configuration is restricted to Super Admin and Admin roles.
              </>
            )}
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider"
          style={{
            background: isSuperAdmin ? COLORS.accent + "20" : isAdmin ? COLORS.accent2 + "20" : COLORS.border,
            color: isSuperAdmin ? COLORS.accent : isAdmin ? COLORS.accent2 : COLORS.sub,
          }}
        >
          {isSuperAdmin ? "Super Admin Access" : isAdmin ? "Admin Access" : "Read Only"}
        </span>
      </div>

      {/* Sub-Tab Navigation: Active Users vs Recycle Bin */}
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
            <Users size={14} />
            <span>Active Users</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                viewTab === "active" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {activeUsers.length}
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
              {trashUsers.length}
            </span>
          </button>
        </div>

        {canCreateUsers && viewTab === "active" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white shadow-sm transition-all"
            style={{ background: COLORS.accent }}
          >
            <UserPlus size={14} />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Users"
          value={activeUsers.length}
          sub="Registered accounts in PostgreSQL"
          icon={Users}
          tone={COLORS.accent}
        />
        <StatCard
          label="Active Access"
          value={activeCount}
          sub="Granted active system access"
          icon={UserCheck}
          tone={COLORS.green}
        />
        <StatCard
          label="Deactivated"
          value={deactivatedCount}
          sub="Access currently suspended"
          icon={UserX}
          tone={COLORS.red}
        />
        <StatCard
          label="Recycle Bin"
          value={trashUsers.length}
          sub="Soft-deleted accounts (restorable)"
          icon={Trash2}
          tone={COLORS.amber}
        />
      </div>

      {/* Control Bar */}
      <div
        className="rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3.5 shadow-xs"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search size={14} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role…"
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

          {/* Role Filter */}
          <div className="relative group">
            <Shield
              size={13}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                roleFilter !== "ALL" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                roleFilter !== "ALL"
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
              } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
            >
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                roleFilter !== "ALL" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <CheckCircle2
              size={13}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                statusFilter !== "ALL" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                statusFilter !== "ALL"
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
              } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>
            <ChevronDown
              size={12}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                statusFilter !== "ALL" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </div>
        </div>

        {/* Add User Button (Visible to Super Admin and Admin) */}
        {canCreateUsers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
            style={{ background: isSuperAdmin ? COLORS.accent : COLORS.accent2 }}
          >
            <UserPlus size={15} />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                style={{
                  background: COLORS.panel2,
                  borderBottom: `1px solid ${COLORS.border}`,
                  color: COLORS.sub,
                }}
              >
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">
                  {viewTab === "trash" ? "Deleted Info" : "Permissions / Privileges"}
                </th>
                <th className="py-3 px-4 font-semibold">
                  {viewTab === "trash" ? "Deleted Date" : "Created Date"}
                </th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs" style={{ color: COLORS.sub }}>
                    {viewTab === "trash"
                      ? "Recycle Bin is empty. No deleted user accounts."
                      : "No users matching criteria."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleColor = ROLE_COLORS[u.role] || COLORS.sub;
                  const isCurrent = currentUser?.id === u.id;
                  const canManage = canManageTargetUser(u);

                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const userPerms =
                    u.permissions && u.permissions.length > 0
                      ? u.permissions
                      : DEFAULT_ROLE_PERMISSIONS[u.role] || [];

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 transition-colors"
                      style={{ color: COLORS.ink }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-sm"
                            style={{ background: roleColor }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded font-normal"
                                  style={{ background: COLORS.accent + "18", color: COLORS.accent }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] flex items-center gap-1" style={{ color: COLORS.sub }}>
                              <Mail size={11} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px]"
                          style={{
                            background: roleColor + "1E",
                            color: roleColor,
                          }}
                        >
                          {u.role}
                        </span>
                        {u.role === "Client" && (
                          <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                            Org: {u.client_name || "PathAxiom"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px]"
                          style={{
                            background: u.status === "active" ? COLORS.green + "1E" : COLORS.red + "1E",
                            color: u.status === "active" ? COLORS.green : COLORS.red,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: u.status === "active" ? COLORS.green : COLORS.red }}
                          />
                          {u.status === "active" ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      {/* Permissions / Deleted Info Column */}
                      {viewTab === "trash" ? (
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                            Deleted by: <b>{u.deleted_by || "Admin"}</b>
                          </span>
                        </td>
                      ) : (
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {userPerms.length} {userPerms.length === 1 ? "Privilege" : "Privileges"}
                            </span>
                            {userPerms.slice(0, 3).map((p: string) => {
                              const label = PERMISSION_LABELS[p] || p.split(":")[1] || p;
                              return (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-medium truncate max-w-[85px]"
                                  title={label}
                                >
                                  {label}
                                </span>
                              );
                            })}
                            {userPerms.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{userPerms.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-4" style={{ color: COLORS.sub }}>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {viewTab === "trash" && u.deleted_at
                            ? new Date(u.deleted_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : u.createdAt ? u.createdAt.slice(0, 10) : "2026-09-24"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {viewTab === "trash" ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* 1-Click Restore Button */}
                            <button
                              onClick={async () => {
                                setRestoringId(u.id);
                                try {
                                  await restoreUser(u.id);
                                } finally {
                                  setRestoringId(null);
                                }
                              }}
                              disabled={restoringId === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              title="Restore user back to active system access"
                            >
                              <RotateCcw size={12} />
                              <span>{restoringId === u.id ? "Restoring..." : "Restore"}</span>
                            </button>

                            {/* Permanently Delete Button */}
                            <button
                              onClick={() => setConfirmPurgeUser(u)}
                              disabled={isCurrent}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-600 border border-red-200 transition-colors cursor-pointer"
                              title="Permanently purge user from PostgreSQL database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : canManage ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit User Button */}
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              style={{ color: COLORS.sub }}
                              title="Edit user credentials, role & permissions"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Toggle Status Button */}
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              disabled={isCurrent}
                              className="px-2 py-1 rounded text-[11px] font-medium transition-colors border cursor-pointer"
                              style={{
                                borderColor: COLORS.border,
                                background: COLORS.panel2,
                                color: isCurrent
                                  ? COLORS.sub
                                  : u.status === "active"
                                  ? COLORS.amber
                                  : COLORS.green,
                                opacity: isCurrent ? 0.4 : 1,
                                cursor: isCurrent ? "not-allowed" : "pointer",
                              }}
                              title={isCurrent ? "Cannot deactivate yourself" : "Toggle status in database"}
                            >
                              {u.status === "active" ? "Deactivate" : "Activate"}
                            </button>

                            {/* Delete / Move to Recycle Bin Button */}
                            <button
                              onClick={() => setConfirmDeleteUser(u)}
                              disabled={isCurrent}
                              className="p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              style={{
                                color: isCurrent ? COLORS.sub : COLORS.red,
                                opacity: isCurrent ? 0.3 : 1,
                                cursor: isCurrent ? "not-allowed" : "pointer",
                              }}
                              title={isCurrent ? "Cannot delete yourself" : "Move user to Recycle Bin"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] italic" style={{ color: COLORS.sub }}>
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Move User to Recycle Bin */}
      {confirmDeleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000077" }}
          onClick={() => setConfirmDeleteUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl p-5 shadow-xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Trash2 size={18} />
              <span className="text-sm font-semibold">Move User to Recycle Bin?</span>
            </div>
            <p className="text-xs mb-2 text-slate-700">
              Are you sure you want to move <b>{confirmDeleteUser.name}</b> (<code>{confirmDeleteUser.email}</code>) to the Recycle Bin?
            </p>
            <p className="text-[11px] mb-5 text-slate-500">
              The user account will be deactivated and hidden from active views. It will stay in the Recycle Bin indefinitely and can be restored at any time.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{ color: COLORS.sub }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteUser(confirmDeleteUser.id);
                  setConfirmDeleteUser(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer"
                style={{ background: COLORS.amber }}
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Permanently Purge User */}
      {confirmPurgeUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000088" }}
          onClick={() => setConfirmPurgeUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl p-5 shadow-2xl border border-red-200"
            style={{ background: COLORS.panel }}
          >
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle size={18} />
              <span className="text-sm font-bold">Permanently Delete User?</span>
            </div>
            <p className="text-xs mb-2 text-slate-800">
              Permanently delete <b>{confirmPurgeUser.name}</b> (<code>{confirmPurgeUser.email}</code>) from the PostgreSQL database?
            </p>
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[11px] mb-5 border border-red-200 leading-relaxed">
              ⚠️ <b>Warning:</b> This action CANNOT be undone. All credentials, roles, and user assignments will be permanently destroyed.
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmPurgeUser(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{ color: COLORS.sub }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await purgeUser(confirmPurgeUser.id);
                  setConfirmPurgeUser(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer bg-red-600 hover:bg-red-700"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <UserModal
          title={isSuperAdmin ? "Add User (Super Admin)" : "Add User (Admin)"}
          subtitle={
            isSuperAdmin
              ? "As Super Admin, provision credentials for Admins, QA Leads, QA Engineers, or Clients and define what they can do."
              : "As Admin, provision credentials for a QA team member or Client and define what they can do."
          }
          submitLabel="Add User"
          availableRoles={creatableRoles}
          requirePassword={true}
          initialData={{
            name: "",
            email: "",
            role: creatableRoles[0] || "Admin",
            password: "",
            client_name: "PathAxiom",
            permissions: DEFAULT_ROLE_PERMISSIONS[creatableRoles[0] || "Admin"] || [],
          }}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            await addUser(data.name, data.email, data.role, data.password!, data.client_name, undefined, data.permissions);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserModal
          title={`Edit User Credentials & Access — ${editingUser.name}`}
          subtitle="Update account details, role permissions, or reset user password in PostgreSQL."
          submitLabel="Save Changes"
          availableRoles={editingUser.role === "Super Admin" ? ["Super Admin"] : creatableRoles}
          requirePassword={false}
          initialData={{
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
            password: "",
            client_name: editingUser.client_name || "PathAxiom",
            permissions:
              editingUser.permissions && editingUser.permissions.length > 0
                ? editingUser.permissions
                : DEFAULT_ROLE_PERMISSIONS[editingUser.role] || [],
          }}
          onClose={() => setEditingUser(null)}
          onSubmit={async (data) => {
            await editUser(
              editingUser.id,
              data.name,
              data.email,
              data.role,
              data.password || undefined,
              data.client_name,
              undefined,
              data.permissions
            );
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserModal({
  title,
  subtitle,
  submitLabel,
  availableRoles,
  requirePassword,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  submitLabel: string;
  availableRoles: Role[];
  requirePassword: boolean;
  initialData: {
    name: string;
    email: string;
    role: Role;
    password?: string;
    client_name?: string;
    permissions?: string[];
  };
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    role: Role;
    password?: string;
    client_name?: string;
    permissions?: string[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [role, setRole] = useState<Role>(initialData.role);
  const [clientName, setClientName] = useState(initialData.client_name || "PathAxiom");
  const [password, setPassword] = useState(initialData.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(
    initialData.permissions && initialData.permissions.length > 0
      ? initialData.permissions
      : DEFAULT_ROLE_PERMISSIONS[initialData.role] || []
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // When role changes, auto-suggest default permissions for that role
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
  };

  const handleTogglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const all = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));
    setPermissions(Array.from(new Set(all)));
  };

  const handleClearAll = () => {
    setPermissions([]);
  };

  const handleResetToRoleDefault = () => {
    setPermissions(DEFAULT_ROLE_PERMISSIONS[role] || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Please fill out both name and email fields.");
      return;
    }

    if (requirePassword && (!password || password.length < 6)) {
      setError("Password is required and must be at least 6 characters.");
      return;
    }

    if (!requirePassword && password && password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        role,
        password: password.trim() || undefined,
        client_name: role === "Client" ? clientName.trim() : undefined,
        permissions,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save user credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2">
            <KeyRound size={19} color={COLORS.accent} />
            <div>
              <span className="text-sm font-bold block" style={{ color: COLORS.ink }}>
                {title}
              </span>
              <span className="text-[11px] block" style={{ color: COLORS.sub }}>
                {subtitle}
              </span>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-slate-100 cursor-pointer">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: COLORS.panel2,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                }}
              />
            </div>

            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@menntr.com"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: COLORS.panel2,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Password field */}
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                {requirePassword ? (
                  <>
                    User Password <span className="text-red-500">*</span>
                  </>
                ) : (
                  "Reset Password (Optional)"
                )}
              </label>
              <div className="relative">
                <input
                  required={requirePassword}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    requirePassword
                      ? "Set password (min 6 characters)"
                      : "Leave blank to keep existing password"
                  }
                  className="w-full pl-3 pr-9 py-2 rounded-lg text-xs outline-none"
                  style={{
                    background: COLORS.panel2,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.ink,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                  style={{ color: COLORS.sub }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Assigned Role */}
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Assigned Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                style={{
                  background: COLORS.panel2,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                }}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role === "Client" && (
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Client Organization / Company <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. PathAxiom, FinTech Global, HealthPlus Systems"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-medium"
                style={{
                  background: COLORS.panel2,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                }}
              />
              <span className="text-[10px] mt-1 block text-slate-500">
                This client will strictly view defects and projects belonging to this organization.
              </span>
            </div>
          )}

          {/* Granular Permissions Section (What they can do) */}
          <div className="pt-3 border-t" style={{ borderColor: COLORS.border }}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div>
                <label className="text-xs font-bold block" style={{ color: COLORS.ink }}>
                  Permissions & Capabilities (What this user can do)
                </label>
                <span className="text-[11px] text-slate-500">
                  Provide custom module access and action permissions for this account.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetToRoleDefault}
                  className="px-2.5 py-1 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
                  title="Reset to recommended permissions for selected role"
                >
                  Default for {role}
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 rounded text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 rounded text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {PERMISSION_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div
                    key={group.category}
                    className="p-3 rounded-lg border bg-slate-50/70"
                    style={{ borderColor: COLORS.border }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <GroupIcon size={14} className="text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">{group.category}</span>
                      <span className="text-[10px] text-slate-400">({group.description})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.permissions.map((perm) => {
                        const checked = permissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2.5 p-2 rounded-md border cursor-pointer transition-all ${
                              checked
                                ? "bg-white border-indigo-300 shadow-2xs"
                                : "bg-white/60 border-slate-200 opacity-75 hover:opacity-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="mt-0.5 accent-indigo-600 rounded cursor-pointer"
                            />
                            <div className="text-[11px] leading-tight select-none">
                              <span className={`font-semibold block ${checked ? "text-indigo-950" : "text-slate-700"}`}>
                                {perm.label}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                {perm.desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 px-1">
              <span className="text-indigo-700 font-semibold">
                ✓ Granted: {permissions.length} of {PERMISSION_GROUPS.flatMap((g) => g.permissions).length} capabilities
              </span>
              <span className="text-slate-400">
                Permissions are saved to PostgreSQL
              </span>
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
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 cursor-pointer"
              style={{ color: COLORS.sub }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-opacity cursor-pointer hover:opacity-95"
              style={{
                background: COLORS.accent,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
