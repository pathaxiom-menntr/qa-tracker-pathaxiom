"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Bug,
  Plus,
  X,
  Trash2,
  Search,
  AlertTriangle,
  Pencil,
  Loader2,
  FileSpreadsheet,
  FileText,
  Building2,
  FolderGit2,
  Layers,
  Settings2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  BarChart3,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useQAStore } from "@/lib/store";
import { Defect, Project, Role } from "@/lib/types";

const COLORS = {
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  accent2: "#4F46E5",
  red: "#DC2626",
  amber: "#D97706",
  green: "#16A34A",
  sky: "#0284C7",
  teal: "#0D9488",
};

const SEV_COLOR: Record<string, string> = {
  Critical: "#991B1B",
  Major: COLORS.red,
  Medium: COLORS.amber,
  Minor: COLORS.sky,
  High: COLORS.red,
  Low: COLORS.sky,
};

const STATUS_COLOR: Record<string, string> = {
  Open: COLORS.red,
  Closed: COLORS.green,
  "In Progress": COLORS.amber,
  Deferred: COLORS.sub,
  Reopened: COLORS.accent,
};

const STATUS_OPTIONS = ["Open", "In Progress", "Closed", "Reopened", "Deferred"];
const SEVERITY_OPTIONS = ["Critical", "Major", "Medium", "Minor"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

const EDIT_ROLES: Role[] = ["Super Admin", "Admin", "QA Manager", "QA Lead"];
const canEdit = (role?: Role) => !!role && EDIT_ROLES.includes(role);

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

export function Defects() {
  const {
    defects,
    createDefect,
    updateDefect,
    deleteDefect,
    projects,
    updateProject,
    currentUser,
  } = useQAStore();

  // Role & Client Access Determination
  const isClient = currentUser?.role === "Client";
  const clientOrgName = currentUser?.client_name || "PathAxiom";
  const userAssignedProjects = currentUser?.assigned_projects || [];

  // Filter accessible projects based on role & client restriction
  const accessibleProjects = useMemo(() => {
    if (isClient) {
      return projects.filter(
        (p) =>
          (p.client_name && p.client_name.toLowerCase() === clientOrgName.toLowerCase()) ||
          userAssignedProjects.includes(p.code)
      );
    }
    if (currentUser?.role === "QA Engineer" && userAssignedProjects.length > 0) {
      return projects.filter((p) => userAssignedProjects.includes(p.code));
    }
    return projects;
  }, [projects, isClient, clientOrgName, userAssignedProjects, currentUser]);

  // Clients available for filtering
  const availableClients = useMemo(() => {
    if (isClient) return [clientOrgName];
    return Array.from(new Set(projects.map((p) => p.client_name).filter(Boolean)));
  }, [projects, isClient, clientOrgName]);

  // Filters State
  const [q, setQ] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>(isClient ? clientOrgName : "All");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [modFilter, setModFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showKpiCharts, setShowKpiCharts] = useState<boolean>(false);

  // Keep client locked for Client user
  useEffect(() => {
    if (isClient) {
      setSelectedClient(clientOrgName);
    }
  }, [isClient, clientOrgName]);

  // Reset project and module filter when client changes
  const handleClientChange = (clientVal: string) => {
    setSelectedClient(clientVal);
    setSelectedProject("All");
    setModFilter("All");
  };

  // Projects under currently selected client
  const projectsForClient = useMemo(() => {
    if (selectedClient === "All") return accessibleProjects;
    return accessibleProjects.filter(
      (p) => p.client_name.toLowerCase() === selectedClient.toLowerCase()
    );
  }, [accessibleProjects, selectedClient]);

  // Modules available under currently selected project(s)
  const availableModules = useMemo(() => {
    if (selectedProject !== "All") {
      const proj = accessibleProjects.find((p) => p.code === selectedProject || p.name === selectedProject);
      return proj ? proj.modules : [];
    }
    const set = new Set<string>();
    projectsForClient.forEach((p) => p.modules.forEach((m) => set.add(m)));
    defects.forEach((d) => set.add(d.module));
    return Array.from(set);
  }, [selectedProject, accessibleProjects, projectsForClient, defects]);

  // Base defects filtered by Client Access Restriction (Requirement 2)
  const accessibleDefects = useMemo(() => {
    if (isClient) {
      return defects.filter((d) => {
        const dClient = d.client_name || "";
        const matchesOrg = dClient.toLowerCase() === clientOrgName.toLowerCase();
        const matchesProject = accessibleProjects.some(
          (p) => p.code === d.project_code || p.name === d.project_name
        );
        return matchesOrg || matchesProject;
      });
    }
    if (currentUser?.role === "QA Engineer" && userAssignedProjects.length > 0) {
      return defects.filter((d) => userAssignedProjects.includes(d.project_code || ""));
    }
    return defects;
  }, [defects, isClient, clientOrgName, accessibleProjects, currentUser, userAssignedProjects]);

  // Fully Filtered Defects (respects search, client, project, module, severity, status, and date filter)
  const filtered = useMemo(() => {
    return accessibleDefects.filter((d) => {
      // Client filter
      if (selectedClient !== "All") {
        if ((d.client_name || "PathAxiom").toLowerCase() !== selectedClient.toLowerCase()) {
          return false;
        }
      }

      // Project filter
      if (selectedProject !== "All") {
        const matchesProj = d.project_code === selectedProject || d.project_name === selectedProject;
        if (!matchesProj) return false;
      }

      // Module filter
      if (modFilter !== "All" && d.module !== modFilter) return false;

      // Severity filter
      if (sevFilter !== "All" && d.severity !== sevFilter) return false;

      // Status filter
      if (statusFilter !== "All" && d.status !== statusFilter) return false;

      // Date Filter
      if (dateFilter !== "all") {
        if (d.created_at) {
          const dDate = new Date(d.created_at);
          if (!isNaN(dDate.getTime())) {
            const now = new Date();
            if (dateFilter === "today") {
              if (
                dDate.getFullYear() !== now.getFullYear() ||
                dDate.getMonth() !== now.getMonth() ||
                dDate.getDate() !== now.getDate()
              ) return false;
            } else if (dateFilter === "yesterday") {
              const yest = new Date(now);
              yest.setDate(now.getDate() - 1);
              if (
                dDate.getFullYear() !== yest.getFullYear() ||
                dDate.getMonth() !== yest.getMonth() ||
                dDate.getDate() !== yest.getDate()
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
              if (customStartDate) {
                const start = new Date(customStartDate + "T00:00:00");
                if (dDate < start) return false;
              }
              if (customEndDate) {
                const end = new Date(customEndDate + "T23:59:59");
                if (dDate > end) return false;
              }
            }
          }
        }
      }

      // Search Query
      if (q.trim()) {
        const search = q.toLowerCase();
        const inId = d.id.toLowerCase().includes(search);
        const inTitle = d.title.toLowerCase().includes(search);
        const inMod = d.module.toLowerCase().includes(search);
        const inFeat = (d.feature || "").toLowerCase().includes(search);
        const inProj = (d.project_name || "").toLowerCase().includes(search);
        const inAssignee = (d.assignee || "").toLowerCase().includes(search);
        if (!inId && !inTitle && !inMod && !inFeat && !inProj && !inAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [accessibleDefects, selectedClient, selectedProject, modFilter, sevFilter, statusFilter, dateFilter, customStartDate, customEndDate, q]);

  // Summary Metrics (dynamically computed from filtered)
  const criticalCount = filtered.filter((d) => d.severity === "Critical" || d.severity === "Major").length;
  const openCount = filtered.filter((d) => d.status === "Open" || d.status === "In Progress" || d.status === "Reopened").length;
  const closedCount = filtered.filter((d) => d.status === "Closed").length;

  // Dynamic KPI Charts Data from filtered defects
  const kpiSeverityData = useMemo(() => {
    return ["Critical", "Major", "Medium", "Minor"].map((s) => ({
      name: s,
      count: filtered.filter((d) => d.severity === s || (s === "Major" && d.severity === "High") || (s === "Minor" && d.severity === "Low")).length,
    }));
  }, [filtered]);

  const kpiStatusData = useMemo(() => {
    return ["Open", "In Progress", "Reopened", "Closed"].map((st) => ({
      name: st,
      count: filtered.filter((d) => d.status === st).length,
    })).filter((entry) => entry.count > 0);
  }, [filtered]);

  const kpiModuleData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((d) => {
      map[d.module] = (map[d.module] || 0) + 1;
    });
    return Object.entries(map)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filtered]);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showManageHierarchy, setShowManageHierarchy] = useState(false);
  const [editing, setEditing] = useState<Defect | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Defect | null>(null);

  // Compute next suggested Bug ID
  const nextIdGuess = useMemo(() => {
    const nums = defects
      .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    return `BUG-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  }, [defects]);

  // Form states for Add Defect
  const [formId, setFormId] = useState("");
  const [formClient, setFormClient] = useState("PathAxiom");
  const [formProjectCode, setFormProjectCode] = useState("PRJ-001");
  const [formModule, setFormModule] = useState("Admin Portal");
  const [formFeature, setFormFeature] = useState("General");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSeverity, setFormSeverity] = useState("Medium");
  const [formPriority, setPriority] = useState("Medium");
  const [formAssignee, setFormAssignee] = useState("QA Team");
  const [newModInput, setNewModInput] = useState("");
  const [showNewModField, setShowNewModField] = useState(false);
  const [newFeatInput, setNewFeatInput] = useState("");
  const [showNewFeatField, setShowNewFeatField] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Sync Add Defect Form when opening
  useEffect(() => {
    if (showAdd) {
      setFormId(nextIdGuess);
      setError("");
      setShowNewModField(false);
      setShowNewFeatField(false);

      const targetClient = isClient ? clientOrgName : selectedClient !== "All" ? selectedClient : (accessibleProjects[0]?.client_name || "PathAxiom");
      setFormClient(targetClient);

      const availForClient = accessibleProjects.filter((p) => p.client_name.toLowerCase() === targetClient.toLowerCase());
      const targetProj = selectedProject !== "All" ? selectedProject : (availForClient[0]?.code || accessibleProjects[0]?.code || "PRJ-001");
      setFormProjectCode(targetProj);

      const projObj = accessibleProjects.find((p) => p.code === targetProj);
      if (projObj && projObj.modules.length > 0) {
        const mod = projObj.modules[0];
        setFormModule(mod);
        const feats = projObj.features[mod] || [];
        setFormFeature(feats[0] || "General");
      }
    }
  }, [showAdd, nextIdGuess, isClient, clientOrgName, selectedClient, selectedProject, accessibleProjects]);

  // When formClient changes, update project code
  const handleFormClientChange = (c: string) => {
    setFormClient(c);
    const projs = accessibleProjects.filter((p) => p.client_name.toLowerCase() === c.toLowerCase());
    if (projs.length > 0) {
      setFormProjectCode(projs[0].code);
      if (projs[0].modules.length > 0) {
        const m = projs[0].modules[0];
        setFormModule(m);
        const feats = projs[0].features[m] || [];
        setFormFeature(feats[0] || "General");
      }
    }
  };

  // When formProjectCode changes, update modules and features
  const handleFormProjectChange = (code: string) => {
    setFormProjectCode(code);
    const proj = accessibleProjects.find((p) => p.code === code);
    if (proj && proj.modules.length > 0) {
      const m = proj.modules[0];
      setFormModule(m);
      const feats = proj.features[m] || [];
      setFormFeature(feats[0] || "General");
    }
  };

  // When formModule changes, update available features
  const handleFormModuleChange = (mod: string) => {
    setFormModule(mod);
    const proj = accessibleProjects.find((p) => p.code === formProjectCode);
    if (proj && proj.features[mod] && proj.features[mod].length > 0) {
      setFormFeature(proj.features[mod][0]);
    } else {
      setFormFeature("General");
    }
  };

  // Submit Add Defect
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formId.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      const activeProj = accessibleProjects.find((p) => p.code === formProjectCode);
      const activeProjName = activeProj?.name || "Assessment Platform";

      let finalModule = formModule.trim();
      let finalFeature = formFeature.trim();

      // If user typed a custom module on the fly
      if (showNewModField && newModInput.trim()) {
        finalModule = newModInput.trim();
        if (activeProj) {
          const updatedModules = Array.from(new Set([...activeProj.modules, finalModule]));
          const updatedFeatures = { ...activeProj.features, [finalModule]: [finalFeature || "Core"] };
          await updateProject(activeProj.id, { modules: updatedModules, features: updatedFeatures });
        }
      }

      // If user typed a custom feature on the fly
      if (showNewFeatField && newFeatInput.trim()) {
        finalFeature = newFeatInput.trim();
        if (activeProj) {
          const currentFeats = activeProj.features[finalModule] || [];
          const updatedFeats = Array.from(new Set([...currentFeats, finalFeature]));
          const updatedFeatures = { ...activeProj.features, [finalModule]: updatedFeats };
          await updateProject(activeProj.id, { features: updatedFeatures });
        }
      }

      await createDefect({
        id: formId.trim(),
        client_name: formClient,
        project_name: activeProjName,
        project_code: formProjectCode,
        module: finalModule,
        feature: finalFeature || "General",
        title: formTitle.trim(),
        description: formDesc.trim(),
        severity: formSeverity,
        priority: formPriority,
        status: "Open",
        assignee: formAssignee.trim() || "QA Team",
      });

      setFormTitle("");
      setFormDesc("");
      setShowAdd(false);
    } catch (err: any) {
      setError(err.message || "Failed to log defect");
    } finally {
      setBusy(false);
    }
  };

  // Submit Update Defect
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateDefect(editing.id, {
        title: editing.title,
        description: editing.description,
        client_name: editing.client_name,
        project_name: editing.project_name,
        project_code: editing.project_code,
        module: editing.module,
        feature: editing.feature,
        severity: editing.severity,
        priority: editing.priority,
        status: editing.status,
        assignee: editing.assignee,
      });
      setEditing(null);
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  // ==================== EXCEL EXPORT (Requirement 1) ====================
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert("No defects match the selected filters to export.");
      return;
    }

    const rows = filtered.map((d) => ({
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

    // Auto-fit column widths
    const colWidths = [
      { wch: 12 }, // Bug ID
      { wch: 18 }, // Client
      { wch: 26 }, // Project
      { wch: 14 }, // Code
      { wch: 18 }, // Module
      { wch: 20 }, // Feature
      { wch: 40 }, // Title
      { wch: 12 }, // Severity
      { wch: 10 }, // Priority
      { wch: 14 }, // Status
      { wch: 16 }, // Assignee
      { wch: 14 }, // Reporter
      { wch: 14 }, // Date
      { wch: 40 }, // Description
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bug Report");

    const dateStr = new Date().toISOString().slice(0, 10);
    const scopeTag = selectedProject !== "All" ? selectedProject : selectedClient !== "All" ? selectedClient : "All_Projects";
    const fileName = `QA_Bug_Report_${scopeTag}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  // ==================== PDF EXPORT (Requirement 1) ====================
  const handleExportPDF = () => {
    if (filtered.length === 0) {
      alert("No defects match the selected filters to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Header Title & Branding
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 18, "F");

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("QA TRACKER — OFFICIAL DEFECT & BUG AUDIT REPORT", 14, 12);

    doc.setFontSize(9);
    doc.setTextColor(224, 231, 255);
    doc.text(`Generated: ${dateStr}`, 235, 12);

    // Metadata & Filter Context Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 22, 269, 16, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Client Scope: ${selectedClient === "All" ? "All Organizations" : selectedClient}`, 18, 28);
    doc.text(`Project Scope: ${selectedProject === "All" ? "All Projects" : selectedProject}`, 85, 28);
    doc.text(`Module: ${modFilter}`, 165, 28);
    doc.text(`Severity: ${sevFilter} | Status: ${statusFilter} | Date: ${dateFilter}`, 210, 28);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Summary: ${filtered.length} Bugs Total · ${criticalCount} Critical/Major · ${openCount} Open · ${closedCount} Closed`,
      18,
      34
    );

    // AutoTable Body
    const tableBody = filtered.map((d) => [
      d.id,
      d.project_name || "Assessment Platform",
      d.module,
      d.feature || "General",
      d.title.length > 45 ? d.title.substring(0, 42) + "…" : d.title,
      d.severity,
      d.priority,
      d.status,
      d.assignee || "Unassigned",
      d.created_at ? new Date(d.created_at).toLocaleDateString() : "-",
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["Bug ID", "Project", "Module", "Feature", "Title", "Severity", "Priority", "Status", "Assignee", "Date"]],
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: "bold" },
        1: { cellWidth: 32 },
        2: { cellWidth: 26 },
        3: { cellWidth: 24 },
        4: { cellWidth: 65 },
        5: { cellWidth: 16 },
        6: { cellWidth: 14 },
        7: { cellWidth: 18 },
        8: { cellWidth: 22 },
        9: { cellWidth: 18 },
      },
      didParseCell: function (data) {
        // Highlight severity column
        if (data.section === "body" && data.column.index === 5) {
          const val = String(data.cell.raw);
          if (val === "Critical") {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Major") {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (val === "Medium") {
            data.cell.styles.textColor = [217, 119, 6];
          }
        }
      },
    });

    const scopeTag = selectedProject !== "All" ? selectedProject : selectedClient !== "All" ? selectedClient : "All_Projects";
    const fileName = `QA_Bug_Report_${scopeTag}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-4">
      {/* Client Access Notice Banner if logged in as Client */}
      {isClient && (
        <div
          className="px-4 py-3 rounded-xl border flex items-center justify-between text-xs"
          style={{ background: COLORS.accent2 + "12", borderColor: COLORS.accent2 + "40" }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} color={COLORS.accent2} />
            <span style={{ color: COLORS.ink }}>
              <b>Client Portal Active:</b> Logged in as <b>{currentUser?.name}</b> ({clientOrgName}). You have strict visibility over defects and projects belonging exclusively to your organization.
            </span>
          </div>
          <span
            className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider"
            style={{ background: COLORS.accent2 + "20", color: COLORS.accent2 }}
          >
            Client Isolated View
          </span>
        </div>
      )}

      {/* KPI Cards Row with Dynamic Graphs Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-indigo-600" />
            <span>Defect Metrics & KPI Status</span>
          </div>
          <button
            onClick={() => setShowKpiCharts(!showKpiCharts)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs cursor-pointer"
            style={{
              background: showKpiCharts ? COLORS.accent : COLORS.panel,
              color: showKpiCharts ? "#ffffff" : COLORS.accent,
              borderColor: showKpiCharts ? COLORS.accent : COLORS.border,
            }}
          >
            <BarChart3 size={13} />
            {showKpiCharts ? "Hide KPI Graphs" : "Dynamic KPI Graphs"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 shadow-sm" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: COLORS.sub }}>Filtered Defects</div>
            <div className="text-2xl font-bold mt-1" style={{ color: COLORS.ink }}>{filtered.length}</div>
            <div className="text-xs mt-1" style={{ color: COLORS.sub }}>In active query scope</div>
          </div>
          <div className="rounded-xl p-4 shadow-sm" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: COLORS.sub }}>Critical & Major</div>
            <div className="text-2xl font-bold mt-1" style={{ color: COLORS.red }}>{criticalCount}</div>
            <div className="text-xs mt-1" style={{ color: COLORS.sub }}>Requires urgent resolution</div>
          </div>
          <div className="rounded-xl p-4 shadow-sm" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: COLORS.sub }}>Open & In Progress</div>
            <div className="text-2xl font-bold mt-1" style={{ color: COLORS.amber }}>{openCount}</div>
            <div className="text-xs mt-1" style={{ color: COLORS.sub }}>Active investigation</div>
          </div>
          <div className="rounded-xl p-4 shadow-sm" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: COLORS.sub }}>Resolved / Closed</div>
            <div className="text-2xl font-bold mt-1" style={{ color: COLORS.green }}>{closedCount}</div>
            <div className="text-xs mt-1" style={{ color: COLORS.sub }}>Verified fixes</div>
          </div>
        </div>

        {/* Dynamic KPI Graphs Section (Live to Filters & Date) */}
        {showKpiCharts && (
          <div
            className="p-4 rounded-xl shadow-xs border bg-white grid grid-cols-1 md:grid-cols-3 gap-4"
            style={{ borderColor: COLORS.border }}
          >
            {/* Severity Breakdown Bar */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-800 block mb-1">Severity Breakdown</span>
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiSeverityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} stroke={COLORS.sub} />
                    <YAxis fontSize={10} tickLine={false} stroke={COLORS.sub} />
                    <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]}>
                      {kpiSeverityData.map((entry) => (
                        <Cell key={entry.name} fill={SEV_COLOR[entry.name] || COLORS.accent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Pie */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-800 block mb-1 self-start">Status Distribution</span>
              <div style={{ height: 115, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kpiStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="count">
                      {kpiStatusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || COLORS.sub} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-[10px] text-slate-600 mt-1">
                {kpiStatusData.map((entry) => (
                  <span key={entry.name} className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[entry.name] || COLORS.sub }} />
                    {entry.name}: {entry.count}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Modules in Scope */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-800 block mb-2">Top Affected Modules</span>
              <div className="space-y-1.5 text-xs">
                {kpiModuleData.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-4 text-center">No modules found in filter scope</p>
                ) : (
                  kpiModuleData.map((m) => (
                    <div key={m.module} className="flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-[150px] font-medium text-slate-700">{m.module}</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 font-bold text-indigo-700">
                        {m.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Filter and Action Bar */}
      <div
        className="p-4 rounded-xl shadow-sm space-y-3"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        {/* Top Controls: Search, Client, Project */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative min-w-[180px] max-w-xs">
              <Search size={14} color={COLORS.sub} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ID, title, module, feature…"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>

            {/* Client Filter (Disabled/Locked if role is Client) */}
            <div className="flex items-center gap-1">
              <Building2 size={13} color={COLORS.sub} />
              <select
                value={selectedClient}
                disabled={isClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer max-w-[160px] truncate"
                style={{
                  background: COLORS.panel2,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                  opacity: isClient ? 0.75 : 1,
                }}
                title={isClient ? "Client filter is locked to your organization" : "Filter by Client Organization"}
              >
                {!isClient && <option value="All">All Clients</option>}
                {availableClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-1">
              <FolderGit2 size={13} color={COLORS.sub} />
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setModFilter("All");
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer max-w-[190px] truncate font-medium"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                <option value="All">All Projects</option>
                {projectsForClient.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Module Filter (Cascading from Project) */}
            <div className="flex items-center gap-1">
              <Layers size={13} color={COLORS.sub} />
              <select
                value={modFilter}
                onChange={(e) => setModFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs outline-none max-w-[150px] truncate cursor-pointer"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                <option value="All">All Modules</option>
                {availableModules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons: Log Defect & Hierarchy Settings */}
          <div className="flex items-center gap-2">
            {!isClient && (
              <button
                onClick={() => setShowManageHierarchy(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                title="Manage Project Modules & Features"
              >
                <Settings2 size={13} color={COLORS.sub} />
                Modules & Features
              </button>
            )}

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: COLORS.accent }}
            >
              <Plus size={14} /> Log Defect
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Severity, Status & Download Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium mr-1" style={{ color: COLORS.sub }}>Filter By:</span>
            <select
              value={sevFilter}
              onChange={(e) => setSevFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              <option value="All">All Severities</option>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Filter by Date */}
            <div className="flex items-center gap-1">
              <Calendar size={13} color={COLORS.sub} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer font-medium"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                title="Filter Defects by Date Range"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded outline-none"
                />
                <span className="text-[10px] text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded outline-none"
                />
              </div>
            )}

            {(selectedProject !== "All" || (selectedClient !== "All" && !isClient) || modFilter !== "All" || sevFilter !== "All" || statusFilter !== "All" || dateFilter !== "all" || q.trim() !== "") && (
              <button
                onClick={() => {
                  if (!isClient) setSelectedClient("All");
                  setSelectedProject("All");
                  setModFilter("All");
                  setSevFilter("All");
                  setStatusFilter("All");
                  setDateFilter("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setQ("");
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset all filters to default"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <span className="text-xs ml-2" style={{ color: COLORS.sub }}>
              Showing <b>{filtered.length}</b> of <b>{accessibleDefects.length}</b> visible defects
            </span>
          </div>

          {/* DOWNLOAD BUG REPORT BUTTONS (Requirement 1) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Download Report:</span>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
              title="Download currently filtered bug list as Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              Excel (.xlsx)
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm"
              title="Download currently filtered bug list as PDF document (.pdf)"
            >
              <FileText size={14} className="text-rose-600" />
              PDF (.pdf)
            </button>
          </div>
        </div>
      </div>

      {/* Defects Table with Full Hierarchy */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                style={{
                  background: COLORS.panel2,
                  borderBottom: `1px solid ${COLORS.border}`,
                  color: COLORS.sub,
                }}
              >
                <th className="py-2.5 px-4 font-semibold">Bug ID</th>
                {!isClient && <th className="py-2.5 px-4 font-semibold">Client</th>}
                <th className="py-2.5 px-4 font-semibold">Project</th>
                <th className="py-2.5 px-4 font-semibold">Module / Category</th>
                <th className="py-2.5 px-4 font-semibold">Feature</th>
                <th className="py-2.5 px-4 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Title</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Assignee</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isClient ? 9 : 10} className="py-12 text-center text-xs" style={{ color: COLORS.sub }}>
                    No defects matching the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold" style={{ color: COLORS.accent }}>
                      {d.id}
                    </td>
                    {!isClient && (
                      <td className="py-2.5 px-4 font-medium" style={{ color: COLORS.ink }}>
                        {d.client_name || "PathAxiom"}
                      </td>
                    )}
                    <td className="py-2.5 px-4">
                      <span className="font-medium" style={{ color: COLORS.ink }}>
                        {d.project_name || "Assessment Platform"}
                      </span>
                      {d.project_code && (
                        <span className="block text-[10px] font-mono text-slate-400">
                          {d.project_code}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4" style={{ color: COLORS.ink }}>
                      {d.module}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {d.feature || "General"}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge color={SEV_COLOR[d.severity] || COLORS.sub}>{d.severity}</Badge>
                    </td>
                    <td
                      className="py-2.5 px-4 font-medium max-w-xs truncate"
                      style={{ color: COLORS.ink }}
                      title={d.title + (d.description ? `\n\n${d.description}` : "")}
                    >
                      {d.title}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: (STATUS_COLOR[d.status] || COLORS.sub) + "18",
                          color: STATUS_COLOR[d.status] || COLORS.sub,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: STATUS_COLOR[d.status] || COLORS.sub }}
                        />
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium" style={{ color: COLORS.ink }}>
                      {d.assignee || "Unassigned"}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(d)}
                          className="p-1 rounded hover:bg-slate-100"
                          style={{ color: COLORS.sub }}
                          title="Edit defect"
                        >
                          <Pencil size={13} />
                        </button>
                        {canEdit(currentUser?.role) && (
                          <button
                            onClick={() => setConfirmDelete(d)}
                            className="p-1 rounded hover:bg-red-50"
                            style={{ color: COLORS.red }}
                            title="Delete defect"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE DEFECT MODAL (Client -> Project -> Module -> Feature -> Bug) ==================== */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => {
            if (!busy) setShowAdd(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug size={16} color={COLORS.accent} />
                <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                  Log New Defect (Client → Project Hierarchy)
                </span>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ color: COLORS.sub }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              {/* Hierarchy Level 1: Client & Project */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Client Organization *
                  </label>
                  <select
                    value={formClient}
                    disabled={isClient}
                    onChange={(e) => handleFormClientChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {availableClients.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Assigned Project *
                  </label>
                  <select
                    value={formProjectCode}
                    onChange={(e) => handleFormProjectChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer font-medium"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {accessibleProjects
                      .filter((p) => p.client_name.toLowerCase() === formClient.toLowerCase())
                      .map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Hierarchy Level 2: Module/Category & Feature */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                      Module / Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewModField(!showNewModField)}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      {showNewModField ? "Select Existing" : "+ New Module"}
                    </button>
                  </div>
                  {showNewModField ? (
                    <input
                      required
                      value={newModInput}
                      onChange={(e) => setNewModInput(e.target.value)}
                      placeholder="e.g. Payment Gateway"
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  ) : (
                    <select
                      value={formModule}
                      onChange={(e) => handleFormModuleChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                      style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    >
                      {availableModules.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium" style={{ color: COLORS.sub }}>
                      Feature *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewFeatField(!showNewFeatField)}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      {showNewFeatField ? "Select Existing" : "+ New Feature"}
                    </button>
                  </div>
                  {showNewFeatField ? (
                    <input
                      required
                      value={newFeatInput}
                      onChange={(e) => setNewFeatInput(e.target.value)}
                      placeholder="e.g. 3D Secure Verification"
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    />
                  ) : (
                    <select
                      value={formFeature}
                      onChange={(e) => setFormFeature(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                      style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                    >
                      {(() => {
                        const proj = accessibleProjects.find((p) => p.code === formProjectCode);
                        const feats = (proj && proj.features[formModule]) || ["General", "Core Flow"];
                        return feats.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ));
                      })()}
                    </select>
                  )}
                </div>
              </div>

              {/* Bug ID & Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Defect ID *
                  </label>
                  <input
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="BUG-203"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Assignee
                  </label>
                  <input
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    placeholder="e.g. Frontend Team / Alex Vance"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                  Title *
                </label>
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Clear and concise summary of the issue"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                  Description / Steps to Reproduce
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Steps to reproduce, actual outcome vs expected outcome..."
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              {/* Severity & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Severity *
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Priority *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
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

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: COLORS.sub }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                  style={{ background: COLORS.accent, opacity: busy ? 0.7 : 1 }}
                >
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  {busy ? "Saving…" : "Log Defect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT DEFECT MODAL ==================== */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Edit Defect: {editing.id} ({editing.project_name || "Assessment Platform"})
              </span>
              <button onClick={() => setEditing(null)} style={{ color: COLORS.sub }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                  Title
                </label>
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Module / Category
                  </label>
                  <input
                    required
                    value={editing.module}
                    onChange={(e) => setEditing({ ...editing, module: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Feature
                  </label>
                  <input
                    value={editing.feature || ""}
                    onChange={(e) => setEditing({ ...editing, feature: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Severity
                  </label>
                  <select
                    value={editing.severity}
                    onChange={(e) => setEditing({ ...editing, severity: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Priority
                  </label>
                  <select
                    value={editing.priority}
                    onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                    Status
                  </label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg text-xs outline-none cursor-pointer"
                    style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: COLORS.sub }}>
                  Assignee
                </label>
                <input
                  value={editing.assignee || ""}
                  onChange={(e) => setEditing({ ...editing, assignee: e.target.value })}
                  placeholder="Assignee name or team"
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: COLORS.sub }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                  style={{ background: COLORS.accent }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MANAGE PROJECT HIERARCHY MODAL (Requirement 3) ==================== */}
      {showManageHierarchy && (
        <ManageHierarchyModal
          projects={accessibleProjects}
          onClose={() => setShowManageHierarchy(false)}
          onUpdateProject={updateProject}
        />
      )}

      {/* ==================== CONFIRM DELETE MODAL ==================== */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl p-5 shadow-2xl"
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.red} />
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Delete Defect {confirmDelete.id}?
              </span>
            </div>
            <p className="text-xs mb-5" style={{ color: COLORS.sub }}>
              Are you sure you want to permanently delete this defect record from PostgreSQL?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ color: COLORS.sub }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteDefect(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                style={{ background: COLORS.red }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for managing Project Modules and Features
// Sub-component for managing Project Modules and Features (Simple Single-Click Unified List)
function ManageHierarchyModal({
  projects,
  onClose,
  onUpdateProject,
}: {
  projects: Project[];
  onClose: () => void;
  onUpdateProject: (id: number, patch: Partial<Project>) => Promise<void>;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projects[0]?.id || 1);
  const activeProj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const [newModName, setNewModName] = useState("");
  const [featInputs, setFeatInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Add a new Module
  const handleAddModule = async () => {
    if (!newModName.trim() || !activeProj) return;
    const mod = newModName.trim();
    setSaving(true);
    try {
      const updatedModules = Array.from(new Set([...activeProj.modules, mod]));
      const updatedFeatures = {
        ...activeProj.features,
        [mod]: activeProj.features?.[mod] && activeProj.features[mod].length > 0 ? activeProj.features[mod] : ["General"],
      };
      await onUpdateProject(activeProj.id, {
        modules: updatedModules,
        features: updatedFeatures,
      });
      setNewModName("");
    } finally {
      setSaving(false);
    }
  };

  // Delete an entire Module
  const handleDeleteModule = async (modToDelete: string) => {
    if (!activeProj) return;
    if (!confirm(`Are you sure you want to delete module "${modToDelete}" and its features?`)) return;
    setSaving(true);
    try {
      const updatedModules = activeProj.modules.filter((m) => m !== modToDelete);
      const updatedFeatures = { ...activeProj.features };
      delete updatedFeatures[modToDelete];
      await onUpdateProject(activeProj.id, {
        modules: updatedModules,
        features: updatedFeatures,
      });
    } finally {
      setSaving(false);
    }
  };

  // Add Feature directly inside a Module
  const handleAddFeatureToModule = async (mod: string) => {
    const featVal = (featInputs[mod] || "").trim();
    if (!featVal || !activeProj) return;
    setSaving(true);
    try {
      const current = activeProj.features?.[mod] || [];
      const updatedFeats = Array.from(new Set([...current, featVal]));
      const updatedFeatures = { ...activeProj.features, [mod]: updatedFeats };
      await onUpdateProject(activeProj.id, { features: updatedFeatures });
      setFeatInputs((prev) => ({ ...prev, [mod]: "" }));
    } finally {
      setSaving(false);
    }
  };

  // Delete a single Feature tag
  const handleDeleteFeatureFromModule = async (mod: string, featToDelete: string) => {
    if (!activeProj) return;
    setSaving(true);
    try {
      const current = activeProj.features?.[mod] || [];
      const updatedFeats = current.filter((f) => f !== featToDelete);
      const updatedFeatures = { ...activeProj.features, [mod]: updatedFeats };
      await onUpdateProject(activeProj.id, { features: updatedFeatures });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col bg-white border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Structure (Modules & Features)</h3>
              <p className="text-[11px] text-slate-500">Add or remove modules and features directly in one simple list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Project Selector */}
        <div className="pt-3 pb-2">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code}) — Client: {p.client_name}
              </option>
            ))}
          </select>
        </div>

        {/* Single Quick-Add Bar for Modules */}
        {activeProj && (
          <div className="pt-2 pb-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={newModName}
                  onChange={(e) => setNewModName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddModule();
                    }
                  }}
                  placeholder="Enter new module name (e.g. Billing) and press Enter..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                disabled={saving || !newModName.trim()}
                onClick={handleAddModule}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                Add Module
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Single-Click Module & Feature List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
          {!activeProj || activeProj.modules.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Layers size={24} className="mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-medium text-slate-500">No modules in this project yet.</p>
              <p className="text-[11px] text-slate-400">Type a module name above and click "Add Module".</p>
            </div>
          ) : (
            activeProj.modules.map((m) => {
              const feats = (activeProj.features && activeProj.features[m]) || ["General"];
              const currentInput = featInputs[m] || "";

              return (
                <div
                  key={m}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
                >
                  {/* Module Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                        📁
                      </span>
                      <span className="font-bold text-xs text-slate-900">{m}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({feats.length} {feats.length === 1 ? "feature" : "features"})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteModule(m)}
                      title={`Delete module "${m}"`}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Feature Tags & Direct Inline Quick-Add */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    {feats.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-slate-200/80 transition-colors"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeatureFromModule(m, f)}
                          title={`Remove feature "${f}"`}
                          className="text-slate-400 hover:text-red-500 rounded p-0.5 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}

                    {/* Inline Feature Input */}
                    <div className="inline-flex items-center gap-1">
                      <input
                        value={currentInput}
                        onChange={(e) => setFeatInputs((prev) => ({ ...prev, [m]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFeatureToModule(m);
                          }
                        }}
                        placeholder="+ Add feature (Press Enter)..."
                        className="px-2.5 py-1 rounded-md text-[11px] bg-slate-50 border border-dashed border-slate-300 outline-none focus:bg-white focus:border-indigo-500 focus:border-solid w-44 placeholder:text-slate-400 transition-all"
                      />
                      {currentInput.trim() && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleAddFeatureToModule(m)}
                          className="px-1.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-medium shadow-xs cursor-pointer"
                          title="Add feature"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            💡 Type inside any module and press <b>Enter</b> to add features instantly.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default Defects;
