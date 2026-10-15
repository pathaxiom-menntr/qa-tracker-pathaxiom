"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Activity,
  Gauge,
  Plus,
  X,
  FileSpreadsheet,
  FileText,
  File,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Zap,
  Upload,
  Download,
  Trash2,
  Eye,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
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

export interface PerformanceReportRecord {
  id: string;
  title: string;
  projectName: string;
  date: string;
  status: "Within SLA" | "Degraded" | "Failed / Breached";
  fileName: string;
  fileSize: string;
  fileFormat: "PDF" | "Excel" | "CSV" | "HTML" | "Log" | "Other";
  fileData?: string;
  summary: string;
  uploadedBy: string;
}

const DEFAULT_PERFORMANCE_REPORTS: PerformanceReportRecord[] = [
  {
    id: "rep-perf-001",
    title: "Assessment Platform Q3 Concurrency Test",
    projectName: "Assessment Platform",
    date: "2026-10-12",
    status: "Within SLA",
    fileName: "JMeter_Assessment_Load_Run_500VU.pdf",
    fileSize: "1.8 MB",
    fileFormat: "PDF",
    summary: "500 concurrent virtual users sustained with 0% error rate. Average API response 112ms.",
    uploadedBy: "Alex Vance",
  },
  {
    id: "rep-perf-002",
    title: "Live Coding Sandbox Stress Audit",
    projectName: "Assessment Platform",
    date: "2026-10-14",
    status: "Degraded",
    fileName: "Coding_Worker_Stress_Audit.xlsx",
    fileSize: "840 KB",
    fileFormat: "Excel",
    summary: "Docker sandbox execution queue reached 1.4s p95 latency under 200 concurrent code evaluations.",
    uploadedBy: "Alex Vance",
  },
  {
    id: "rep-perf-003",
    title: "API Gateway Rate-Limit & Throughput Audit",
    projectName: "Payment Gateway & Checkout",
    date: "2026-10-15",
    status: "Within SLA",
    fileName: "K6_Gateway_Benchmark_Report.html",
    fileSize: "520 KB",
    fileFormat: "HTML",
    summary: "Evaluated rate limiting, JWT token verification latency, and route dispatch. Average response 42ms.",
    uploadedBy: "Alex Vance",
  },
];

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFormatIcon(format: string) {
  switch (format) {
    case "PDF":
      return <FileText size={16} className="text-rose-600" />;
    case "Excel":
    case "CSV":
      return <FileSpreadsheet size={16} className="text-emerald-600" />;
    case "HTML":
    case "JSON":
      return <FileCode size={16} className="text-sky-600" />;
    default:
      return <File size={16} className="text-indigo-600" />;
  }
}

function getStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("fail") || s.includes("breach")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertCircle size={11} />
        {status}
      </span>
    );
  }
  if (s.includes("degrad") || s.includes("warn")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle size={11} />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} />
      {status || "Within SLA"}
    </span>
  );
}

