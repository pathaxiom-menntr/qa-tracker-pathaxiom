"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  Bug,
  Monitor,
  Gauge,
  ShieldAlert,
  Users,
  FolderGit2,
  LogOut,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Info,
  Trash2,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";

// The Original QA Modules + User Management & Project Management
import { ExecutiveDashboard } from "@/components/modules/ExecutiveDashboard";
import { Reports } from "@/components/modules/Reports";
import { TestCases } from "@/components/modules/TestCases";
import { Defects } from "@/components/modules/Defects";
import { CompatibilityBrowsers } from "@/components/modules/CompatibilityBrowsers";
import { Performance } from "@/components/modules/Performance";
import { SecurityVAPT } from "@/components/modules/SecurityVAPT";
import { UserManagement } from "@/components/modules/UserManagement";
import { ProjectManagement } from "@/components/modules/ProjectManagement";
import { GlobalRecycleBin } from "@/components/modules/GlobalRecycleBin";

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
};

const NAV = [
  { key: "overview", label: "Executive Dashboard", icon: LayoutDashboard },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "testcases", label: "Test Cases", icon: ListChecks },
  { key: "defects", label: "Defects", icon: Bug },
  { key: "compatibility", label: "Compatibility & Browsers", icon: Monitor },
  { key: "performance", label: "Performance", icon: Gauge },
  { key: "security", label: "Security (VAPT)", icon: ShieldAlert },
  { key: "users", label: "User Management", icon: Users },
  { key: "projects", label: "Project Management", icon: FolderGit2 },
  { key: "recyclebin", label: "Recycle Bin", icon: Trash2 },
];

