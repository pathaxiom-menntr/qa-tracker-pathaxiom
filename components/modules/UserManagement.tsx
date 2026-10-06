"use client";

import React, { useState } from "react";
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
  Info,
  Lock,
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
  const { users, addUser, editUser, toggleUserStatus, deleteUser, currentUser } = useQAStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isSuperAdmin = currentUser?.role === "Super Admin";
  const isAdmin = currentUser?.role === "Admin";
  const canCreateUsers = isSuperAdmin || isAdmin;

  // Determine allowed creatable roles:
  // - Super Admin can create Admin, QA Manager, QA Lead, QA Engineer, Client (and Super Admin)
  // - Admin can create QA Manager, QA Lead, QA Engineer, and Client
  const creatableRoles: Role[] = isSuperAdmin
    ? ["Admin", "QA Manager", "QA Lead", "QA Engineer", "Client", "Super Admin"]
    : isAdmin
    ? ["QA Manager", "QA Lead", "QA Engineer", "Client"]
    : [];

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === "active").length;
  const deactivatedCount = users.filter((u) => u.status === "deactivated").length;

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
                Logged in as <b>Super Admin</b>: You have full authority to create and provision credentials for <b>Admins</b>, <b>QA Team</b>, and <b>Clients</b>.
              </>
            ) : isAdmin ? (
              <>
                Logged in as <b>Admin</b>: You have authorization to create and manage credentials for <b>QA Managers</b>, <b>QA Leads</b>, <b>QA Engineers</b>, and <b>Clients</b>.
              </>
            ) : (
              <>
                Logged in as <b>{currentUser?.role}</b>: User account provisioning is restricted to Super Admin and Admin roles.
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={users.length}
          sub="Registered accounts in PostgreSQL"
          icon={Users}
          tone={COLORS.accent}
        />
        <StatCard
          label="Active Users"
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
          label="QA & Testing Roles"
          value={users.filter((u) => u.role.includes("QA")).length}
          sub="QA Engineers, Leads & Managers"
          icon={Shield}
          tone={COLORS.teal}
        />
      </div>

      {/* Control Bar */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px] max-w-sm"
            style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}` }}
          >
            <Search size={15} color={COLORS.sub} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role…"
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: COLORS.ink }}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={13} color={COLORS.sub} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
            style={{
              background: COLORS.panel2,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.ink,
            }}
          >
            <option value="ALL">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
            style={{
              background: COLORS.panel2,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.ink,
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>
        </div>

        {/* Add User Button (Visible to Super Admin and Admin) */}
        {canCreateUsers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ background: isSuperAdmin ? COLORS.accent : COLORS.accent2 }}
          >
            <UserPlus size={15} />
            Create User Credentials
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
                <th className="py-3 px-4 font-semibold">Created Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs" style={{ color: COLORS.sub }}>
                    No users matching criteria.
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
                      <td className="py-3.5 px-4" style={{ color: COLORS.sub }}>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {u.createdAt ? u.createdAt.slice(0, 10) : "2026-09-24"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit User Button */}
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                              style={{ color: COLORS.sub }}
                              title="Edit user credentials / role"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Toggle Status Button */}
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              disabled={isCurrent}
                              className="px-2 py-1 rounded text-[11px] font-medium transition-colors border"
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

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete user "${u.name}" from PostgreSQL?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              disabled={isCurrent}
                              className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                              style={{
                                color: isCurrent ? COLORS.sub : COLORS.red,
                                opacity: isCurrent ? 0.3 : 1,
                                cursor: isCurrent ? "not-allowed" : "pointer",
                              }}
                              title={isCurrent ? "Cannot delete yourself" : "Delete user from PostgreSQL"}
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

      {/* Add User Modal with Credentials Creation */}
      {showAddModal && (
        <UserModal
          title={isSuperAdmin ? "Create User Credentials (Super Admin)" : "Create User Credentials (Admin)"}
          subtitle={
            isSuperAdmin
              ? "As Super Admin, provision credentials for Admins, QA Leads, QA Engineers, or Clients with a secure login password."
              : "As Admin, provision credentials for a QA team member or Client with a secure login password."
          }
          submitLabel="Create Account & Password"
          availableRoles={creatableRoles}
          requirePassword={true}
          initialData={{
            name: "",
            email: "",
            role: creatableRoles[0] || "Admin",
            password: "",
          }}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            await addUser(data.name, data.email, data.role, data.password!);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserModal
          title={`Edit User Credentials — ${editingUser.name}`}
          subtitle="Update account details or reset user password in PostgreSQL."
          submitLabel="Save Changes"
          availableRoles={isSuperAdmin ? ALL_ROLES : creatableRoles}
          requirePassword={false}
          initialData={{
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
            password: "",
          }}
          onClose={() => setEditingUser(null)}
          onSubmit={async (data) => {
            await editUser(editingUser.id, data.name, data.email, data.role, data.password || undefined);
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
  initialData: { name: string; email: string; role: Role; password?: string };
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: Role; password?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [role, setRole] = useState<Role>(initialData.role);
  const [password, setPassword] = useState(initialData.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
        className="w-full max-w-md rounded-xl p-5 shadow-2xl"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <KeyRound size={17} color={COLORS.accent} />
            <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
              {title}
            </span>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-slate-100">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <p className="text-xs mb-4 leading-relaxed" style={{ color: COLORS.sub }}>
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
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
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
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

          {/* Password field */}
          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200"
                style={{ color: COLORS.sub }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <span className="text-[10px] mt-1 block" style={{ color: COLORS.sub }}>
              {requirePassword
                ? "This password will be securely hashed with bcrypt and saved to PostgreSQL."
                : "Enter 6+ characters only if you wish to overwrite the current password."}
            </span>
          </div>

          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
              Assigned Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
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

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100"
              style={{ color: COLORS.sub }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-opacity"
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