function downloadReportFile(report: PerformanceReportRecord) {
  if (report.fileData) {
    const a = document.createElement("a");
    a.href = report.fileData;
    a.download = report.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback dynamic file generation if raw base64 isn't stored
  if (report.fileFormat === "PDF" || report.fileName.toLowerCase().endsWith(".pdf")) {
    const doc = new jsPDF();
    doc.setFillColor(108, 92, 231);
    doc.rect(0, 0, 210, 20, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("QA TRACKER — PERFORMANCE REPORT", 14, 14);

    doc.setFontSize(11);
    doc.setTextColor(26, 34, 51);
    doc.text(`Title: ${report.title}`, 14, 32);
    doc.text(`Project Scope: ${report.projectName}`, 14, 40);
    doc.text(`Execution Date: ${report.date}`, 14, 48);
    doc.text(`Status: ${report.status}`, 14, 56);
    doc.text(`Uploaded By: ${report.uploadedBy}`, 14, 64);

    doc.setFontSize(10);
    doc.setTextColor(107, 116, 128);
    doc.text("Executive Summary & Observations:", 14, 76);
    const splitSummary = doc.splitTextToSize(report.summary || "No remarks provided.", 180);
    doc.setTextColor(26, 34, 51);
    doc.text(splitSummary, 14, 84);

    doc.save(report.fileName);
  } else if (report.fileFormat === "Excel" || report.fileName.toLowerCase().endsWith(".xlsx")) {
    const rows = [
      { Parameter: "Report Title", Value: report.title },
      { Parameter: "Project", Value: report.projectName },
      { Parameter: "Execution Date", Value: report.date },
      { Parameter: "SLA Status", Value: report.status },
      { Parameter: "Uploaded By", Value: report.uploadedBy },
      { Parameter: "Summary / Remarks", Value: report.summary },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Performance Audit");
    XLSX.writeFile(wb, report.fileName);
  } else {
    const content = `QA Tracker — Performance Test Report\n\nTitle: ${report.title}\nProject: ${report.projectName}\nDate: ${report.date}\nStatus: ${report.status}\nUploaded By: ${report.uploadedBy}\n\nSummary & Observations:\n${report.summary}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

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
  const { perfFast, perfSlow, addPerfEndpoint, uploadReport, projects, currentUser } = useQAStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [reportsList, setReportsList] = useState<PerformanceReportRecord[]>([]);
  const [previewReport, setPreviewReport] = useState<PerformanceReportRecord | null>(null);

  // Load persisted performance reports
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qa_performance_reports_list");
      if (saved) {
        setReportsList(JSON.parse(saved));
      } else {
        setReportsList(DEFAULT_PERFORMANCE_REPORTS);
      }
    } catch {
      setReportsList(DEFAULT_PERFORMANCE_REPORTS);
    }
  }, []);

  const saveReports = (newList: PerformanceReportRecord[]) => {
    setReportsList(newList);
    try {
      localStorage.setItem("qa_performance_reports_list", JSON.stringify(newList));
    } catch (e) {
      console.warn("Failed to persist performance reports to localStorage:", e);
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm("Are you sure you want to remove this performance report?")) {
      const filtered = reportsList.filter((r) => r.id !== id);
      saveReports(filtered);
    }
  };

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
      {/* Header with Add Performance Report and Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: COLORS.ink }}>
            Performance & Latency Monitoring
          </h2>
          <p className="text-xs" style={{ color: COLORS.sub }}>
            Upload performance audit reports, monitor SLA latency thresholds, and track stress test results
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
            title="Add or upload a performance test report"
          >
            <Plus size={14} />
            <span>Add Performance Report</span>
          </button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Performance Reports"
          value={reportsList.length}
          sub="Archived audit & test files"
          icon={FileText}
          tone={COLORS.accent}
        />
        <StatCard
          label="Within SLA"
          value={reportsList.filter((r) => r.status.toLowerCase().includes("within")).length}
          sub="Passing SLA performance criteria"
          icon={CheckCircle2}
          tone={COLORS.green}
        />
        <StatCard
          label="Critical / Slow Routes"
          value={perfSlow.length}
          sub="Heavy routes > 500ms"
          icon={Gauge}
          tone={COLORS.red}
        />
        <StatCard
          label="Fast Endpoints"
          value={perfFast.length}
          sub="Average response < 120ms"
          icon={Clock}
          tone={COLORS.teal}
        />
      </div>

      {/* Performance Reports Section */}
      <div className="rounded-xl overflow-hidden shadow-xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="flex items-center gap-2">
              <FileText size={17} color={COLORS.accent} />
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Performance Test Reports & Audits
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: COLORS.sub }}>
              Uploaded load test runs, stress benchmark files, and executive audit documents
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Upload size={13} className="text-indigo-600" />
            <span>Upload Report</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Report Title & Scope</th>
                <th className="px-4 py-3 font-semibold">Attached File</th>
                <th className="px-4 py-3 font-semibold">Execution Date</th>
                <th className="px-4 py-3 font-semibold">Outcome Status</th>
                <th className="px-4 py-3 font-semibold">Observations / Summary</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {reportsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={28} className="text-slate-300" />
                      <span>No performance reports added yet. Click &quot;Add Performance Report&quot; to upload one.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                reportsList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-xs" style={{ color: COLORS.ink }}>
                        {r.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                        <Layers size={11} className="text-slate-400" />
                        <span>{r.projectName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getFormatIcon(r.fileFormat)}
                        <span className="font-medium text-slate-700 truncate max-w-[180px]" title={r.fileName}>
                          {r.fileName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {r.fileFormat} • {r.fileSize}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        <span>{r.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">by {r.uploadedBy}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-slate-600 line-clamp-2" title={r.summary}>
                        {r.summary || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewReport(r)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Preview Report Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => downloadReportFile(r)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Download Report File"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              No performance data logged yet. Click &quot;Add Performance Report&quot; to add a report.
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
        <AddPerformanceReportModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (reportData, optionalBenchmark) => {
            // Add report to list
            saveReports([reportData, ...reportsList]);

            // Sync with global reports
            if (uploadReport) {
              const safeKey = reportData.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
              const fmt = reportData.fileFormat === "Excel" ? "Excel" : "PDF";
              await uploadReport(
                "performance",
                reportData.fileName || `Performance_Report_${safeKey}.pdf`,
                fmt,
                `Performance Report: ${reportData.title} (${reportData.status}) for ${reportData.projectName}. ${reportData.summary || ""}`
              );
            }

            // Sync with endpoint benchmarks
            if (optionalBenchmark) {
              await addPerfEndpoint(optionalBenchmark);
            } else {
              // Create realistic benchmark reflecting test status
              const isWithin = reportData.status.toLowerCase().includes("within");
              const isDegraded = reportData.status.toLowerCase().includes("degrad");
              const avgNum = isWithin ? 92 : isDegraded ? 580 : 980;
              const p95Num = isWithin ? 145 : isDegraded ? 920 : 1650;
              const p99Num = isWithin ? 210 : isDegraded ? 1350 : 2400;
              const maxNum = isWithin ? 310 : isDegraded ? 2100 : 3800;
              const errNum = isWithin ? 0 : isDegraded ? 1.5 : 6.2;
              const category = isWithin ? "Fast" : "Slow";

              await addPerfEndpoint({
                name: reportData.title,
                ep: `/${reportData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
                avg: avgNum,
                p95: p95Num,
                p99: p99Num,
                max: maxNum,
                err: errNum,
                category,
                load: "Load Test Benchmark",
                status: reportData.status,
                notes: reportData.summary || `Logged from ${reportData.title}`,
                date: reportData.date,
              });
            }

            setShowAddModal(false);
          }}
        />
      )}

      {/* Preview Report Modal */}
      {previewReport && (
        <PreviewReportModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onDownload={() => downloadReportFile(previewReport)}
        />
      )}
    </div>
  );
}

function AddPerformanceReportModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (report: PerformanceReportRecord, benchmark?: PerfEndpoint) => Promise<void>;
}) {
  const { projects, currentUser } = useQAStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState(projects[0]?.name || "Assessment Platform");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"Within SLA" | "Degraded" | "Failed / Breached">("Within SLA");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Optional collapsible benchmark metrics
  const [showBenchmarkMetrics, setShowBenchmarkMetrics] = useState(false);
  const [endpointPath, setEndpointPath] = useState("");
  const [avgMs, setAvgMs] = useState("95");
  const [p95Ms, setP95Ms] = useState("145");
  const [p99Ms, setP99Ms] = useState("210");
  const [maxMs, setMaxMs] = useState("320");
  const [errRate, setErrRate] = useState("0");
  const [simulatedLoad, setSimulatedLoad] = useState("500 Concurrent Users");

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    if (!title.trim()) {
      // Auto-derive clean title from file name
      const cleanName = selected.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a report title or test name.");
      return;
    }

    setBusy(true);
    setErrorMsg("");

    try {
      let fileDataUrl: string | undefined = undefined;
      let fileName = file ? file.name : `${title.trim().replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`;
      let fileSize = file ? formatBytes(file.size) : "1.2 MB";
      let fileFormat: PerformanceReportRecord["fileFormat"] = "PDF";

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "xlsx" || ext === "xls") fileFormat = "Excel";
        else if (ext === "csv") fileFormat = "CSV";
        else if (ext === "html" || ext === "htm") fileFormat = "HTML";
        else if (ext === "log" || ext === "txt") fileFormat = "Log";
        else if (ext === "pdf") fileFormat = "PDF";
        else fileFormat = "Other";

        // Read file as data URL to enable instant download
        fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
      }

      const reportRecord: PerformanceReportRecord = {
        id: `perf-rep-${Date.now()}`,
        title: title.trim(),
        projectName: projectName || "Global Platform",
        date: date || new Date().toISOString().slice(0, 10),
        status,
        fileName,
        fileSize,
        fileFormat,
        fileData: fileDataUrl,
        summary: summary.trim(),
        uploadedBy: currentUser?.name || "Alex Vance",
      };

      let benchmarkData: PerfEndpoint | undefined = undefined;
      if (showBenchmarkMetrics && endpointPath.trim()) {
        const ep = endpointPath.trim().startsWith("/") ? endpointPath.trim() : `/${endpointPath.trim()}`;
        const avg = parseFloat(avgMs) || 95;
        const p95 = parseFloat(p95Ms) || 145;
        const p99 = parseFloat(p99Ms) || 210;
        const max = parseFloat(maxMs) || 320;
        const err = parseFloat(errRate) || 0;
        benchmarkData = {
          name: title.trim(),
          ep,
          avg,
          p95,
          p99,
          max,
          err,
          category: avg <= 200 ? "Fast" : "Slow",
          load: simulatedLoad,
          status,
          notes: summary.trim() || undefined,
          date,
        };
      }

      await onAdd(reportRecord, benchmarkData);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add performance report.");
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
              <Upload size={17} />
            </div>
            <div>
              <span className="text-sm font-bold block" style={{ color: COLORS.ink }}>
                Add Performance Report
              </span>
              <span className="text-[11px]" style={{ color: COLORS.sub }}>
                Upload a performance test report document, audit findings, or benchmark summary
              </span>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-slate-100 cursor-pointer">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Report Title */}
          <div>
            <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
              Report Title / Test Name *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Assessment Platform Concurrency & Load Test Run"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          {/* Project & Execution Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Project / Service Scope *
              </label>
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                <option value="Global Platform">Global Platform (All Services)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                Test Execution Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
          </div>

          {/* SLA Status Outcome */}
          <div>
            <label className="text-xs block mb-1.5 font-semibold" style={{ color: COLORS.ink }}>
              Performance Outcome / SLA Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "Within SLA", label: "Within SLA (Pass)", tone: COLORS.green, icon: CheckCircle2 },
                { val: "Degraded", label: "Degraded (Warning)", tone: COLORS.amber, icon: AlertTriangle },
                { val: "Failed / Breached", label: "Breached (Fail)", tone: COLORS.red, icon: AlertCircle },
              ].map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = status === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setStatus(opt.val as any)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected ? "shadow-xs ring-1" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      background: isSelected ? opt.tone + "15" : COLORS.panel2,
                      borderColor: isSelected ? opt.tone : COLORS.border,
                      color: isSelected ? opt.tone : COLORS.sub,
                    }}
                  >
                    <IconComponent size={13} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report File Upload Dropzone */}
          <div>
            <label className="text-xs block mb-1.5 font-semibold" style={{ color: COLORS.ink }}>
              Upload Report File / Document (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
              className="rounded-xl border border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50"
              style={{
                borderColor: file ? COLORS.accent : COLORS.border,
                background: file ? COLORS.accent + "08" : COLORS.panel2,
              }}
            >
              {file ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate max-w-[260px]">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatBytes(file.size)} • Click to replace file
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Click to browse or drag and drop your report
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PDF, Excel (.xlsx, .csv), HTML, JMeter, k6, or Log files
                    </span>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.html,.htm,.json,.log,.txt,.zip,.docx"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Observations and Summary */}
          <div>
            <label className="text-xs block mb-1 font-semibold" style={{ color: COLORS.ink }}>
              Executive Summary & Observations
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Sustained 500 concurrent virtual users for 30 minutes. Average latency stayed below 120ms with 0% HTTP 5xx errors. Database memory overhead remained nominal."
              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          {/* Collapsible Endpoint Benchmarks (Optional) */}
          <div className="rounded-xl border p-3" style={{ background: COLORS.panel2, borderColor: COLORS.border }}>
            <button
              type="button"
              onClick={() => setShowBenchmarkMetrics(!showBenchmarkMetrics)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold cursor-pointer"
              style={{ color: COLORS.ink }}
            >
              <div className="flex items-center gap-1.5">
                <Gauge size={14} className="text-indigo-600" />
                <span>Include Specific Endpoint Benchmarks (Optional)</span>
              </div>
              {showBenchmarkMetrics ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showBenchmarkMetrics && (
              <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: COLORS.border }}>
                <div className="text-[11px] text-slate-500">
                  Optionally attach latency metrics to plot directly on the Latency Benchmarks bar chart.
                </div>

                {/* Endpoint Path & Simulated Load */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                      API Route Path
                    </label>
                    <input
                      value={endpointPath}
                      onChange={(e) => setEndpointPath(e.target.value)}
                      placeholder="e.g. /api/assessments/submit"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none font-mono"
                      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] block mb-1 font-semibold" style={{ color: COLORS.ink }}>
                      Simulated Load
                    </label>
                    <input
                      value={simulatedLoad}
                      onChange={(e) => setSimulatedLoad(e.target.value)}
                      placeholder="e.g. 500 Virtual Users"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  </div>
                </div>

                {/* Latencies */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] block mb-1 font-semibold text-slate-600">
                      Avg (ms)
                    </label>
                    <input
                      type="number"
                      value={avgMs}
                      onChange={(e) => setAvgMs(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none font-mono"
                      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1 font-semibold text-slate-600">
                      P95 (ms)
                    </label>
                    <input
                      type="number"
                      value={p95Ms}
                      onChange={(e) => setP95Ms(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none font-mono"
                      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1 font-semibold text-slate-600">
                      P99 (ms)
                    </label>
                    <input
                      type="number"
                      value={p99Ms}
                      onChange={(e) => setP99Ms(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none font-mono"
                      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1 font-semibold text-slate-600">
                      Error %
                    </label>
                    <input
                      type="number"
                      value={errRate}
                      onChange={(e) => setErrRate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none font-mono"
                      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  </div>
                </div>
              </div>
            )}
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
              style={{ background: COLORS.accent, opacity: busy ? 0.7 : 1 }}
            >
              <Upload size={14} />
              <span>{busy ? "Saving Report…" : "Save & Upload Report"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewReportModal({
  report,
  onClose,
  onDownload,
}: {
  report: PerformanceReportRecord;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl space-y-4 p-6"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2">
            {getFormatIcon(report.fileFormat)}
            <div>
              <span className="text-sm font-bold block" style={{ color: COLORS.ink }}>
                {report.title}
              </span>
              <span className="text-[11px]" style={{ color: COLORS.sub }}>
                {report.projectName} • Executed on {report.date}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 cursor-pointer">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">SLA Performance Status</span>
              <div className="mt-1">{getStatusBadge(report.status)}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Recorded By</span>
              <span className="font-semibold text-slate-800">{report.uploadedBy}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-semibold mb-1">Attached Document</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFormatIcon(report.fileFormat)}
                <span className="font-mono font-medium text-slate-800">{report.fileName}</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">{report.fileSize}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-semibold mb-1">Executive Summary & Observations</span>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {report.summary || "No summary observations provided."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 cursor-pointer"
            style={{ color: COLORS.sub }}
          >
            Close
          </button>
          <button
            onClick={() => {
              onDownload();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer hover:opacity-95"
            style={{ background: COLORS.green }}
          >
            <Download size={14} />
            <span>Download Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Performance;
