"use client";

import React, { useState } from "react";
import {
  Clock,
  Activity,
  Gauge,
  Plus,
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    <div className="rounded-xl p-4 shadow-2xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: COLORS.sub }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <Icon size={14} color={tone} />
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

export function Performance() {
  const { perfFast, perfSlow, addPerfEndpoint, uploadReport } = useQAStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const allEndpoints = [...perfFast, ...perfSlow];
  const chartData = allEndpoints.map((e) => ({
    name: (e.name || e.ep).replace("/assessments/{id}/", "").replace("/answers/coding/", "coding/"),
    Avg: e.avg,
    p95: e.p95,
  }));

  // Download Performance Report as Excel
  const handleExportExcel = () => {
    if (allEndpoints.length === 0) {
      alert("No performance benchmarks or test data available to export.");
      return;
    }
    const rows = allEndpoints.map((e) => ({
      "Endpoint Route": e.ep,
      "Test Scenario / Name": e.name || "API Route Benchmark",
      "SLA Category": e.category || (e.avg <= 200 ? "Fast (<200ms)" : "Slow/Heavy (>500ms)"),
      "Average Latency (ms)": e.avg,
      "P95 Latency (ms)": e.p95,
      "P99 Latency (ms)": e.p99,
      "Max Latency (ms)": e.max,
      "Error Rate (%)": `${e.err}%`,
      "Simulated Load": e.load || "Standard Benchmark",
      "SLA Status": e.status || (e.err > 0 || e.avg > 600 ? "Degraded" : "Within SLA"),
      "Observations & Notes": e.notes || "-",
      "Recorded Date": e.date || new Date().toISOString().slice(0, 10),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");
    XLSX.writeFile(workbook, `QA_Performance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Download Performance Report as PDF
  const handleExportPDF = () => {
    if (allEndpoints.length === 0) {
      alert("No performance benchmarks or test data available to export.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFillColor(108, 92, 231);
    doc.rect(0, 0, 297, 18, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("QA TRACKER — PERFORMANCE & LATENCY AUDIT REPORT", 14, 12);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} | Fast Routes: ${perfFast.length} | Critical/Slow Routes: ${perfSlow.length} | Total Monitored: ${allEndpoints.length}`,
      14,
      24
    );

    autoTable(doc, {
      startY: 28,
      head: [["Endpoint Route", "Scenario / Name", "Category", "Avg (ms)", "p95 (ms)", "p99 (ms)", "Max (ms)", "Error %", "Status"]],
      body: allEndpoints.map((e) => [
        e.ep,
        e.name || "-",
        e.category || (e.avg <= 200 ? "Fast" : "Slow"),
        `${e.avg} ms`,
        `${e.p95} ms`,
        `${e.p99} ms`,
        `${e.max} ms`,
        `${e.err}%`,
        e.status || (e.err > 0 || e.avg > 600 ? "Degraded" : "Within SLA"),
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [108, 92, 231], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    doc.save(`QA_Performance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Performance and Export Report Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: COLORS.ink }}>
            Performance & Latency Monitoring
          </h2>
          <p className="text-xs" style={{ color: COLORS.sub }}>
            Real-time endpoint benchmarks, SLA response thresholds, and performance test reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
            title="Download Performance Report as Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
            title="Download Performance Report as PDF document (.pdf)"
          >
            <FileText size={13} className="text-rose-600" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
            style={{ background: COLORS.accent }}
            title="Add a new performance test run report / endpoint benchmark"
          >
            <Plus size={14} />
            <span>Add Performance</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Fast Endpoints"
          value={perfFast.length}
          sub="Average response < 120ms"
          icon={Clock}
          tone={COLORS.green}
        />
        <StatCard
          label="Critical / Slow Endpoints"
          value={perfSlow.length}
          sub="Coding worker & save routes > 600ms"
          icon={Gauge}
          tone={COLORS.red}
        />
        <StatCard
          label="Monitored Routes"
          value={allEndpoints.length}
          sub="REST assessment endpoints"
          icon={Activity}
          tone={COLORS.accent}
        />
      </div>

      {/* Latency Benchmarks Bar Chart */}
      <div className="p-5 rounded-xl shadow-xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>
          Latency Benchmarks (Avg vs p95)
        </div>
        <div className="text-xs mb-4" style={{ color: COLORS.sub }}>
          Milliseconds per API route or test scenario
        </div>
        <div style={{ height: 260 }}>
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No performance data logged yet. Click &quot;Add Performance&quot; to add a report.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.sub} fontSize={10} angle={-15} textAnchor="end" />
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
                <Bar dataKey="Avg" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                <Bar dataKey="p95" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fast Endpoints Table */}
      <div className="rounded-xl overflow-hidden shadow-xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
            Fast API Endpoints (&lt; 200ms)
          </div>
          <div className="text-xs" style={{ color: COLORS.sub }}>
            Standard low-latency routes meeting strict SLAs
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Endpoint / Scenario</th>
                <th className="px-4 py-3 font-semibold">Simulated Load</th>
                <th className="px-4 py-3 font-semibold">Avg (ms)</th>
                <th className="px-4 py-3 font-semibold">p95 (ms)</th>
                <th className="px-4 py-3 font-semibold">p99 (ms)</th>
                <th className="px-4 py-3 font-semibold">Error %</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {perfFast.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No fast endpoints recorded yet.
                  </td>
                </tr>
              ) : (
                perfFast.map((p, idx) => (
                  <tr key={`${p.ep}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <div className="font-mono font-medium text-xs" style={{ color: COLORS.ink }}>
                        {p.ep}
                      </div>
                      {p.name && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">{p.name}</div>
                      )}
                      {p.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{p.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-600">
                      {p.load || "Standard Benchmark"}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: COLORS.green }}>
                      {p.avg}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: COLORS.sub }}>
                      {p.p95}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: COLORS.sub }}>
                      {p.p99}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: p.err > 0 ? COLORS.amber : COLORS.green }}>
                      {p.err}%
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          (p.status || "").toLowerCase().includes("fail")
                            ? "bg-red-50 text-red-700"
                            : (p.status || "").toLowerCase().includes("warn")
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        {p.status || "Within SLA"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow Endpoints Table */}
      <div className="rounded-xl overflow-hidden shadow-xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
            Slow & Heavy Endpoints (&gt; 500ms)
          </div>
          <div className="text-xs" style={{ color: COLORS.sub }}>
            Live coding evaluation workers, heavy report generators, and routes requiring optimization
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Endpoint / Scenario</th>
                <th className="px-4 py-3 font-semibold">Simulated Load</th>
                <th className="px-4 py-3 font-semibold">Avg (ms)</th>
                <th className="px-4 py-3 font-semibold">p95 (ms)</th>
                <th className="px-4 py-3 font-semibold">p99 (ms)</th>
                <th className="px-4 py-3 font-semibold">Max (ms)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {perfSlow.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No slow or heavy endpoints recorded.
                  </td>
                </tr>
              ) : (
                perfSlow.map((p, idx) => (
                  <tr key={`${p.ep}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <div className="font-mono font-medium text-xs" style={{ color: COLORS.ink }}>
                        {p.ep}
                      </div>
                      {p.name && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">{p.name}</div>
                      )}
                      {p.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{p.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-600">
                      {p.load || "Heavy Load / Spike"}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: COLORS.red }}>
                      {p.avg}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: COLORS.red }}>
                      {p.p95}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: COLORS.red }}>
                      {p.p99}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: COLORS.red }}>
                      {p.max}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          (p.status || "").toLowerCase().includes("fail")
                            ? "bg-red-50 text-red-700"
                            : (p.status || "").toLowerCase().includes("within")
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <AlertTriangle size={11} />
                        {p.status || "Degraded"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Performance Report Modal */}
      {showAddModal && (
        <AddPerformanceModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await addPerfEndpoint(data);
            if (uploadReport) {
              const label = data.name || data.ep;
              const safeKey = label.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
              await uploadReport(
                "performance",
                `Performance_Report_${safeKey}.pdf`,
                "PDF",
                `Recorded ${data.category || "Performance"} test for ${data.ep} (Avg: ${data.avg}ms, P95: ${data.p95}ms, Error: ${data.err}%). ${data.notes || ""}`
              );
            }
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddPerformanceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: PerfEndpoint) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [ep, setEp] = useState("");
  const [category, setCategory] = useState<"Fast" | "Slow">("Fast");
  const [load, setLoad] = useState("500 Concurrent Users");
  const [status, setStatus] = useState("Within SLA");
  const [avg, setAvg] = useState("85");
  const [p95, setP95] = useState("140");
  const [p99, setP99] = useState("210");
  const [max, setMax] = useState("320");
  const [err, setErr] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ep.trim()) {
      setErrorMsg("Please enter an endpoint path or route.");
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
        name: name.trim() || undefined,
        ep: ep.trim().startsWith("/") ? ep.trim() : `/${ep.trim()}`,
        avg: avgNum,
        p95: p95Num,
        p99: p99Num,
        max: maxNum,
        err: errNum,
        category,
        load: load.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add performance report");
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
        className="w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2">
            <Gauge size={19} color={COLORS.accent} />
            <div>
              <span className="text-sm font-bold block" style={{ color: COLORS.ink }}>
                Add Performance Report
              </span>
              <span className="text-[11px]" style={{ color: COLORS.sub }}>
                Record latency benchmarks, simulated load, and SLA performance results
              </span>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-slate-100 cursor-pointer">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Test Scenario / Name */}
          <div>
            <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
              Test Scenario / Report Title
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Assessment Submission Load Test"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          {/* Endpoint Route */}
          <div>
            <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
              Endpoint Route / API Path *
            </label>
            <input
              required
              value={ep}
              onChange={(e) => setEp(e.target.value)}
              placeholder="e.g. /api/assessments/submit"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          {/* SLA Profile & Simulated Load */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                SLA Profile Category *
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
                    setStatus("Within SLA");
                  } else {
                    setAvg("620");
                    setP95("980");
                    setP99("1450");
                    setMax("2100");
                    setStatus("Degraded");
                  }
                }}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                <option value="Fast">Fast API Endpoint (&lt; 200ms SLA)</option>
                <option value="Slow">Slow & Heavy Processing (&gt; 500ms SLA)</option>
              </select>
            </div>

            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Simulated Load (Concurrency)
              </label>
              <select
                value={load}
                onChange={(e) => setLoad(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                <option value="100 Concurrent Users">100 Concurrent Users</option>
                <option value="250 Concurrent Users">250 Concurrent Users</option>
                <option value="500 Concurrent Users">500 Concurrent Users</option>
                <option value="1000 Concurrent Users">1,000 Concurrent Users</option>
                <option value="Stress Spike (2,500 Users)">Stress Spike (2,500 Users)</option>
                <option value="Single User Baseline">Single User Baseline</option>
              </select>
            </div>
          </div>

          {/* SLA Status Outcome */}
          <div>
            <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
              SLA Compliance Outcome
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "Within SLA", label: "Within SLA", tone: COLORS.green },
                { val: "Degraded", label: "Degraded", tone: COLORS.amber },
                { val: "Failed / Breached", label: "Breached", tone: COLORS.red },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setStatus(opt.val)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === opt.val ? "shadow-xs" : "opacity-70"
                  }`}
                  style={{
                    background: status === opt.val ? opt.tone + "15" : COLORS.panel2,
                    borderColor: status === opt.val ? opt.tone : COLORS.border,
                    color: status === opt.val ? opt.tone : COLORS.sub,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Average Latency & P95 Latency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
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
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
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

          {/* P99, Max, and Error Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.sub }}>
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
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.sub }}>
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
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.sub }}>
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

          {/* Observations and Notes */}
          <div>
            <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
              Report Summary & Observations
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Under 500 virtual users, response time stayed stable within SLA. Database memory overhead was nominal."
              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          {errorMsg && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: COLORS.red + "14", border: `1px solid ${COLORS.red}44`, color: COLORS.red }}
            >
              {errorMsg}
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
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
              style={{ background: COLORS.accent, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Saving Report…" : "Save Performance Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Performance;
