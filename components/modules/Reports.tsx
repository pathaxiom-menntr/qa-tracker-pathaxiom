"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  Upload,
  X,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  RotateCcw,
  Trash2,
  File,
  FileText,
  FileSpreadsheet,
  Calendar,
  User as UserIcon,
  ListChecks,
  Zap,
  CheckCircle2,
  Server,
  Gauge,
  ShieldAlert,
  Monitor,
  TrendingUp,
  Bug,
  Info,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = {
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  teal: "#0D9488",
  red: "#DC2626",
  green: "#16A34A",
  sky: "#0284C7",
  amber: "#D97706",
};

const REPORT_TYPES = [
  { key: "functional", name: "Functional Testing Report", icon: ListChecks, desc: "Feature-level pass/fail coverage across all portals." },
  { key: "regression", name: "Regression Testing Report", icon: RefreshCw, desc: "Re-verification of existing functionality after changes." },
  { key: "smoke", name: "Smoke Testing Report", icon: Zap, desc: "Build-acceptance checks before deeper QA cycles." },
  { key: "sanity", name: "Sanity Testing Report", icon: CheckCircle2, desc: "Narrow, focused checks after minor fixes." },
  { key: "api", name: "API Testing Report", icon: Server, desc: "Endpoint contract, auth and payload verification." },
  { key: "performance", name: "Performance Testing Report", icon: Gauge, desc: "Load/stress results, latency and throughput." },
  { key: "security", name: "Security Testing (VAPT) Report", icon: ShieldAlert, desc: "Vulnerability assessment & penetration test findings." },
  { key: "crossbrowser", name: "Cross Browser Testing Report", icon: Monitor, desc: "Rendering verification across 10 desktop browsers." },
  { key: "compatibility", name: "Compatibility Testing Report", icon: Monitor, desc: "Desktop vs mobile web feature parity checklist." },
  { key: "accessibility", name: "Accessibility Testing Report", icon: Eye, desc: "WCAG conformance and assistive-technology checks." },
  { key: "uat", name: "UAT Testing Report", icon: UserIcon, desc: "Stakeholder / client sign-off on acceptance scenarios." },
  { key: "testcase", name: "Test Case Report", icon: File, desc: "Consolidated test case bank across all portals." },
  { key: "defect", name: "Defect Report", icon: Bug, desc: "Consolidated defect log with severity & status." },
  { key: "execsummary", name: "Executive Summary Report", icon: TrendingUp, desc: "Leadership-facing quality & release readiness digest." },
];

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: color + "1E", color }}
    >
      {children}
    </span>
  );
}

