"use client";

import React, { useState, useMemo } from "react";
import {
  ListChecks,
  Bug,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Building2,
  FolderGit2,
  Calendar,
  RotateCcw,
  TrendingUp,
  Activity,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useQAStore } from "@/lib/store";

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

const SEV_COLOR: Record<string, string> = {
  Critical: "#991B1B",
  Major: COLORS.red,
  High: COLORS.red,
  Medium: COLORS.amber,
  Minor: COLORS.sky,
  Low: COLORS.sky,
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  badge,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tone: string;
  badge?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 shadow-xs relative overflow-hidden transition-all hover:shadow-sm"
      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: COLORS.sub }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <Icon size={14} color={tone} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
          {value}
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs mt-1" style={{ color: COLORS.sub }}>
        {sub}
      </div>
    </div>
  );
}

export function ExecutiveDashboard() {
  const { portals, defects, vapt, projects, currentUser } = useQAStore();

  const isClient = currentUser?.role === "Client";
  const clientOrg = currentUser?.client_name || "PathAxiom";

  // Dashboard Filter State
  const [selectedClient, setSelectedClient] = useState<string>(isClient ? clientOrg : "All");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Unique clients available
  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.client_name && set.add(p.client_name));
    defects.forEach((d) => d.client_name && set.add(d.client_name));
    return Array.from(set);
  }, [projects, defects]);

  // Projects available based on client filter
  const availableProjects = useMemo(() => {
    if (isClient) {
      return projects.filter((p) => p.client_name.toLowerCase() === clientOrg.toLowerCase());
    }
    if (selectedClient === "All") return projects;
    return projects.filter((p) => p.client_name.toLowerCase() === selectedClient.toLowerCase());
  }, [projects, isClient, clientOrg, selectedClient]);

  // Dynamically Filtered Defects based on Client, Project, and Date
  const filteredDefects = useMemo(() => {
    return defects.filter((d) => {
      // Client Filter
      if (isClient) {
        if ((d.client_name || "PathAxiom").toLowerCase() !== clientOrg.toLowerCase()) return false;
      } else if (selectedClient !== "All") {
        if ((d.client_name || "PathAxiom").toLowerCase() !== selectedClient.toLowerCase()) return false;
      }

      // Project Filter
      if (selectedProject !== "All") {
        const matchesProj = d.project_code === selectedProject || d.project_name === selectedProject;
        if (!matchesProj) return false;
      }

      // Date Filter
      if (dateFilter !== "all") {
        if (!d.created_at) return true;
        const dDate = new Date(d.created_at);
        if (isNaN(dDate.getTime())) return true;

        const now = new Date();
        if (dateFilter === "today") {
          if (
            dDate.getFullYear() !== now.getFullYear() ||
            dDate.getMonth() !== now.getMonth() ||
            dDate.getDate() !== now.getDate()
          ) return false;
        } else if (dateFilter === "last7") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (dDate < sevenDaysAgo) return false;
        } else if (dateFilter === "last30") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (dDate < thirtyDaysAgo) return false;
        } else if (dateFilter === "this_month") {
          if (dDate.getFullYear() !== now.getFullYear() || dDate.getMonth() !== now.getMonth()) return false;
        } else if (dateFilter === "custom") {
          if (customStart) {
            const start = new Date(customStart + "T00:00:00");
            if (dDate < start) return false;
          }
          if (customEnd) {
            const end = new Date(customEnd + "T23:59:59");
            if (dDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [defects, isClient, clientOrg, selectedClient, selectedProject, dateFilter, customStart, customEnd]);

  // Dynamically Filtered Portals (Test Cases)
  const filteredPortals = useMemo(() => {
    if (selectedProject === "All") return portals;
    return portals.filter(
      (p) =>
        p.name.toLowerCase().includes(selectedProject.toLowerCase()) ||
        selectedProject.toLowerCase().includes(p.name.toLowerCase())
    );
  }, [portals, selectedProject]);

  const displayPortals = filteredPortals.length > 0 ? filteredPortals : portals;

  // Dynamic KPI Counts
  const totalTC = useMemo(() => displayPortals.reduce((a, p) => a + p.total, 0), [displayPortals]);
  const totalDefectsCount = filteredDefects.length;
  const openDefects = filteredDefects.filter((d) => d.status === "Open" || d.status === "In Progress" || d.status === "Reopened").length;
  const closedDefects = filteredDefects.filter((d) => d.status === "Closed").length;
  const highDefects = filteredDefects.filter(
    (d) => d.severity === "High" || d.severity === "Critical" || d.severity === "Major"
  ).length;
  const resolutionRate = totalDefectsCount > 0 ? Math.round((closedDefects / totalDefectsCount) * 100) : 100;

  // Dynamic Severity Data for Pie Chart
  const sevData = useMemo(() => {
    const severities = ["Critical", "Major", "Medium", "Minor"];
    return severities.map((s) => ({
      name: s,
      value: filteredDefects.filter((d) => d.severity === s || (s === "Major" && d.severity === "High") || (s === "Minor" && d.severity === "Low")).length,
    })).filter((entry) => entry.value > 0);
  }, [filteredDefects]);

  // Dynamic Module Severity Data
  const moduleSeverityData = useMemo(() => {
    const map: Record<string, any> = {};
    filteredDefects.forEach((d) => {
      const mod = d.module || "General";
      if (!map[mod]) map[mod] = { module: mod, Critical: 0, Major: 0, Medium: 0, Minor: 0, total: 0 };
      const sevKey = d.severity === "High" ? "Major" : d.severity === "Low" ? "Minor" : d.severity;
      map[mod][sevKey] = (map[mod][sevKey] || 0) + 1;
      map[mod].total += 1;
    });
    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  }, [filteredDefects]);

  // Dynamic Trend Over Time (Defects Logged by Date)
  const defectTrendData = useMemo(() => {
    const dateMap: Record<string, { date: string; open: number; closed: number; total: number }> = {};

    filteredDefects.forEach((d) => {
      const rawDate = d.created_at ? new Date(d.created_at) : new Date();
      const dateKey = !isNaN(rawDate.getTime())
        ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Recent";

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, open: 0, closed: 0, total: 0 };
      }
      dateMap[dateKey].total += 1;
      if (d.status === "Closed") {
        dateMap[dateKey].closed += 1;
      } else {
        dateMap[dateKey].open += 1;
      }
    });

    const entries = Object.values(dateMap);
    if (entries.length === 0) {
      return [{ date: "Current", open: 0, closed: 0, total: 0 }];
    }
    return entries;
  }, [filteredDefects]);

  const tcByPortal = displayPortals.map((p) => ({
    name: p.name.replace(" Portal", ""),
    Smoke: p.smoke,
    Functional: p.functional,
    Regression: p.regression,
  }));

  const vaptOpenCount = vapt.filter((v) => v.status === "Open" || v.status === "Reopened").length;
  const vaptOpenBySeverity = ["Critical", "Major", "Medium", "Minor"]
    .map((s) => `${vapt.filter((v) => (v.status === "Open" || v.status === "Reopened") && v.severity === s).length} ${s}`)
    .filter((s) => !s.startsWith("0 "))
    .join(" · ") || "None open";

  const handleResetFilters = () => {
    setSelectedClient(isClient ? clientOrg : "All");
    setSelectedProject("All");
    setDateFilter("all");
    setCustomStart("");
    setCustomEnd("");
  };

  return (
    <div className="space-y-5">
      {/* Dynamic Dashboard Filter Bar */}
      <div
        className="p-4 sm:p-5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Scope Label with Modern Badge Style */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 font-bold text-xs shrink-0 shadow-2xs">
            <Activity size={15} className="text-indigo-600 shrink-0" />
            <span>Dashboard Scope</span>
          </div>

          {/* Client Filter */}
          <div className="relative group">
            <Building2
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                selectedClient !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedProject("All");
              }}
              disabled={isClient}
              className={`appearance-none pl-9 pr-9 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs max-w-[190px] truncate ${
                selectedClient !== "All"
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
              } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
              title={isClient ? "Locked to your organization" : "Filter Dashboard by Client"}
            >
              {!isClient && <option value="All">All Clients</option>}
              {clientOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                selectedClient !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </div>

          {/* Project Filter */}
          <div className="relative group">
            <FolderGit2
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                selectedProject !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={`appearance-none pl-9 pr-9 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs max-w-[230px] truncate ${
                selectedProject !== "All"
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
              } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
              title="Filter Dashboard by Project"
            >
              <option value="All">All Projects</option>
              {availableProjects.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                selectedProject !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </div>

          {/* Date Filter */}
          <div className="relative group">
            <Calendar
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                dateFilter !== "all" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`appearance-none pl-9 pr-9 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                dateFilter !== "all"
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
              } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
              title="Filter Dashboard by Date Range"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range...</option>
            </select>
            <ChevronDown
              size={13}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                dateFilter !== "all" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </div>

          {/* Custom Date Range Picker */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 bg-indigo-50/50 p-1.5 px-3 rounded-xl border border-indigo-200 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-600 font-semibold">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none font-medium focus:border-indigo-500 shadow-2xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-600 font-semibold">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none font-medium focus:border-indigo-500 shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        {(selectedProject !== "All" || (selectedClient !== "All" && !isClient) || dateFilter !== "all") && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs shrink-0"
            title="Reset to default view"
          >
            <RotateCcw size={12} className="text-slate-400" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Dynamic KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Test Cases Logged"
          value={totalTC.toLocaleString()}
          sub={`Across ${displayPortals.length} portal${displayPortals.length === 1 ? "" : "s"}`}
          icon={ListChecks}
          tone={COLORS.accent}
        />
        <StatCard
          label="Total Defects"
          value={totalDefectsCount}
          sub={`${moduleSeverityData.length} module${moduleSeverityData.length === 1 ? "" : "s"} affected`}
          icon={Bug}
          tone={COLORS.accent2}
          badge={`${totalDefectsCount} filtered`}
        />
        <StatCard
          label="Open Defects"
          value={openDefects}
          sub={`${highDefects} critical/major`}
          icon={AlertTriangle}
          tone={COLORS.red}
        />
        <StatCard
          label="Closed Defects"
          value={closedDefects}
          sub={`${resolutionRate}% resolution rate`}
          icon={CheckCircle2}
          tone={COLORS.green}
          badge={`${resolutionRate}% resolved`}
        />
        <StatCard
          label="Security Findings"
          value={vaptOpenCount}
          sub={vaptOpenBySeverity}
          icon={ShieldAlert}
          tone={COLORS.amber}
        />
      </div>

      {/* Dynamic KPI Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dynamic Defect Velocity & Trend Over Time (KPI Graph) */}
        <div
          className="lg:col-span-2 p-5 rounded-xl shadow-xs"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-600" />
                <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                  Defect Velocity & Trend (KPI Graph)
                </span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.sub }}>
                Daily bug reporting & resolution velocity based on active filters
              </div>
            </div>
            <div className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700">
              {filteredDefects.length} Bugs in Scope
            </div>
          </div>

          <div style={{ height: 260 }}>
            {defectTrendData.length === 0 || filteredDefects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No defect data recorded for the selected filter range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={defectTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="date" stroke={COLORS.sub} fontSize={11} tickLine={false} />
                  <YAxis stroke={COLORS.sub} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: COLORS.panel,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Logged"
                    stroke={COLORS.accent}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="closed"
                    name="Resolved"
                    stroke={COLORS.green}
                    fillOpacity={1}
                    fill="url(#colorClosed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Col: Dynamic Defects by Severity (PieChart) */}
        <div
          className="p-5 rounded-xl shadow-xs flex flex-col"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          <div className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>
            Defects by Severity
          </div>
          <div className="text-xs mb-3" style={{ color: COLORS.sub }}>
            Dynamic distribution for selected filters
          </div>

          <div className="flex-1 flex items-center justify-center" style={{ minHeight: 190 }}>
            {sevData.length === 0 ? (
              <div className="text-xs text-slate-400">No defects in current scope</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={sevData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sevData.map((entry) => (
                      <Cell key={entry.name} fill={SEV_COLOR[entry.name] || COLORS.sub} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: COLORS.panel,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div
            className="flex flex-wrap justify-center gap-3 text-xs pt-2 mt-auto"
            style={{ borderTop: `1px solid ${COLORS.border}` }}
          >
            {["Critical", "Major", "Medium", "Minor"].map((s) => {
              const count = filteredDefects.filter(
                (d) =>
                  d.severity === s ||
                  (s === "Major" && d.severity === "High") ||
                  (s === "Minor" && d.severity === "Low")
              ).length;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_COLOR[s] || COLORS.sub }} />
                  <span style={{ color: COLORS.sub }}>{s}:</span>
                  <span className="font-semibold" style={{ color: COLORS.ink }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Module Breakdown and Test Cases by Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Distribution by Module */}
        <div
          className="p-5 rounded-xl shadow-xs"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Defect Distribution by Module
              </div>
              <div className="text-xs" style={{ color: COLORS.sub }}>
                Filtered defect volume by module & category
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {moduleSeverityData.length} active modules
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {moduleSeverityData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No defect modules found in scope</div>
            ) : (
              moduleSeverityData.map((m) => (
                <div key={m.module} className="flex items-center gap-3 text-xs">
                  <div className="w-36 truncate font-medium" style={{ color: COLORS.ink }} title={m.module}>
                    {m.module}
                  </div>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: COLORS.panel2 }}>
                    {m.Critical > 0 && (
                      <div
                        style={{ width: `${(m.Critical / m.total) * 100}%`, background: SEV_COLOR.Critical }}
                        title={`Critical: ${m.Critical}`}
                      />
                    )}
                    {m.Major > 0 && (
                      <div
                        style={{ width: `${(m.Major / m.total) * 100}%`, background: COLORS.red }}
                        title={`Major: ${m.Major}`}
                      />
                    )}
                    {m.Medium > 0 && (
                      <div
                        style={{ width: `${(m.Medium / m.total) * 100}%`, background: COLORS.amber }}
                        title={`Medium: ${m.Medium}`}
                      />
                    )}
                    {m.Minor > 0 && (
                      <div
                        style={{ width: `${(m.Minor / m.total) * 100}%`, background: COLORS.sky }}
                        title={`Minor: ${m.Minor}`}
                      />
                    )}
                  </div>
                  <div className="w-8 text-right font-semibold" style={{ color: COLORS.ink }}>
                    {m.total}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Cases by Portal */}
        <div
          className="p-5 rounded-xl shadow-xs"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Test Cases by Portal
              </div>
              <div className="text-xs" style={{ color: COLORS.sub }}>
                Functional, regression and smoke breakdown
              </div>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcByPortal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.sub} fontSize={11} tickLine={false} />
                <YAxis stroke={COLORS.sub} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Smoke" fill={COLORS.sky} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Functional" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Regression" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
