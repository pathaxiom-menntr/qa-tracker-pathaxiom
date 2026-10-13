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
  LogOut,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";

// The 7 Original QA Modules + 1 New User Management Module
import { ExecutiveDashboard } from "@/components/modules/ExecutiveDashboard";
import { Reports } from "@/components/modules/Reports";
import { TestCases } from "@/components/modules/TestCases";
import { Defects } from "@/components/modules/Defects";
import { CompatibilityBrowsers } from "@/components/modules/CompatibilityBrowsers";
import { Performance } from "@/components/modules/Performance";
import { SecurityVAPT } from "@/components/modules/SecurityVAPT";
import { UserManagement } from "@/components/modules/UserManagement";

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
];

export default function Home() {
  const { currentUser, logout } = useQAStore();
  const [view, setView] = useState("overview");

  if (!currentUser) {
    return <AuthScreen />;
  }

  // Filter accessible modules based on active user's permissions
  const visibleNav = React.useMemo(() => {
    return NAV.filter((n) => {
      if (n.key === "overview") return true;
      if (n.key === "users") return hasPermission(currentUser, "users:manage");
      if (n.key === "defects") return hasPermission(currentUser, "defects:view");
      if (n.key === "reports") return hasPermission(currentUser, "reports:download") || hasPermission(currentUser, "reports:upload");
      if (n.key === "testcases") return hasPermission(currentUser, "testcases:view") || hasPermission(currentUser, "testcases:manage");
      if (n.key === "compatibility") return hasPermission(currentUser, "browsers:access");
      if (n.key === "performance") return hasPermission(currentUser, "performance:access");
      if (n.key === "security") return hasPermission(currentUser, "vapt:access");
      return true;
    });
  }, [currentUser]);

  // If currently active view is not accessible to this user, redirect to first allowed module
  React.useEffect(() => {
    if (!visibleNav.some((n) => n.key === view)) {
      setView(visibleNav[0]?.key || "overview");
    }
  }, [visibleNav, view]);

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
            {view === "testcases" && <TestCases />}
            {view === "defects" && <Defects />}
            {view === "compatibility" && <CompatibilityBrowsers />}
            {view === "performance" && <Performance />}
            {view === "security" && <SecurityVAPT />}
            {view === "users" && <UserManagement />}
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthScreen() {
  const { login, register, users } = useQAStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasSuperAdmin = users.some((u) => u.role === "Super Admin");

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
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        if (hasSuperAdmin) {
          setError("A Super Admin already exists. Only one predefined Super Admin is permitted for QA Tracker.");
          setBusy(false);
          return;
        }
        if (!name.trim()) {
          setError("Full name is required.");
          setBusy(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setBusy(false);
          return;
        }
        // Direct sign-up is strictly locked to Super Admin
        await register(name.trim(), email.trim(), "Super Admin", password);
      }
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

        {/* Tab switch or Single Super Admin Login Header */}
        {!hasSuperAdmin ? (
          <div
            className="flex mb-4 rounded-lg overflow-hidden border p-0.5"
            style={{ borderColor: COLORS.border, background: COLORS.panel2 }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all"
              style={{
                background: mode === "login" ? COLORS.accent : "transparent",
                color: mode === "login" ? "#fff" : COLORS.sub,
              }}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all"
              style={{
                background: mode === "register" ? COLORS.accent : "transparent",
                color: mode === "register" ? "#fff" : COLORS.sub,
              }}
            >
              Setup Super Admin
            </button>
          </div>
        ) : (
          <div className="mb-4 text-center">
            <div className="text-xs font-semibold" style={{ color: COLORS.ink }}>
              Log in to your account
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: COLORS.sub }}>
              Enter your credentials to access the QA Tracker
            </div>
          </div>
        )}

        {/* Super Admin Notice Banner in Sign Up Mode */}
        {mode === "register" ? (
          <div
            className="p-3 rounded-xl border flex items-start gap-2.5 text-xs mb-4"
            style={{ background: COLORS.accent + "10", borderColor: COLORS.accent + "30" }}
          >
            <Shield size={16} color={COLORS.accent} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <div className="font-semibold" style={{ color: COLORS.accent }}>
                Super Admin Only
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: COLORS.sub }}>
                Direct sign up is restricted exclusively to <b>Super Admin</b>. All other users (Admin, QA Team, Client) must be created by their administrators in <b>User Management</b>.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] mb-4 text-center" style={{ color: COLORS.sub }}>
            Log in using your assigned credentials.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <UserIcon
                size={14}
                color={COLORS.sub}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none border"
                style={{
                  background: COLORS.panel2,
                  borderColor: COLORS.border,
                  color: COLORS.ink,
                }}
              />
            </div>
          )}

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
              placeholder={mode === "register" ? "Set password (min 6 chars)" : "Enter password"}
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200"
              style={{ color: COLORS.sub }}
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {/* Locked Role Display in Sign Up */}
          {mode === "register" && (
            <div
              className="px-3 py-2 rounded-lg border flex items-center justify-between text-xs"
              style={{ background: COLORS.panel2, borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-2">
                <Shield size={14} color={COLORS.accent} />
                <span className="font-semibold text-xs" style={{ color: COLORS.ink }}>
                  Assigned Role: Super Admin
                </span>
              </div>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: COLORS.accent + "1E", color: COLORS.accent }}
              >
                Locked
              </span>
            </div>
          )}

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
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{
              background: COLORS.accent,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy
              ? mode === "login"
                ? "Logging in…"
                : "Registering Super Admin…"
              : mode === "login"
              ? "Log in"
              : "Register Super Admin Account"}
          </button>
        </form>

        {/* Quick Demo Login Switchers */}
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
      </div>
    </div>
  );
}