function Row({
  icon: Icon,
  text,
  mono,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  text: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 truncate" style={{ color: COLORS.ink }}>
      <Icon size={12} color={COLORS.sub} className="shrink-0" />
      <span className={`truncate ${mono ? "font-mono text-[11px]" : ""}`}>{text}</span>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  label: string;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10px] font-medium hover:brightness-95 transition-all"
      style={{
        background: COLORS.panel2,
        color: tone || COLORS.sub,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Icon size={13} color={tone || COLORS.sub} />
      {label}
    </button>
  );
}

export function Reports() {
  const { reports, uploadReport, deleteReport, restoreReport, purgeReport, defects, currentUser } = useQAStore();
  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");
  const [q, setQ] = useState("");
  const [activeUpload, setActiveUpload] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<{ key: string; name: string } | null>(null);
  const [reportToPurge, setReportToPurge] = useState<{ key: string; name: string } | null>(null);
  const [preview, setPreview] = useState<{
    name: string;
    format: "PDF" | "Excel";
    uploadedBy: string;
    date: string;
    version: string;
    comments: string;
  } | null>(null);

  const isClient = currentUser?.role === "Client";
  const clientOrg = currentUser?.client_name || "PathAxiom";

  // Client isolation: only show defects relevant to the client if role is Client
  const visibleDefects = isClient
    ? defects.filter(
        (d) => (d.client_name || "").toLowerCase() === clientOrg.toLowerCase()
      )
    : defects;

  const handleDownloadLiveDefectsExcel = () => {
    if (visibleDefects.length === 0) {
      alert("No defects available to export.");
      return;
    }
    const rows = visibleDefects.map((d) => ({
      "Bug ID": d.id,
      Client: d.client_name || "PathAxiom",
      Project: d.project_name || "Assessment Platform",
      "Project Code": d.project_code || "PRJ-001",
      "Module / Category": d.module,
      Feature: d.feature || "General",
      Title: d.title,
      Severity: d.severity,
      Priority: d.priority,
      Status: d.status,
      Assignee: d.assignee || "Unassigned",
      "Reported By": d.created_by || "QA Team",
      "Created Date": d.created_at ? new Date(d.created_at).toLocaleDateString() : "-",
      Description: d.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Live Bug Report");
    XLSX.writeFile(workbook, `QA_Bug_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDownloadLiveDefectsPDF = () => {
    if (visibleDefects.length === 0) {
      alert("No defects available to export.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 18, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("QA TRACKER — LIVE BUG & DEFECT AUDIT REPORT", 14, 12);

    autoTable(doc, {
      startY: 25,
      head: [["Bug ID", "Client", "Project", "Module", "Feature", "Title", "Severity", "Priority", "Status", "Assignee"]],
      body: visibleDefects.map((d) => [
        d.id,
        d.client_name || "PathAxiom",
        d.project_name || "Assessment Platform",
        d.module,
        d.feature || "General",
        d.title.length > 40 ? d.title.substring(0, 38) + "…" : d.title,
        d.severity,
        d.priority,
        d.status,
        d.assignee || "Unassigned",
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
    });
    doc.save(`QA_Bug_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filtered = REPORT_TYPES.filter((r) =>
    r.name.toLowerCase().includes(q.toLowerCase())
  );
  const activeUploadedCount = Object.values(reports).filter((r) => !r.is_deleted).length;
  const trashReports = Object.entries(reports)
    .filter(([_, r]) => !!r?.is_deleted)
    .map(([key, r]) => ({
      key,
      ...r,
      typeInfo: REPORT_TYPES.find((rt) => rt.key === key) || { name: key, desc: "" },
    }));

  const handleDownload = (fileName: string) => {
    const blob = new Blob([`Report Content: ${fileName}\nExported from QA Tracker Suite`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Sub-tabs: Active Reports vs Recycle Bin */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === "active" ? "#FFFFFF" : "transparent",
              color: activeTab === "active" ? COLORS.ink : COLORS.sub,
              boxShadow: activeTab === "active" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <FileText size={13} className={activeTab === "active" ? "text-indigo-600" : "text-slate-400"} />
            <span>Active Reports ({REPORT_TYPES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trash")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === "trash" ? "#FFFFFF" : "transparent",
              color: activeTab === "trash" ? "#DC2626" : COLORS.sub,
              boxShadow: activeTab === "trash" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Trash2 size={13} className={activeTab === "trash" ? "text-rose-600" : "text-slate-400"} />
            <span>Recycle Bin ({trashReports.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.sub }}>
          <span>
            <b>{activeUploadedCount}</b> of <b>{REPORT_TYPES.length}</b> report types have an active uploaded document
          </span>
          <Badge color={COLORS.sky}>{currentUser?.role || "QA Team"}</Badge>
        </div>
      </div>

      {activeTab === "active" ? (
        <>
          {/* Search Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 min-w-[240px] max-w-md"
              style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
            >
              <Search size={14} color={COLORS.sub} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search report types…"
                className="bg-transparent outline-none text-sm flex-1"
                style={{ color: COLORS.ink }}
              />
            </div>
          </div>

          {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((rt) => {
          const rec = reports[rt.key] && !reports[rt.key]?.is_deleted ? reports[rt.key] : null;
          const Icon = rt.icon;
          return (
            <div
              key={rt.key}
              className="rounded-xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-sm"
              style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: COLORS.accent + "1E" }}
                  >
                    <Icon size={16} color={COLORS.accent} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                      {rt.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: COLORS.sub }}>
                      {rt.desc}
                    </div>
                  </div>
                </div>
                <Badge color={rec ? COLORS.green : COLORS.sub}>
                  {rec ? "Available" : "Not Uploaded"}
                </Badge>
              </div>

              {rec ? (
                <>
                  <div
                    className="rounded-lg p-2.5 text-xs space-y-1.5"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}` }}
                  >
                    <Row
                      icon={rec.format === "PDF" ? File : FileSpreadsheet}
                      text={rec.fileName}
                      mono
                    />
                    <Row icon={Calendar} text={`Uploaded ${rec.date}`} />
                    <Row icon={UserIcon} text={rec.uploadedBy} />
                    <div className="flex items-center justify-between pt-1">
                      <Badge color={COLORS.sky}>v{rec.version}</Badge>
                      <span style={{ color: COLORS.sub }}>
                        {rec.size} · {rec.format}
                      </span>
                    </div>
                    {rec.comments && (
                      <div className="pt-1 text-[11px] italic" style={{ color: COLORS.sub }}>
                        &ldquo;{rec.comments}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <ActionBtn
                      icon={Eye}
                      label="View"
                      onClick={() =>
                        setPreview({
                          name: rec.fileName,
                          format: rec.format,
                          uploadedBy: rec.uploadedBy,
                          date: rec.date,
                          version: rec.version,
                          comments: rec.comments,
                        })
                      }
                    />
                    <ActionBtn
                      icon={Download}
                      label="Get"
                      onClick={() => handleDownload(rec.fileName)}
                    />
                    <ActionBtn
                      icon={RefreshCw}
                      label="Replace"
                      onClick={() => setActiveUpload(rt.key)}
                    />
                    <ActionBtn
                      icon={Trash2}
                      label="Delete"
                      tone={COLORS.red}
                      onClick={() => setReportToDelete({ key: rt.key, name: rt.name })}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 mt-auto">
                  {rt.key === "defect" && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-medium text-indigo-900">
                        <span>Live Database Defects</span>
                        <span className="font-bold">{visibleDefects.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={handleDownloadLiveDefectsExcel}
                          className="flex items-center justify-center gap-1 py-1 px-2 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                        >
                          <FileSpreadsheet size={12} /> Excel (.xlsx)
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadLiveDefectsPDF}
                          className="flex items-center justify-center gap-1 py-1 px-2 rounded text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                        >
                          <FileText size={12} /> PDF (.pdf)
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setActiveUpload(rt.key)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium border border-dashed hover:bg-slate-50 transition-colors"
                    style={{ borderColor: COLORS.border, color: COLORS.accent }}
                  >
                    <Upload size={14} /> Upload Custom Report
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      ) : (
        /* Recycle Bin View for Reports */
        <div className="rounded-xl overflow-hidden shadow-xs" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Recycle Bin — Preserved Reports</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Soft-deleted reports are kept permanently here. They can be restored at any time or manually wiped.
            </p>
          </div>

          {trashReports.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Recycle Bin is empty. No report documents currently soft-deleted.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
                <tr>
                  <th className="px-4 py-3 font-semibold w-16">#</th>
                  <th className="px-4 py-3 font-semibold">Report Type</th>
                  <th className="px-4 py-3 font-semibold">File Name</th>
                  <th className="px-4 py-3 font-semibold w-24">Format</th>
                  <th className="px-4 py-3 font-semibold w-36">Uploaded By</th>
                  <th className="px-4 py-3 font-semibold w-36">Deleted Date</th>
                  <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                {trashReports.map((r, i) => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.typeInfo.name}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{r.fileName}</td>
                    <td className="px-4 py-3">
                      <Badge color={r.format === "PDF" ? COLORS.red : COLORS.green}>{r.format}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.uploadedBy}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {r.deleted_at ? new Date(r.deleted_at).toLocaleDateString() : "Preserved"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => restoreReport(r.key)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <RotateCcw size={11} />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportToPurge({ key: r.key, name: r.typeInfo.name })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={11} />
                          Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {activeUpload && (
        <UploadModal
          reportType={REPORT_TYPES.find((r) => r.key === activeUpload)!}
          onClose={() => setActiveUpload(null)}
          onUpload={(fileName, format, comments) => {
            uploadReport(activeUpload, fileName, format, comments);
            setActiveUpload(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}

      {/* Modal: Move Report to Recycle Bin */}
      {reportToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setReportToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={16} color={COLORS.amber} />
              <span className="text-sm font-semibold">Move Report to Recycle Bin?</span>
            </div>
            <p className="text-xs mb-5 text-slate-600 leading-relaxed">
              Are you sure you want to move the document for &quot;<b>{reportToDelete.name}</b>&quot; to the Recycle Bin? It will remain preserved indefinitely and can be restored at any time.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteReport(reportToDelete.key);
                  setReportToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permanently Purge Report */}
      {reportToPurge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setReportToPurge(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.red} />
              <span className="text-sm font-semibold text-rose-700">Permanently Delete Report?</span>
            </div>
            <p className="text-xs mb-5 text-slate-600 leading-relaxed">
              <b>Warning:</b> Are you sure you want to permanently erase the document for &quot;<b>{reportToPurge.name}</b>&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportToPurge(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await purgeReport(reportToPurge.key);
                  setReportToPurge(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadModal({
  reportType,
  onClose,
  onUpload,
}: {
  reportType: (typeof REPORT_TYPES)[number];
  onClose: () => void;
  onUpload: (fileName: string, format: "PDF" | "Excel", comments: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [comments, setComments] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = reportType.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const format = file.name.endsWith(".pdf") ? "PDF" : "Excel";
    onUpload(file.name, format, comments);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl p-5 shadow-xl"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon size={16} color={COLORS.accent} />
            <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
              Upload — {reportType.name}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            className="rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:bg-slate-50 transition-colors"
            style={{ borderColor: COLORS.border, background: COLORS.panel2 }}
          >
            <Upload size={22} color={COLORS.accent} />
            <span className="text-xs font-medium" style={{ color: file ? COLORS.ink : COLORS.sub }}>
              {file ? file.name : "Click or drag a PDF / Excel file here"}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>
              Comments / Remarks
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Sprint 24 release audit results"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{
                background: COLORS.panel2,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.ink,
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100"
              style={{ color: COLORS.sub }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-opacity"
              style={{
                background: COLORS.accent,
                opacity: file ? 1 : 0.5,
              }}
            >
              Upload Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({
  preview,
  onClose,
}: {
  preview: {
    name: string;
    format: "PDF" | "Excel";
    uploadedBy: string;
    date: string;
    version: string;
    comments: string;
  };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl flex flex-col overflow-hidden shadow-2xl"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {preview.format === "PDF" ? (
              <File size={16} color={COLORS.red} />
            ) : (
              <FileSpreadsheet size={16} color={COLORS.green} />
            )}
            <span className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
              {preview.name}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            className="rounded-lg p-4 border flex flex-col items-center justify-center text-center py-10"
            style={{ background: COLORS.panel2, borderColor: COLORS.border }}
          >
            {preview.format === "PDF" ? (
              <File size={48} color={COLORS.accent} className="mb-3" />
            ) : (
              <FileSpreadsheet size={48} color={COLORS.teal} className="mb-3" />
            )}
            <div className="text-sm font-medium" style={{ color: COLORS.ink }}>
              Preview Ready for {preview.name}
            </div>
            <div className="text-xs mt-1 max-w-md" style={{ color: COLORS.sub }}>
              This verified report ({preview.format}) is archived in Menntr QA Suite.
              {preview.comments && ` Note: "${preview.comments}"`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className="p-3 rounded-lg border"
              style={{ background: COLORS.panel2, borderColor: COLORS.border }}
            >
              <div style={{ color: COLORS.sub }}>Uploaded By</div>
              <div className="font-medium mt-0.5" style={{ color: COLORS.ink }}>
                {preview.uploadedBy}
              </div>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{ background: COLORS.panel2, borderColor: COLORS.border }}
            >
              <div style={{ color: COLORS.sub }}>Date & Version</div>
              <div className="font-medium mt-0.5" style={{ color: COLORS.ink }}>
                {preview.date} · v{preview.version}
              </div>
            </div>
          </div>
        </div>

        <div
          className="px-5 py-3 flex justify-end gap-2"
          style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.panel2 }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200"
            style={{ color: COLORS.ink }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
export default Reports;
