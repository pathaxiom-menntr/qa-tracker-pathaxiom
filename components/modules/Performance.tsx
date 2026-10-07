"use client";

import React, { useState } from "react";
import { Clock, Activity, Gauge, Plus, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useQAStore } from "@/lib/store";
import { PerfEndpoint } from "@/lib/types";

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
  const { perfFast, perfSlow, addPerfEndpoint } = useQAStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const allEndpoints = [...perfFast, ...perfSlow];
  const chartData = allEndpoints.map((e) => ({
    name: e.ep.replace("/assessments/{id}/", "").replace("/answers/coding/", "coding/"),
    Avg: e.avg,
    p95: e.p95,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: COLORS.ink }}>Performance & Latency Monitoring</h2>
          <p className="text-xs" style={{ color: COLORS.sub }}>Real-time endpoint benchmarks, SLA response thresholds, and latency metrics</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
          style={{ background: COLORS.accent }}
        >
          <Plus size={14} />
          Add Endpoint
        </button>
      </div>
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

      {/* Add Endpoint Modal */}
      {showAddModal && (
        <AddEndpointModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await addPerfEndpoint(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddEndpointModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: PerfEndpoint) => Promise<void>;
}) {
  const [ep, setEp] = useState("");
  const [category, setCategory] = useState<"Fast" | "Slow">("Fast");
  const [avg, setAvg] = useState("85");
  const [p95, setP95] = useState("140");
  const [p99, setP99] = useState("210");
  const [max, setMax] = useState("320");
  const [err, setErr] = useState("0");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ep.trim()) {
      setErrorMsg("Please enter an endpoint path.");
      return;
    }

    const avgNum = parseFloat(avg) || 0;
    const p95Num = parseFloat(p95) || 0;
    const p99Num = parseFloat(p99) || 0;
    const maxNum = parseFloat(max) || 0;
    const errNum = parseFloat(err) || 0;

    setBusy(true);
    try {
      await onAdd({
        ep: ep.trim().startsWith("/") ? ep.trim() : `/${ep.trim()}`,
        avg: avgNum,
        p95: p95Num,
        p99: p99Num,
        max: maxNum,
        err: errNum,
        category,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add endpoint");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl p-5 shadow-2xl"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge size={17} color={COLORS.accent} />
            <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
              Add Performance Endpoint Benchmark
            </span>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-slate-100">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
              Endpoint Path *
            </label>
            <input
              required
              value={ep}
              onChange={(e) => setEp(e.target.value)}
              placeholder="e.g. /api/reports/download"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
              Profile Category *
            </label>
            <select
              value={category}
              onChange={(e) => {
                const val = e.target.value as "Fast" | "Slow";
                setCategory(val);
                if (val === "Fast") {
                  setAvg("85");
                  setP95("140");
                  setP99("210");
                  setMax("320");
                } else {
                  setAvg("620");
                  setP95("980");
                  setP99("1450");
                  setMax("2100");
                }
              }}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              <option value="Fast">Fast API Endpoint (&lt; 200ms)</option>
              <option value="Slow">Slow & Heavy Endpoint (&gt; 500ms)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
                Average Latency (ms) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={avg}
                onChange={(e) => setAvg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
                P95 Latency (ms) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={p95}
                onChange={(e) => setP95(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
                P99 (ms)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={p99}
                onChange={(e) => setP99(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
                Max (ms)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
                Error %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                value={err}
                onChange={(e) => setErr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
          </div>

          {errorMsg && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: COLORS.red + "14", border: `1px solid ${COLORS.red}44`, color: COLORS.red }}
            >
              {errorMsg}
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
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm"
              style={{ background: COLORS.accent, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Adding…" : "Add Endpoint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Performance;
