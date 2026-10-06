"use client";

import React, { useMemo } from "react";
import { ListChecks, Bug, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { useQAStore } from "@/lib/store";

const COLORS = {
  bg: "#F4F6F9", panel: "#FFFFFF", panel2: "#F1F4F8", border: "#E2E6ED",
  ink: "#1A2233", sub: "#6B7480", accent: "#6C5CE7", accent2: "#4F46E5",
  teal: "#0D9488", green: "#16A34A", red: "#DC2626", amber: "#D97706", sky: "#0284C7",
};

const SEV_COLOR: Record<string, string> = {
  Critical: "#991B1B", Major: COLORS.red, Medium: COLORS.amber, Minor: COLORS.sky,
  High: COLORS.red, Low: COLORS.sky,
};

function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: React.ReactNode; sub: string; icon: React.ComponentType<{ size?: number; color?: string }>; tone: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: COLORS.sub }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <Icon size={14} color={tone} />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: COLORS.ink }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: COLORS.sub }}>{sub}</div>
    </div>
  );
}

export function ExecutiveDashboard() {
  const { portals, defects, vapt } = useQAStore();

  const totalTC = useMemo(() => portals.reduce((a, p) => a + p.total, 0), [portals]);
  const openDefects = defects.filter((d) => d.status === "Open").length;
  const closedDefects = defects.filter((d) => d.status === "Closed").length;
  const highDefects = defects.filter((d) => d.severity === "High" || d.severity === "Critical" || d.severity === "Major").length;

  const sevData = ["High", "Medium", "Low"].map((s) => ({
    name: s,
    value: defects.filter((d) => d.severity === s).length,
  }));

  const moduleSeverityData = useMemo(() => {
    const map: Record<string, any> = {};
    defects.forEach((d) => {
      if (!map[d.module]) map[d.module] = { module: d.module, High: 0, Medium: 0, Low: 0, total: 0 };
      map[d.module][d.severity] = (map[d.module][d.severity] || 0) + 1;
      map[d.module].total += 1;
    });
    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  }, [defects]);

  const tcByPortal = portals.map((p) => ({
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Test Cases Logged" value={totalTC.toLocaleString()} sub={`Across ${portals.length} portal${portals.length === 1 ? "" : "s"}`} icon={ListChecks} tone={COLORS.accent} />
        <StatCard label="Total Defects" value={defects.length} sub={`${moduleSeverityData.length} modules affected`} icon={Bug} tone={COLORS.accent2} />
        <StatCard label="Open Defects" value={openDefects} sub={`${highDefects} high severity`} icon={AlertTriangle} tone={COLORS.red} />
        <StatCard label="Closed Defects" value={closedDefects} sub={`${((closedDefects / (defects.length || 1)) * 100).toFixed(0)}% resolution rate`} icon={CheckCircle2} tone={COLORS.green} />
        <StatCard label="Security Findings" value={vaptOpenCount} sub={vaptOpenBySeverity} icon={ShieldAlert} tone={COLORS.amber} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Test Cases by Portal</div>
              <div className="text-xs" style={{ color: COLORS.sub }}>Functional, regression and smoke breakdown</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcByPortal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.sub} fontSize={11} tickLine={false} />
                <YAxis stroke={COLORS.sub} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Smoke" fill={COLORS.sky} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Functional" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Regression" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl flex flex-col" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <div className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>Defects by Severity</div>
          <div className="text-xs mb-4" style={{ color: COLORS.sub }}>Overall distribution across all portals</div>
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sevData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {sevData.map((entry) => (
                    <Cell key={entry.name} fill={SEV_COLOR[entry.name] || COLORS.sub} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {sevData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_COLOR[s.name] }} />
                <span style={{ color: COLORS.sub }}>{s.name}:</span>
                <span className="font-semibold" style={{ color: COLORS.ink }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Defect Distribution by Module</div>
            <div className="text-xs" style={{ color: COLORS.sub }}>Sorted by defect volume</div>
          </div>
        </div>
        <div className="space-y-2.5">
          {moduleSeverityData.map((m) => (
            <div key={m.module} className="flex items-center gap-3 text-xs">
              <div className="w-36 truncate font-medium" style={{ color: COLORS.ink }}>{m.module}</div>
              <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: COLORS.panel2 }}>
                {m.High > 0 && <div style={{ width: `${(m.High / m.total) * 100}%`, background: COLORS.red }} title={`High: ${m.High}`} />}
                {m.Medium > 0 && <div style={{ width: `${(m.Medium / m.total) * 100}%`, background: COLORS.amber }} title={`Medium: ${m.Medium}`} />}
                {m.Low > 0 && <div style={{ width: `${(m.Low / m.total) * 100}%`, background: COLORS.sky }} title={`Low: ${m.Low}`} />}
              </div>
              <div className="w-8 text-right font-semibold" style={{ color: COLORS.ink }}>{m.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