export default function Home() {
  const { currentUser, logout } = useQAStore();
  const [view, setView] = useState("overview");

  // Filter accessible modules based on active user's permissions
  const visibleNav = React.useMemo(() => {
    if (!currentUser) return NAV;
    return NAV.filter((n) => {
      if (n.key === "overview") return true;
      if (n.key === "users") return hasPermission(currentUser, "users:manage");
      if (n.key === "projects") return hasPermission(currentUser, "projects:manage") || hasPermission(currentUser, "users:manage");
      if (n.key === "defects") return hasPermission(currentUser, "defects:view");
      if (n.key === "reports") return hasPermission(currentUser, "reports:download") || hasPermission(currentUser, "reports:upload");
      if (n.key === "testcases") return hasPermission(currentUser, "testcases:view") || hasPermission(currentUser, "testcases:manage");
      if (n.key === "compatibility") return hasPermission(currentUser, "browsers:access");
      if (n.key === "performance") return hasPermission(currentUser, "performance:access");
      if (n.key === "security") return hasPermission(currentUser, "vapt:access");
      if (n.key === "recyclebin") return currentUser.role !== "Client";
      return true;
    });
  }, [currentUser]);

  // If currently active view is not accessible to this user, redirect to first allowed module
  React.useEffect(() => {
    if (currentUser && !visibleNav.some((n) => n.key === view)) {
      setView(visibleNav[0]?.key || "overview");
    }
  }, [visibleNav, view, currentUser]);

  if (!currentUser) {
    return <AuthScreen />;
  }

  const currentNav = visibleNav.find((n) => n.key === view) || visibleNav[0] || NAV[0];

  return (
    <div
      className="w-full min-h-screen flex"
      style={{
        background: COLORS.bg,
        color: COLORS.ink,
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r shadow-[1px_0_4px_rgba(0,0,0,0.02)]"
        style={{ background: COLORS.panel, borderColor: COLORS.border }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 px-4 py-4.5 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.teal})`,
              color: "#fff",
            }}
          >
            Q
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight" style={{ color: COLORS.ink }}>
              QA Tracker
            </div>
            <div className="text-[11px] font-medium" style={{ color: COLORS.sub }}>
              Menntr Quality Suite
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {visibleNav.map((n) => {
            const Icon = n.icon;
            const active = view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all"
                style={{
                  background: active ? COLORS.accent : "transparent",
                  color: active ? "#ffffff" : COLORS.ink,
                }}
              >
                <Icon size={16} color={active ? "#ffffff" : COLORS.sub} />
                <span className="truncate">{n.label}</span>
                {n.key === "users" && (
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                    style={{
                      background: active ? "rgba(255,255,255,0.2)" : COLORS.accent + "18",
                      color: active ? "#ffffff" : COLORS.accent,
                    }}
                  >
                    New
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current User Card at bottom of sidebar */}
        <div
          className="p-3 m-3 rounded-xl flex items-center gap-2.5 border"
          style={{ background: COLORS.panel2, borderColor: COLORS.border }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-sm"
            style={{ background: COLORS.accent2 }}
          >
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate" style={{ color: COLORS.ink }}>
              {currentUser.name}
            </div>
            <div className="text-[10px] truncate font-medium" style={{ color: COLORS.sub }}>
              {currentUser.role}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
            style={{ color: COLORS.sub }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TopBar */}
        <header
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ borderColor: COLORS.border, background: COLORS.panel }}
        >
          <div>
            <div className="text-lg font-bold tracking-tight" style={{ color: COLORS.ink }}>
              {currentNav.label}
            </div>
            <div className="text-xs font-medium" style={{ color: COLORS.sub }}>
              Menntr Web Application · QA Cycle — July 2026
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border"
              style={{
                borderColor: COLORS.border,
                background: COLORS.panel2,
                color: COLORS.ink,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS.green }} />
              Active Session: <b>{currentUser.role}</b>
            </div>
          </div>
        </header>

        {/* Dynamic Module Content View */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {view === "overview" && <ExecutiveDashboard />}
            {view === "reports" && <Reports />}
            {view === "testcases" && <TestCases onNavigate={setView} />}
            {view === "defects" && <Defects />}
            {view === "compatibility" && <CompatibilityBrowsers />}
            {view === "performance" && <Performance />}
            {view === "security" && <SecurityVAPT />}
            {view === "users" && <UserManagement />}
            {view === "projects" && <ProjectManagement />}
            {view === "recyclebin" && <GlobalRecycleBin onNavigate={setView} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthScreen() {
  const { login, users } = useQAStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4"
      style={{
        background: COLORS.bg,
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        className="w-full max-w-sm p-6 rounded-2xl shadow-xl border"
        style={{ background: COLORS.panel, borderColor: COLORS.border }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.teal})`,
              color: "#fff",
            }}
          >
            Q
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold" style={{ color: COLORS.ink }}>
              QA Tracker
            </div>
            <div className="text-[11px] font-medium" style={{ color: COLORS.sub }}>
              Menntr Quality Suite
            </div>
          </div>
        </div>

        <div className="mb-4 text-center">
          <div className="text-xs font-semibold" style={{ color: COLORS.ink }}>
            Log in to your account
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: COLORS.sub }}>
            Enter your credentials to access the QA Tracker
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail
              size={14}
              color={COLORS.sub}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none border"
              style={{
                background: COLORS.panel2,
                borderColor: COLORS.border,
                color: COLORS.ink,
              }}
            />
          </div>

          <div className="relative">
            <Lock
              size={14}
              color={COLORS.sub}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full pl-9 pr-8 py-2 rounded-lg text-xs outline-none border"
              style={{
                background: COLORS.panel2,
                borderColor: COLORS.border,
                color: COLORS.ink,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 cursor-pointer"
              style={{ color: COLORS.sub }}
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
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

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
            style={{
              background: COLORS.accent,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        {/* Quick Demo Login Switchers */}
        {users.length > 0 && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <div className="text-[10px] uppercase font-semibold tracking-wider mb-2 text-center" style={{ color: COLORS.sub }}>
              Quick Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setEmail(u.email);
                    setPassword("password123");
                    setError("");
                    setBusy(true);
                    try {
                      await login(u.email, "password123");
                    } catch (err: any) {
                      setError(err.message || "Failed to log in as " + u.name);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="py-1.5 px-2 rounded-lg text-left truncate border hover:bg-slate-100 transition-colors"
                  style={{
                    background: COLORS.panel2,
                    borderColor: COLORS.border,
                    color: COLORS.ink,
                  }}
                  title={`Click to log in as ${u.name} (${u.role})`}
                >
                  <div className="font-semibold truncate">{u.name}</div>
                  <div className="text-[9px]" style={{ color: COLORS.sub }}>
                    {u.role}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
