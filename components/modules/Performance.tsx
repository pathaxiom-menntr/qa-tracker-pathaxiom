"use client";

import React from "react";
import { Clock, Activity, Gauge } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useQAStore } from "@/lib/store";

const COLORS = {
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  teal: "#0D9488",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#D97706",
  sky: "#0284C7",
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

export function Performance() {
  const { perfFast, perfSlow } = useQAStore();

  const allEndpoints = [...perfFast, ...perfSlow];
  const chartData = allEndpoints.map((e) => ({
    name: e.ep.replace("/assessments/{id}/", "").replace("/answers/coding/", "coding/"),
    Avg: e.avg,
    p95: e.p95,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Fast Endpoints" value={perfFast.length} sub="Average response < 120ms" icon={Clock} tone={COLORS.green} />
        <StatCard label="Critical / Slow Endpoints" value={perfSlow.length} sub="Coding worker & save routes > 600ms" icon={Gauge} tone={COLORS.red} />
        <StatCard label="Monitored Routes" value={allEndpoints.length} sub="REST assessment endpoints" icon={Activity} tone={COLORS.accent} />
      </div>

      <div className="p-5 rounded-xl" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>Latency Benchmarks (Avg vs p95)</div>
        <div className="text-xs mb-4" style={{ color: COLORS.sub }}>Milliseconds per API route</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="name" stroke={COLORS.sub} fontSize={10} angle={-15} textAnchor="end" />
              <YAxis stroke={COLORS.sub} fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="Avg" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
              <Bar dataKey="p95" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fast Endpoints Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Fast API Endpoints (&lt; 200ms)</div>
          <div className="text-xs" style={{ color: COLORS.sub }}>Standard low-latency routes</div>
        </div>
        <table className="w-full text-left text-xs">
          <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
            <tr>
              <th className="px-4 py-3 font-semibold">Endpoint</th>
              <th className="px-4 py-3 font-semibold">Avg (ms)</th>
              <th className="px-4 py-3 font-semibold">p95 (ms)</th>
              <th className="px-4 py-3 font-semibold">p99 (ms)</th>
              <th className="px-4 py-3 font-semibold">Error %</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
            {perfFast.map((p) => (
              <tr key={p.ep} className="hover:bg-slate-50 font-mono">
                <td className="px-4 py-3 font-sans font-medium" style={{ color: COLORS.ink }}>{p.ep}</td>
                <td className="px-4 py-3" style={{ color: COLORS.green }}>{p.avg}</td>
                <td className="px-4 py-3" style={{ color: COLORS.sub }}>{p.p95}</td>
                <td className="px-4 py-3" style={{ color: COLORS.sub }}>{p.p99}</td>
                <td className="px-4 py-3" style={{ color: p.err > 0 ? COLORS.amber : COLORS.green }}>{p.err}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slow Endpoints Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Slow & Heavy Endpoints (&gt; 500ms)</div>
          <div className="text-xs" style={{ color: COLORS.sub }}>Live coding evaluation workers requiring optimization</div>
        </div>
        <table className="w-full text-left text-xs">
          <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
            <tr>
              <th className="px-4 py-3 font-semibold">Endpoint</th>
              <th className="px-4 py-3 font-semibold">Avg (ms)</th>
              <th className="px-4 py-3 font-semibold">p95 (ms)</th>
              <th className="px-4 py-3 font-semibold">p99 (ms)</th>
              <th className="px-4 py-3 font-semibold">Max (ms)</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
            {perfSlow.map((p) => (
              <tr key={p.ep} className="hover:bg-slate-50 font-mono">
                <td className="px-4 py-3 font-sans font-medium" style={{ color: COLORS.ink }}>{p.ep}</td>
                <td className="px-4 py-3" style={{ color: COLORS.red }}>{p.avg}</td>
                <td className="px-4 py-3" style={{ color: COLORS.red }}>{p.p95}</td>
                <td className="px-4 py-3" style={{ color: COLORS.red }}>{p.p99}</td>
                <td className="px-4 py-3" style={{ color: COLORS.red }}>{p.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
