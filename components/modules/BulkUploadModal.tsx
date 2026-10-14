"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Building2,
  FolderGit2,
  FileCheck,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Project, User, Defect } from "@/lib/types";

interface ParsedDefectRow {
  rowNum: number;
  module: string;
  feature: string;
  severity: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  assignee: string;
  isValid: boolean;
  errorMsg?: string;
}

interface BulkUploadModalProps {
  projects: Project[];
  availableClients: string[];
  isClient: boolean;
  clientOrgName: string;
  currentUser: User | null;
  onClose: () => void;
  onBulkUpload: (defects: (Defect | Record<string, any>)[]) => Promise<any>;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#DC2626",
  Major: "#EA580C",
  Medium: "#D97706",
  Minor: "#0284C7",
  High: "#DC2626",
  Low: "#0284C7",
};

export function BulkUploadModal({
  projects,
  availableClients,
  isClient,
  clientOrgName,
  currentUser,
  onClose,
  onBulkUpload,
}: BulkUploadModalProps) {
  // Target Client and Project state
  const [selectedClient, setSelectedClient] = useState<string>(
    isClient ? clientOrgName : availableClients[0] || "PathAxiom"
  );

  const projectsForClient = useMemo(() => {
    return projects.filter(
      (p) => !p.client_name || p.client_name.toLowerCase() === selectedClient.toLowerCase()
    );
  }, [projects, selectedClient]);

  const [selectedProjectCode, setSelectedProjectCode] = useState<string>(
    projectsForClient[0]?.code || projects[0]?.code || "PRJ-001"
  );

  // File & Parsing state
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedDefectRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = useMemo(() => {
    return projects.find((p) => p.code === selectedProjectCode) || projects[0];
  }, [projects, selectedProjectCode]);

  // Statistics
  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter((r) => !r.isValid), [parsedRows]);

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        "Module": "Authentication",
        "Feature": "Login",
        "Severity": "Critical",
        "Priority": "P1",
        "Title": "User cannot login with valid credentials on Chrome",
        "Description": "Submitting the login form returns 500 internal server error on Chrome 129.",
        "Status": "Open",
        "Assignee": "QA Team",
      },
      {
        "Module": "Billing",
        "Feature": "Checkout",
        "Severity": "Major",
        "Priority": "P2",
        "Title": "Invoice PDF shows wrong tax calculation",
        "Description": "State tax is computed at 12% instead of the updated 18% slab.",
        "Status": "Open",
        "Assignee": "Dev Team",
      },
      {
        "Module": "Dashboard",
        "Feature": "Analytics",
        "Severity": "Medium",
        "Priority": "P3",
        "Title": "Monthly velocity chart tooltips are cut off on small viewports",
        "Description": "Tooltip container overflows viewport boundary on screen width < 768px.",
        "Status": "Open",
        "Assignee": "Unassigned",
      },
      {
        "Module": "User Management",
        "Feature": "Profile",
        "Severity": "Minor",
        "Priority": "P4",
        "Title": "Avatar upload does not display thumbnail preview before saving",
        "Description": "Selecting a valid .png image leaves preview circle blank until page refresh.",
        "Status": "Open",
        "Assignee": "QA Team",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);

    // Auto-fit column widths
    ws["!cols"] = [
      { wch: 20 }, // Module
      { wch: 18 }, // Feature
      { wch: 14 }, // Severity
      { wch: 12 }, // Priority
      { wch: 55 }, // Title
      { wch: 60 }, // Description
      { wch: 14 }, // Status
      { wch: 18 }, // Assignee
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defects Template");
    XLSX.writeFile(wb, "QA_Tracker_Defect_Upload_Template.xlsx");
  };

  // Process & Parse Uploaded File
  const processFile = async (uploadedFile: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = uploadedFile.name.substring(uploadedFile.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(ext)) {
      alert("Please upload a valid Excel spreadsheet (.xlsx, .xls) or CSV file (.csv).");
      return;
    }

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        alert("The uploaded spreadsheet does not contain any sheets.");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rawData.length === 0) {
        alert("The uploaded spreadsheet is empty. Please add defect rows and try again.");
        return;
      }

      // Case-insensitive key lookup helper
      const mapped: ParsedDefectRow[] = rawData.map((row, idx) => {
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(
              (rk) => rk.trim().toLowerCase() === k.toLowerCase()
            );
            if (foundKey && String(row[foundKey]).trim()) {
              return String(row[foundKey]).trim();
            }
          }
          return "";
        };

        const title = getVal(["Title", "Bug Title", "Defect Title", "Summary", "Issue"]);
        const module = getVal(["Module", "Category", "Component", "Module / Category"]) || "General";
        const feature = getVal(["Feature", "Sub-feature", "Subfeature"]) || "General";
        const rawSeverity = getVal(["Severity", "Sev"]) || "Medium";
        const priority = getVal(["Priority", "Prio"]) || "Medium";
        const status = getVal(["Status", "State"]) || "Open";
        const assignee = getVal(["Assignee", "Assigned To", "Owner"]) || "Unassigned";
        const description = getVal(["Description", "Desc", "Details", "Steps to Reproduce"]) || "";

        // Standardize severity casing
        const capitalizedSev =
          rawSeverity.charAt(0).toUpperCase() + rawSeverity.slice(1).toLowerCase();
        const severity = ["Critical", "Major", "Medium", "Minor", "High", "Low"].includes(
          capitalizedSev
        )
          ? capitalizedSev
          : "Medium";

        const isValid = Boolean(title && title.length >= 3);
        const errorMsg = !title
          ? "Missing Title"
          : title.length < 3
          ? "Title too short (min 3 chars)"
          : undefined;

        return {
          rowNum: idx + 2,
          module,
          feature,
          severity,
          priority,
          title,
          description,
          status,
          assignee,
          isValid,
          errorMsg,
        };
      });

      setFile(uploadedFile);
      setParsedRows(mapped);
      setUploadSuccess(null);
    } catch (err: any) {
      alert("Failed to parse file: " + (err.message || "Invalid file format"));
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Submit and Upload to PostgreSQL
  const handleImport = async () => {
    if (validRows.length === 0) {
      alert("No valid defect rows found to import.");
      return;
    }

    setUploading(true);
    try {
      const payload = validRows.map((r) => ({
        client_name: selectedClient,
        project_name: activeProject?.name || "Assessment Platform",
        project_code: activeProject?.code || selectedProjectCode,
        module: r.module,
        feature: r.feature,
        severity: r.severity,
        priority: r.priority,
        title: r.title,
        description: r.description,
        status: r.status,
        created_by: currentUser?.name || "QA Team",
        assignee: r.assignee,
      }));

      const res = await onBulkUpload(payload);
      const count = res?.count || validRows.length;
      setUploadSuccess(count);

      // Auto-close after brief confirmation
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      alert("Bulk upload failed: " + (err.message || "Unknown error occurred"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={() => {
        if (!uploading) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bulk Upload Defects</h3>
              <p className="text-[11px] text-slate-500">
                Import defects in bulk from an Excel spreadsheet (.xlsx, .xls) or CSV file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          {/* Target Client & Project Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span>Target Client Organization</span>
              </label>
              <select
                value={selectedClient}
                disabled={isClient || uploading}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  const matching = projects.filter(
                    (p) => !p.client_name || p.client_name.toLowerCase() === e.target.value.toLowerCase()
                  );
                  if (matching[0]) setSelectedProjectCode(matching[0].code);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                {availableClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <FolderGit2 size={13} className="text-slate-400" />
                <span>Target Project</span>
              </label>
              <select
                value={selectedProjectCode}
                disabled={uploading}
                onChange={(e) => setSelectedProjectCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                {projectsForClient.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Download Sample Template Banner */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={20} className="text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-indigo-950">
                  Need the Excel format template?
                </h4>
                <p className="text-[11px] text-indigo-700">
                  Download our formatted spreadsheet template with pre-filled sample defect rows.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download size={13} />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>

          {/* File Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                : file
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileCheck size={22} />
                </div>
                <span className="text-xs font-bold text-slate-800">{file.name}</span>
                <span className="text-[11px] text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB · Click or drag to replace file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Drag and drop your spreadsheet here, or <span className="text-indigo-600 underline">browse</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) files
                </div>
              </div>
            )}
          </div>

          {/* Parsed Rows Preview & Validation Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Defects Preview ({parsedRows.length} found)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {validRows.length} ready
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {invalidRows.length} invalid
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  Target: <b>{activeProject?.name}</b>
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Module</th>
                      <th className="py-2 px-3">Feature</th>
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Priority</th>
                      <th className="py-2 px-3">Assignee</th>
                      <th className="py-2 px-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.rowNum}
                        className={r.isValid ? "hover:bg-slate-50/60" : "bg-rose-50/40"}
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                          #{r.rowNum}
                        </td>
                        <td
                          className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate"
                          title={r.title}
                        >
                          {r.title || <span className="text-rose-500 italic">Missing title</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.module}</td>
                        <td className="py-2 px-3 text-slate-500">{r.feature}</td>
                        <td className="py-2 px-3">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: (SEVERITY_COLORS[r.severity] || "#64748b") + "18",
                              color: SEVERITY_COLORS[r.severity] || "#64748b",
                            }}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.priority}</td>
                        <td className="py-2 px-3 text-slate-600">{r.assignee}</td>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={11} /> {r.errorMsg}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {uploadSuccess !== null && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div className="text-xs font-semibold">
                Successfully imported {uploadSuccess} {uploadSuccess === 1 ? "defect" : "defects"} into {activeProject?.name}!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={validRows.length === 0 || uploading || uploadSuccess !== null}
              onClick={handleImport}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                validRows.length === 0 || uploading || uploadSuccess !== null
                  ? "bg-slate-300 opacity-70 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Importing {validRows.length} Defects...</span>
                </>
              ) : uploadSuccess !== null ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Import Complete</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Import {validRows.length} Defects</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
