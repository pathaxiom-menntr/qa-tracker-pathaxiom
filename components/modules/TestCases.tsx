"use client";

import React, { useState, useMemo } from "react";
import {
  ListChecks,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  Bug,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  Shield,
  Activity,
  Check,
  AlertCircle,
  FolderGit2,
  Building2,
  Calendar,
  FileSpreadsheet,
  CornerDownRight,
  Info,
  CheckSquare,
  Square,
  FastForward,
} from "lucide-react";
import { useQAStore } from "@/lib/store";
import {
  Portal,
  TestRun,
  TestCaseExecution,
  TestCaseStatus,
  Project,
} from "@/lib/types";

const COLORS = {
  bg: "#F8FAFC",
  panel: "#FFFFFF",
  panel2: "#F1F5F9",
  panel3: "#E2E8F0",
  border: "#E2E8F0",
  ink: "#0F172A",
  sub: "#64748B",
  accent: "#6366F1",
  accentHover: "#4F46E5",
  teal: "#0D9488",
  emerald: "#10B981",
  rose: "#EF4444",
  amber: "#F59E0B",
  sky: "#0284C7",
  indigo: "#4F46E5",
  purple: "#8B5CF6",
  slate: "#64748B",
};

// Reusable Circular Progress Ring for Execution Status
function CircularProgressRing({
  percentage,
  size = 110,
  strokeWidth = 9,
  executed,
  total,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  executed: number;
  total: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = COLORS.accent;
  if (percentage === 100) strokeColor = COLORS.emerald;
  else if (percentage > 50) strokeColor = COLORS.indigo;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
          {percentage}%
        </span>
        <span className="text-[10px] font-medium" style={{ color: COLORS.sub }}>
          {executed}/{total} Done
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: TestCaseStatus }) {
  switch (status) {
    case "Passed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Passed
        </span>
      );
    case "Failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={13} className="text-rose-600" />
          Failed
        </span>
      );
    case "Blocked":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={13} className="text-amber-600" />
          Blocked
        </span>
      );
    case "Skipped":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <FastForward size={13} className="text-slate-500" />
          Skipped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
          <Clock size={13} className="text-slate-400" />
          Untested
        </span>
      );
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    Medium: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    Low: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  };
  const c = map[priority] || map.Low;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {priority}
    </span>
  );
}

function EnvironmentBadge({ env }: { env: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    Production: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    Staging: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    UAT: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    "QA / Dev": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  };
  const c = map[env] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {env}
    </span>
  );
}

function RunProgressBar({
  passed,
  failed,
  blocked,
  skipped,
  untested,
  total,
}: {
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  untested: number;
  total: number;
}) {
  const t = total || 1;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
      <div style={{ width: `${(passed / t) * 100}%` }} className="bg-emerald-500 transition-all duration-300" title={`Passed: ${passed}`} />
      <div style={{ width: `${(failed / t) * 100}%` }} className="bg-rose-500 transition-all duration-300" title={`Failed: ${failed}`} />
      <div style={{ width: `${(blocked / t) * 100}%` }} className="bg-amber-500 transition-all duration-300" title={`Blocked: ${blocked}`} />
      <div style={{ width: `${(skipped / t) * 100}%` }} className="bg-slate-400 transition-all duration-300" title={`Skipped: ${skipped}`} />
      <div style={{ width: `${(untested / t) * 100}%` }} className="bg-slate-200 transition-all duration-300" title={`Untested: ${untested}`} />
    </div>
  );
}

export function TestCases({ onNavigate }: { onNavigate?: (moduleKey: string) => void }) {
  const {
    testRuns,
    createTestRun,
    updateTestRun,
    deleteTestRun,
    restoreTestRun,
    purgeTestRun,
    executeTestCase,
    projects,
    users,
    createDefect,
    defects,
    portals,
    createPortal,
    deletePortal,
    restorePortal,
    purgePortal,
    currentUser,
  } = useQAStore();

  // Active top-level sub-tab
  const [activeTab, setActiveTab] = useState<"runs" | "repository" | "portals">("runs");

  // Recycle bin sub-tab states
  const [runSubTab, setRunSubTab] = useState<"active" | "trash">("active");
  const [portalSubTab, setPortalSubTab] = useState<"active" | "trash">("active");

  // Deletion modals state
  const [runToDelete, setRunToDelete] = useState<TestRun | null>(null);
  const [runToPurge, setRunToPurge] = useState<TestRun | null>(null);
  const [portalToDelete, setPortalToDelete] = useState<Portal | null>(null);
  const [portalToPurge, setPortalToPurge] = useState<Portal | null>(null);

  // Selected test run for active execution
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  // Filters for test runs list
  const [runSearch, setRunSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filters within active test run execution table
  const [caseSearch, setCaseSearch] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState<TestCaseStatus | "All">("All");
  const [caseModuleFilter, setCaseModuleFilter] = useState("All");

  // Expanded rows in test cases table
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});

  // Modals state
  const [showCreateRunModal, setShowCreateRunModal] = useState(false);
  const [showLogDefectModal, setShowLogDefectModal] = useState(false);
  const [defectTargetCase, setDefectTargetCase] = useState<{
    run: TestRun;
    testCase: TestCaseExecution;
  } | null>(null);

  // Form states for Create Test Run
  const [newRunTitle, setNewRunTitle] = useState("");
  const [newRunProject, setNewRunProject] = useState(projects[0]?.name || "Assessment Platform");
  const [newRunEnv, setNewRunEnv] = useState<"Staging" | "Production" | "UAT" | "QA / Dev">("Staging");
  const [newRunAssignee, setNewRunAssignee] = useState(users[0]?.name || "Alex Vance");
  const [newRunSummary, setNewRunSummary] = useState("");
  const [newRunSuiteTemplate, setNewRunSuiteTemplate] = useState<"standard" | "payment" | "blank">("standard");

  // Form states for Log Defect from Failed Test
  const [defectTitle, setDefectTitle] = useState("");
  const [defectSeverity, setDefectSeverity] = useState("Critical");
  const [defectPriority, setDefectPriority] = useState("High");
  const [defectModule, setDefectModule] = useState("");
  const [defectDesc, setDefectDesc] = useState("");
  const [defectAssignee, setDefectAssignee] = useState("Alex Vance");

  // Inline notes or actual result edits
  const [editingActualResult, setEditingActualResult] = useState<Record<string, string>>({});

  // Portals sub-tab state
  const [portal, setPortal] = useState("All");
  const [showAddPortal, setShowAddPortal] = useState(false);
  const [newPortalName, setNewPortalName] = useState("");
  const [portalError, setPortalError] = useState("");

  // Active vs Deleted pools
  const activeTestRuns = useMemo(() => testRuns.filter((r) => !r.is_deleted), [testRuns]);
  const deletedTestRuns = useMemo(() => testRuns.filter((r) => !!r.is_deleted), [testRuns]);
  const activePortals = useMemo(() => portals.filter((p) => !p.is_deleted), [portals]);
  const deletedPortals = useMemo(() => portals.filter((p) => !!p.is_deleted), [portals]);

  const currentRunsPool = runSubTab === "active" ? activeTestRuns : deletedTestRuns;

  // Determine active run
  const activeRun = useMemo(() => {
    if (currentRunsPool.length === 0) return null;
    if (selectedRunId !== null) {
      const found = currentRunsPool.find((r) => r.id === selectedRunId);
      if (found) return found;
    }
    return currentRunsPool[0];
  }, [currentRunsPool, selectedRunId]);

  // Filter test runs
  const filteredRuns = useMemo(() => {
    return currentRunsPool.filter((r) => {
      const matchSearch =
        runSearch === "" ||
        r.title.toLowerCase().includes(runSearch.toLowerCase()) ||
        r.run_id.toLowerCase().includes(runSearch.toLowerCase()) ||
        r.project_name.toLowerCase().includes(runSearch.toLowerCase());
      const matchEnv = envFilter === "All" || r.environment === envFilter;
      const matchProject = projectFilter === "All" || r.project_name === projectFilter;
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchEnv && matchProject && matchStatus;
    });
  }, [currentRunsPool, runSearch, envFilter, projectFilter, statusFilter]);

  // Compute metrics for active run
  const runMetrics = useMemo(() => {
    if (!activeRun) {
      return { total: 0, passed: 0, failed: 0, blocked: 0, skipped: 0, untested: 0, executed: 0, percentage: 0 };
    }
    const cases = activeRun.test_cases || [];
    const total = cases.length;
    const passed = cases.filter((c) => c.status === "Passed").length;
    const failed = cases.filter((c) => c.status === "Failed").length;
    const blocked = cases.filter((c) => c.status === "Blocked").length;
    const skipped = cases.filter((c) => c.status === "Skipped").length;
    const untested = cases.filter((c) => c.status === "Untested").length;
    const executed = total - untested;
    const percentage = total > 0 ? Math.round((executed / total) * 100) : 0;
    return { total, passed, failed, blocked, skipped, untested, executed, percentage };
  }, [activeRun]);

  // Extract distinct modules from active run
  const runModules = useMemo(() => {
    if (!activeRun?.test_cases) return [];
    const set = new Set<string>();
    activeRun.test_cases.forEach((tc) => {
      if (tc.module) set.add(tc.module);
    });
    return Array.from(set);
  }, [activeRun]);

  // Filter test cases in active run
  const filteredCases = useMemo(() => {
    if (!activeRun?.test_cases) return [];
    return activeRun.test_cases.filter((tc) => {
      const matchSearch =
        caseSearch === "" ||
        tc.id.toLowerCase().includes(caseSearch.toLowerCase()) ||
        tc.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
        tc.expectedResult.toLowerCase().includes(caseSearch.toLowerCase()) ||
        (tc.notes && tc.notes.toLowerCase().includes(caseSearch.toLowerCase()));
      const matchStatus = caseStatusFilter === "All" || tc.status === caseStatusFilter;
      const matchModule = caseModuleFilter === "All" || tc.module === caseModuleFilter;
      return matchSearch && matchStatus && matchModule;
    });
  }, [activeRun, caseSearch, caseStatusFilter, caseModuleFilter]);

  // 1-Click Execution Handler
  const handleExecute = (tcId: string, status: TestCaseStatus) => {
    if (!activeRun) return;
    executeTestCase(activeRun.id, tcId, status);
  };

  // Toggle row expansion
  const toggleRow = (tcId: string) => {
    setExpandedCases((prev) => ({ ...prev, [tcId]: !prev[tcId] }));
  };

  // Open Log Defect Modal
  const openLogDefect = (tc: TestCaseExecution) => {
    if (!activeRun) return;
    setDefectTargetCase({ run: activeRun, testCase: tc });
    setDefectTitle(`[Failed: ${tc.id}] ${tc.title}`);
    setDefectSeverity(tc.priority === "Critical" ? "Critical" : tc.priority === "High" ? "Major" : "Moderate");
    setDefectPriority(tc.priority);
    setDefectModule(tc.module);
    setDefectAssignee(activeRun.assigned_to || "Alex Vance");

    const stepsFormatted = (tc.steps || []).map((s, idx) => `${idx + 1}. ${s}`).join("\n");
    const desc = `Observed failure during ${activeRun.title} (${activeRun.run_id}) on ${activeRun.environment}.\n\nSteps to Reproduce:\n${stepsFormatted}\n\nExpected Result:\n${tc.expectedResult}\n\nActual Result:\n${tc.actualResult || "Execution returned unexpected error or condition."}\n\nPreconditions:\n${tc.preconditions || "None"}`;
    setDefectDesc(desc);
    setShowLogDefectModal(true);
  };

  // Save Defect from Failed Test Case
  const handleSaveDefect = async () => {
    if (!defectTargetCase || !defectTitle.trim()) return;
    const { run, testCase } = defectTargetCase;

    // Generate defect ID
    const nums = defects
      .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 40;
    const defectId = `DEF-${String(nextNum).padStart(3, "0")}`;

    await createDefect({
      id: defectId,
      title: defectTitle.trim(),
      client_name: run.client_name,
      project_name: run.project_name,
      project_code: run.project_code,
      module: defectModule || testCase.module,
      feature: testCase.feature || "Test Execution",
      severity: defectSeverity,
      priority: defectPriority,
      description: defectDesc,
      status: "New",
      assignee: defectAssignee,
    });

    // Link defect ID back to the test case row
    await executeTestCase(
      run.id,
      testCase.id,
      "Failed",
      testCase.actualResult || "Defect logged and linked",
      testCase.notes,
      defectId
    );

    setShowLogDefectModal(false);
    setDefectTargetCase(null);
  };

  // Create New Test Run Form Submit
  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunTitle.trim()) return;

    const proj = projects.find((p) => p.name === newRunProject);
    const clientName = proj?.client_name || "PathAxiom";
    const projectCode = proj?.code || "PRJ-001";

    let testCasesBundle: TestCaseExecution[] = [];

    if (newRunSuiteTemplate === "standard") {
      testCasesBundle = [
        {
          id: `TC-${Math.floor(100 + Math.random() * 800)}`,
          title: "Verify candidate identity verification and camera permissions check",
          module: "Assessment Flow",
          feature: "Proctoring",
          type: "Smoke",
          priority: "Critical",
          preconditions: "User has granted browser camera access",
          steps: [
            "Launch proctored test session",
            "Allow camera and microphone access prompt",
            "Verify real-time video preview feed renders in canvas",
          ],
          expectedResult: "Video stream starts with valid frame rate; candidate verified.",
          status: "Untested",
        },
        {
          id: `TC-${Math.floor(100 + Math.random() * 800)}`,
          title: "Multi-language code submission compiles and executes against test assertions",
          module: "Coding Worker",
          feature: "Execution Sandbox",
          type: "Functional",
          priority: "Critical",
          preconditions: "Candidate on active coding problem",
          steps: [
            "Select Python 3 runtime",
            "Implement solution satisfying all edge cases",
            "Click Run Code Tests",
          ],
          expectedResult: "All 5 assertion test cases pass within 1200ms; stdout displayed cleanly.",
          status: "Untested",
        },
        {
          id: `TC-${Math.floor(100 + Math.random() * 800)}`,
          title: "Session timeout and token invalidation on 30-minute inactivity",
          module: "Admin Portal",
          feature: "Security / Session",
          type: "Security",
          priority: "High",
          preconditions: "Logged in as Admin or Evaluator",
          steps: [
            "Simulate 30 minutes of idle time without user interaction",
            "Attempt background fetch to /api/candidates",
          ],
          expectedResult: "Session expires with modal notification and redirects to /login.",
          status: "Untested",
        },
        {
          id: `TC-${Math.floor(100 + Math.random() * 800)}`,
          title: "PDF report export formatting for high-volume assessment cohort",
          module: "Analytics",
          feature: "Export Engine",
          type: "Regression",
          priority: "Medium",
          preconditions: "Cohort with 100+ evaluated submissions",
          steps: [
            "Open Analytics > Cohort Summary",
            "Click Export Comprehensive PDF Report",
          ],
          expectedResult: "PDF downloads cleanly without clipped charts or page overflow errors.",
          status: "Untested",
        },
      ];
    } else if (newRunSuiteTemplate === "payment") {
      testCasesBundle = [
        {
          id: `TC-${Math.floor(100 + Math.random() * 800)}`,
          title: "3D Secure 2.0 challenge flow completes successfully with OTP verification",
          module: "Checkout UI",
          feature: "3DS Redirect",
          type: "Smoke",
          priority: "Critical",
          steps: ["Input enrolled Visa card", "Complete bank OTP challenge", "Confirm redirect"],
          expectedResult: "Redirects to order confirmation with 200 OK webhook logged.",
          status: "Untested",
        },
        {
          id: `TC-${Math.floor(100 + Math.random() * 800)}`,
          title: "Webhook listener idempotency guarantees zero duplicate ledger debits",
          module: "Webhook Engine",
          feature: "Stripe Sync",
          type: "Regression",
          priority: "High",
          steps: ["Fire duplicate invoice.payment_succeeded events", "Verify ledger balances"],
          expectedResult: "Second webhook acknowledged with 200 without duplicate entry.",
          status: "Untested",
        },
      ];
    }

    const created = await createTestRun({
      title: newRunTitle.trim(),
      project_name: newRunProject,
      project_code: projectCode,
      client_name: clientName,
      environment: newRunEnv,
      status: "In Progress",
      assigned_to: newRunAssignee,
      created_by: "Alex Vance",
      summary: newRunSummary.trim(),
      test_cases: testCasesBundle,
    });

    if (created?.id) {
      setSelectedRunId(created.id);
    }

    setShowCreateRunModal(false);
    setNewRunTitle("");
    setNewRunSummary("");
  };

  // Portals Tab functions
  const handleAddPortal = () => {
    const name = newPortalName.trim();
    if (!name) {
      setPortalError("Please enter a portal name.");
      return;
    }
    if (portals.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setPortalError("This portal already exists.");
      return;
    }
    createPortal(name);
    setPortal(name);
    setNewPortalName("");
    setShowAddPortal(false);
  };

  const handleDeletePortal = () => {
    if (portal === "All") return;
    const target = activePortals.find((p) => p.name === portal);
    if (!target) return;
    setPortalToDelete(target);
  };

  const currentPortalsPool = portalSubTab === "active" ? activePortals : deletedPortals;
  const filteredPortals = portal === "All" ? currentPortalsPool : currentPortalsPool.filter((p) => p.name === portal);

  return (
    <div className="space-y-6">
      {/* Top Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab("runs")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === "runs" ? COLORS.panel : "transparent",
              color: activeTab === "runs" ? COLORS.accent : COLORS.sub,
              boxShadow: activeTab === "runs" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Activity size={15} />
            <span>Test Runs & Execution Cycles</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: activeTab === "runs" ? COLORS.accent + "18" : "#E2E8F0",
                color: activeTab === "runs" ? COLORS.accent : COLORS.sub,
              }}
            >
              {testRuns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("repository")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === "repository" ? COLORS.panel : "transparent",
              color: activeTab === "repository" ? COLORS.accent : COLORS.sub,
              boxShadow: activeTab === "repository" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <ListChecks size={15} />
            <span>Test Case Repository</span>
          </button>

          <button
            onClick={() => setActiveTab("portals")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === "portals" ? COLORS.panel : "transparent",
              color: activeTab === "portals" ? COLORS.accent : COLORS.sub,
              boxShadow: activeTab === "portals" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Layers size={15} />
            <span>Portals & Architecture</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
              {portals.length}
            </span>
          </button>
        </div>

        {activeTab === "runs" && (
          <button
            onClick={() => setShowCreateRunModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-95"
            style={{ background: COLORS.accent }}
          >
            <Plus size={15} />
            <span>New Test Run</span>
          </button>
        )}
      </div>

      {/* ===================== TAB 1: TEST RUNS & EXECUTION CYCLES ===================== */}
      {activeTab === "runs" && (
        <div className="space-y-6">
          {/* Filter & Run Selector Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 space-y-3">
              {/* Sub-tabs: Active Cycles vs Recycle Bin */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRunSubTab("active")}
                  className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: runSubTab === "active" ? "#FFFFFF" : "transparent",
                    color: runSubTab === "active" ? COLORS.ink : COLORS.sub,
                    boxShadow: runSubTab === "active" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <Activity size={13} className={runSubTab === "active" ? "text-indigo-600" : "text-slate-400"} />
                  <span>Active ({activeTestRuns.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRunSubTab("trash")}
                  className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: runSubTab === "trash" ? "#FFFFFF" : "transparent",
                    color: runSubTab === "trash" ? "#DC2626" : COLORS.sub,
                    boxShadow: runSubTab === "trash" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <Trash2 size={13} className={runSubTab === "trash" ? "text-rose-600" : "text-slate-400"} />
                  <span>Recycle Bin ({deletedTestRuns.length})</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {runSubTab === "active" ? "Active Cycles" : "Recycle Bin Cycles"} ({filteredRuns.length})
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {runSubTab === "active" ? `${activeTestRuns.filter((r) => r.status === "In Progress").length} in progress` : `${deletedTestRuns.length} preserved`}
                </span>
              </div>

              {/* Run search & mini filters */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search test runs..."
                  value={runSearch}
                  onChange={(e) => setRunSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <select
                    value={envFilter}
                    onChange={(e) => setEnvFilter(e.target.value)}
                    className={`w-full appearance-none pl-3 pr-7 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                      envFilter !== "All"
                        ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                        : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
                    } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
                  >
                    <option value="All">All Envs</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="UAT">UAT</option>
                    <option value="QA / Dev">QA / Dev</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600"
                  />
                </div>

                <div className="relative flex-1 group">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full appearance-none pl-3 pr-7 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                      statusFilter !== "All"
                        ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                        : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
                    } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
                  >
                    <option value="All">All Status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600"
                  />
                </div>
              </div>

              {/* Scrollable Test Runs List */}
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {filteredRuns.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No execution cycles matching filters.
                  </div>
                ) : (
                  filteredRuns.map((r) => {
                    const isSelected = activeRun?.id === r.id;
                    const cases = r.test_cases || [];
                    const passed = cases.filter((c) => c.status === "Passed").length;
                    const failed = cases.filter((c) => c.status === "Failed").length;
                    const blocked = cases.filter((c) => c.status === "Blocked").length;
                    const skipped = cases.filter((c) => c.status === "Skipped").length;
                    const untested = cases.filter((c) => c.status === "Untested").length;
                    const total = cases.length;
                    const pct = total > 0 ? Math.round(((total - untested) / total) * 100) : 0;

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRunId(r.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white shadow-md ring-2 ring-indigo-500/30 border-indigo-500"
                            : "bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                        style={{ borderColor: isSelected ? COLORS.accent : COLORS.border }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold font-mono tracking-tight text-indigo-600">
                            {r.run_id}
                          </span>
                          <EnvironmentBadge env={r.environment} />
                        </div>

                        <div className="text-xs font-bold line-clamp-1 mb-1" style={{ color: COLORS.ink }}>
                          {r.title}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2.5 truncate">
                          <span>{r.project_name}</span>
                          <span>·</span>
                          <span className="text-slate-400">{r.client_name}</span>
                        </div>

                        <RunProgressBar
                          passed={passed}
                          failed={failed}
                          blocked={blocked}
                          skipped={skipped}
                          untested={untested}
                          total={total}
                        />

                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-2">
                          <span className="text-indigo-600 font-semibold">{pct}% Executed</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-semibold">{passed}P</span>
                            <span className="text-rose-600 font-semibold">{failed}F</span>
                            <span className="text-amber-600 font-semibold">{blocked}B</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Execution Workspace for Selected Run */}
            <div className="lg:col-span-3 space-y-5">
              {activeRun ? (
                <>
                  {/* Active Run Overview Banner */}
                  <div
                    className="p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                    style={{ background: COLORS.panel, borderColor: COLORS.border }}
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {activeRun.run_id}
                          </span>
                          <EnvironmentBadge env={activeRun.environment} />
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                              activeRun.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : activeRun.status === "Blocked"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {activeRun.status}
                          </span>
                          {activeRun.is_deleted && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Trash2 size={12} />
                              In Recycle Bin
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Delete / Restore */}
                        <div>
                          {activeRun.is_deleted ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => restoreTestRun(activeRun.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              >
                                <RotateCcw size={13} />
                                Restore Cycle
                              </button>
                              <button
                                type="button"
                                onClick={() => setRunToPurge(activeRun)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                              >
                                <Trash2 size={13} />
                                Permanently Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRunToDelete(activeRun)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all"
                              title="Move to Recycle Bin"
                            >
                              <Trash2 size={13} />
                              Move to Recycle Bin
                            </button>
                          )}
                        </div>
                      </div>

                      <h2 className="text-lg font-bold tracking-tight" style={{ color: COLORS.ink }}>
                        {activeRun.title}
                      </h2>

                      {activeRun.summary && (
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl leading-relaxed">
                          {activeRun.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <FolderGit2 size={13} className="text-slate-400" />
                          <span className="font-medium text-slate-700">{activeRun.project_name}</span>
                          <span className="text-slate-400">({activeRun.client_name})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>Assignee: <b>{activeRun.assigned_to || "Alex Vance"}</b></span>
                        </div>
                        {activeRun.completed_at && (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <CheckCircle2 size={13} />
                            <span>Completed on {new Date(activeRun.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Circular Live Progress Ring */}
                    <div className="flex items-center gap-6 shrink-0 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <CircularProgressRing
                        percentage={runMetrics.percentage}
                        executed={runMetrics.executed}
                        total={runMetrics.total}
                      />

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-xs text-slate-600">
                            Passed: <b>{runMetrics.passed}</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span className="text-xs text-slate-600">
                            Failed: <b>{runMetrics.failed}</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-xs text-slate-600">
                            Blocked: <b>{runMetrics.blocked}</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <span className="text-xs text-slate-600">
                            Skipped: <b>{runMetrics.skipped}</b>
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                          Untested queue: <b>{runMetrics.untested}</b> tests
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeRun.is_deleted && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-amber-900">
                            Execution Cycle in Recycle Bin
                          </div>
                          <div className="text-[11px] text-amber-700">
                            This test run was soft-deleted. It will NOT be deleted automatically and can be restored at any time.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => restoreTestRun(activeRun.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                        >
                          <RotateCcw size={13} />
                          Restore Now
                        </button>
                        <button
                          type="button"
                          onClick={() => setRunToPurge(activeRun)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          Permanently Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Filter & Search Bar within active run */}
                  <div
                    className="p-3.5 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3.5 shadow-2xs"
                    style={{ background: COLORS.panel, borderColor: COLORS.border }}
                  >
                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                      <div className="relative flex-1 md:w-72">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Filter tests by ID, steps, title..."
                          value={caseSearch}
                          onChange={(e) => setCaseSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
                        />
                      </div>

                      {/* Module filter */}
                      <div className="relative group">
                        <Layers
                          size={13}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                            caseModuleFilter !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <select
                          value={caseModuleFilter}
                          onChange={(e) => setCaseModuleFilter(e.target.value)}
                          className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl border outline-none cursor-pointer transition-all shadow-2xs ${
                            caseModuleFilter !== "All"
                              ? "bg-indigo-50/60 border-indigo-200 text-indigo-950 font-semibold"
                              : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/90 text-slate-700 hover:border-slate-300"
                          } focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15`}
                        >
                          <option value="All">All Modules</option>
                          {runModules.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={13}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                            caseModuleFilter !== "All" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Status Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                      {(["All", "Untested", "Passed", "Failed", "Blocked", "Skipped"] as const).map((st) => {
                        const active = caseStatusFilter === st;
                        return (
                          <button
                            key={st}
                            onClick={() => setCaseStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                              active
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:border-slate-300"
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Test Cases Execution Table */}
                  <div
                    className="rounded-2xl border overflow-hidden shadow-xs"
                    style={{ background: COLORS.panel, borderColor: COLORS.border }}
                  >
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Test Cases in Execution Cycle ({filteredCases.length})</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        1-Click execution records results in real-time
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredCases.length === 0 ? (
                        <div className="p-10 text-center text-xs text-slate-400">
                          No test cases match the applied filters.
                        </div>
                      ) : (
                        filteredCases.map((tc) => {
                          const isExpanded = !!expandedCases[tc.id];

                          return (
                            <div key={tc.id} className="transition-all hover:bg-slate-50/60">
                              {/* Primary Row */}
                              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Left info */}
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <button
                                    onClick={() => toggleRow(tc.id)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 mt-0.5 transition-all"
                                  >
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </button>

                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                        {tc.id}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                        {tc.module}
                                      </span>
                                      <PriorityBadge priority={tc.priority} />
                                      {tc.type && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                          {tc.type}
                                        </span>
                                      )}
                                    </div>

                                    <h4
                                      onClick={() => toggleRow(tc.id)}
                                      className="text-xs font-semibold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                                    >
                                      {tc.title}
                                    </h4>

                                    {/* Linked Defect Pill */}
                                    {tc.defectId && (
                                      <div className="flex items-center gap-1.5 pt-0.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          <Bug size={12} className="text-rose-600" />
                                          Linked Defect: {tc.defectId}
                                        </span>
                                        {onNavigate && (
                                          <button
                                            onClick={() => onNavigate("defects")}
                                            className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                                          >
                                            View Defect <ExternalLink size={10} />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right 1-Click Action Buttons & Status */}
                                <div className="flex items-center gap-3 shrink-0 self-end md:self-center flex-wrap">
                                  {/* 1-Click Execution Buttons */}
                                  <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1">
                                    <button
                                      title="Mark as Passed"
                                      onClick={() => handleExecute(tc.id, "Passed")}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        tc.status === "Passed"
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                      }`}
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>Pass</span>
                                    </button>

                                    <button
                                      title="Mark as Failed"
                                      onClick={() => handleExecute(tc.id, "Failed")}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        tc.status === "Failed"
                                          ? "bg-rose-600 text-white shadow-xs"
                                          : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                                      }`}
                                    >
                                      <XCircle size={13} />
                                      <span>Fail</span>
                                    </button>

                                    <button
                                      title="Mark as Blocked"
                                      onClick={() => handleExecute(tc.id, "Blocked")}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        tc.status === "Blocked"
                                          ? "bg-amber-600 text-white shadow-xs"
                                          : "text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                                      }`}
                                    >
                                      <AlertTriangle size={13} />
                                      <span>Block</span>
                                    </button>

                                    <button
                                      title="Mark as Skipped"
                                      onClick={() => handleExecute(tc.id, "Skipped")}
                                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                        tc.status === "Skipped"
                                          ? "bg-slate-600 text-white shadow-xs"
                                          : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                      }`}
                                    >
                                      <FastForward size={12} />
                                      <span>Skip</span>
                                    </button>

                                    <button
                                      title="Reset to Untested"
                                      onClick={() => handleExecute(tc.id, "Untested")}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                                    >
                                      <RotateCcw size={13} />
                                    </button>
                                  </div>

                                  {/* Log Defect Button for Failed Tests without an existing defect */}
                                  {tc.status === "Failed" && !tc.defectId && (
                                    <button
                                      onClick={() => openLogDefect(tc)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all animate-pulse"
                                    >
                                      <Bug size={13} />
                                      <span>Log Defect</span>
                                    </button>
                                  )}

                                  <StatusPill status={tc.status} />
                                </div>
                              </div>

                              {/* Expanded Test Execution Details Drawer */}
                              {isExpanded && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-4 text-xs">
                                  {tc.preconditions && (
                                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                      <span className="font-semibold text-slate-600 block mb-1">Preconditions:</span>
                                      <p className="text-slate-700">{tc.preconditions}</p>
                                    </div>
                                  )}

                                  {/* Steps Checklist */}
                                  <div className="space-y-1.5">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                      <ListChecks size={14} className="text-indigo-600" />
                                      Execution Steps:
                                    </span>
                                    <div className="space-y-1 pl-1">
                                      {tc.steps?.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-slate-700">
                                          <span className="font-mono font-bold text-indigo-600 shrink-0">
                                            {idx + 1}.
                                          </span>
                                          <span>{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Expected vs Actual Result */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                        Expected Result:
                                      </span>
                                      <p className="text-slate-600 text-xs leading-relaxed">{tc.expectedResult}</p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                        <Activity size={13} className="text-indigo-600" />
                                        Actual Result / Observations:
                                      </span>
                                      <textarea
                                        rows={2}
                                        placeholder="Record actual execution outcome or error logs..."
                                        value={
                                          editingActualResult[tc.id] !== undefined
                                            ? editingActualResult[tc.id]
                                            : tc.actualResult || ""
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingActualResult((prev) => ({ ...prev, [tc.id]: val }));
                                        }}
                                        onBlur={() => {
                                          const val = editingActualResult[tc.id];
                                          if (val !== undefined && val !== tc.actualResult) {
                                            executeTestCase(activeRun.id, tc.id, tc.status, val);
                                          }
                                        }}
                                        className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 transition-colors"
                                      />
                                    </div>
                                  </div>

                                  {/* Execution Metadata Footer */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                                    <span>
                                      {tc.executedBy ? (
                                        <>Executed by <b>{tc.executedBy}</b> at {new Date(tc.executedAt || "").toLocaleTimeString()}</>
                                      ) : (
                                        "Not yet executed"
                                      )}
                                    </span>
                                    {tc.durationMs ? (
                                      <span>Duration: {(tc.durationMs / 1000).toFixed(1)}s</span>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="p-12 text-center rounded-2xl border space-y-3"
                  style={{ background: COLORS.panel, borderColor: COLORS.border }}
                >
                  <ListChecks size={36} className="mx-auto text-slate-400" />
                  <div className="text-sm font-semibold text-slate-800">No Execution Cycle Selected</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create a new test run or select one from the left sidebar to execute tests and log defects.
                  </p>
                  <button
                    onClick={() => setShowCreateRunModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: COLORS.accent }}
                  >
                    <Plus size={15} />
                    <span>Create Test Run</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: TEST CASE REPOSITORY ===================== */}
      {activeTab === "repository" && (
        <div className="space-y-6">
          <div
            className="p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div>
              <h3 className="text-base font-bold text-slate-800">Master Test Case Repository</h3>
              <p className="text-xs text-slate-500 mt-1">
                Centralized library of reusable test case specifications across platforms and microservices.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab("runs");
                setShowCreateRunModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
              style={{ background: COLORS.accent }}
            >
              <Play size={14} />
              <span>Bundle into New Execution Run</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePortals.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border space-y-4"
                style={{ background: COLORS.panel, borderColor: COLORS.border }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">{p.name}</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {p.total} Specs
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Smoke Verification:</span>
                    <b className="text-emerald-600">{p.smoke} tests</b>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Functional Flows:</span>
                    <b className="text-indigo-600">{p.functional} tests</b>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Regression Suite:</span>
                    <b className="text-sky-600">{p.regression} tests</b>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Readiness: 100%</span>
                  <button
                    onClick={() => {
                      setNewRunProject(p.name);
                      setNewRunTitle(`${p.name} Regression Cycle`);
                      setActiveTab("runs");
                      setShowCreateRunModal(true);
                    }}
                    className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Run Tests <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: PORTALS & ARCHITECTURE ===================== */}
      {activeTab === "portals" && (
        <div className="space-y-6">
          {/* Sub-tabs: Active Portals vs Recycle Bin */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setPortalSubTab("active");
                  setPortal("All");
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: portalSubTab === "active" ? "#FFFFFF" : "transparent",
                  color: portalSubTab === "active" ? COLORS.ink : COLORS.sub,
                  boxShadow: portalSubTab === "active" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <Layers size={13} className={portalSubTab === "active" ? "text-indigo-600" : "text-slate-400"} />
                <span>Active Portals ({activePortals.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalSubTab("trash");
                  setPortal("All");
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: portalSubTab === "trash" ? "#FFFFFF" : "transparent",
                  color: portalSubTab === "trash" ? "#DC2626" : COLORS.sub,
                  boxShadow: portalSubTab === "trash" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <Trash2 size={13} className={portalSubTab === "trash" ? "text-rose-600" : "text-slate-400"} />
                <span>Recycle Bin ({deletedPortals.length})</span>
              </button>
            </div>

            {portalSubTab === "active" && (
              <button
                onClick={() => {
                  setPortalError("");
                  setNewPortalName("");
                  setShowAddPortal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                style={{ background: COLORS.accent }}
              >
                <Plus size={14} />
                <span>Add Portal</span>
              </button>
            )}
          </div>

          {/* Filter Pills for Current Pool */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPortal("All")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: portal === "All" ? COLORS.accent : COLORS.panel2,
                color: portal === "All" ? "#fff" : COLORS.sub,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              All ({currentPortalsPool.length})
            </button>

            {currentPortalsPool.map((p) => (
              <button
                key={p.id}
                onClick={() => setPortal(p.name)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: portal === p.name ? COLORS.accent : COLORS.panel2,
                  color: portal === p.name ? "#fff" : COLORS.sub,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                {p.name}
              </button>
            ))}

            {portalSubTab === "active" && portal !== "All" && (
              <button
                onClick={handleDeletePortal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <Trash2 size={13} />
                <span>Move to Recycle Bin</span>
              </button>
            )}
          </div>

          {filteredPortals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <Layers size={28} className="mx-auto text-slate-300 mb-2" />
              <div className="text-xs font-bold text-slate-700">
                {portalSubTab === "trash" ? "Recycle Bin is empty" : "No portals found"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {portalSubTab === "trash"
                  ? "Soft-deleted portals will be preserved here indefinitely until restored or permanently deleted."
                  : "Create your first test portal to track suites and test cases."}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPortals.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl p-5 border shadow-xs flex flex-col justify-between"
                  style={{ background: COLORS.panel, borderColor: p.is_deleted ? "#FECACA" : COLORS.border }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                      {p.is_deleted ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Trash2 size={11} />
                          Recycle Bin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {p.total} cases
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-teal-600">{p.smoke}</div>
                        <div className="text-[10px] text-slate-400 font-medium">SMOKE</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-indigo-600">{p.functional}</div>
                        <div className="text-[10px] text-slate-400 font-medium">FUNCTIONAL</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-sky-600">{p.regression}</div>
                        <div className="text-[10px] text-slate-400 font-medium">REGRESSION</div>
                      </div>
                    </div>
                  </div>

                  {p.is_deleted ? (
                    <div className="mt-5 pt-3 border-t border-rose-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => restorePortal(p.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <RotateCcw size={12} />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortalToPurge(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={12} />
                        Purge
                      </button>
                    </div>
                  ) : (
                    p.passed !== null && p.passed !== undefined && (
                      <div className="mt-4 pt-3 flex items-center justify-between text-xs border-t border-slate-100 text-slate-500">
                        <span>Smoke run: {p.passed} passed</span>
                        <span className={p.failed && p.failed > 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-medium"}>
                          {p.failed && p.failed > 0 ? `${p.failed} failed` : "0 failed"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL: CREATE TEST RUN ===================== */}
      {showCreateRunModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowCreateRunModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Play size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Create New Test Run / Execution Cycle</h3>
              </div>
              <button onClick={() => setShowCreateRunModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRun} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Run Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 26 Regression Run or v2.5 Pre-Release Smoke"
                  value={newRunTitle}
                  onChange={(e) => setNewRunTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:border-indigo-500"
                  style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Project</label>
                  <select
                    value={newRunProject}
                    onChange={(e) => setNewRunProject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.client_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
                  <select
                    value={newRunEnv}
                    onChange={(e) => setNewRunEnv(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="UAT">UAT</option>
                    <option value="QA / Dev">QA / Dev</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned QA Tester</label>
                  <select
                    value={newRunAssignee}
                    onChange={(e) => setNewRunAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Suite Template</label>
                  <select
                    value={newRunSuiteTemplate}
                    onChange={(e) => setNewRunSuiteTemplate(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    <option value="standard">Assessment Platform Suite (4 cases)</option>
                    <option value="payment">Checkout & Webhook Suite (2 cases)</option>
                    <option value="blank">Blank Run (Add manually)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Run Objective / Description</label>
                <textarea
                  rows={2}
                  placeholder="Goals, target release tag, or test plan notes..."
                  value={newRunSummary}
                  onChange={(e) => setNewRunSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                  style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateRunModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                  style={{ background: COLORS.accent }}
                >
                  Create & Launch Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: LOG DEFECT FROM FAILED TEST ===================== */}
      {showLogDefectModal && defectTargetCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowLogDefectModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <Bug size={18} />
                <h3 className="text-sm font-bold">Log Defect from Failed Test ({defectTargetCase.testCase.id})</h3>
              </div>
              <button onClick={() => setShowLogDefectModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Title *</label>
                <input
                  type="text"
                  required
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:border-rose-500"
                  style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={defectSeverity}
                    onChange={(e) => setDefectSeverity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={defectPriority}
                    onChange={(e) => setDefectPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Module</label>
                  <input
                    type="text"
                    value={defectModule}
                    onChange={(e) => setDefectModule(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={defectAssignee}
                    onChange={(e) => setDefectAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                    style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reproduction Steps & Details (Pre-filled from test)
                </label>
                <textarea
                  rows={6}
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none focus:border-rose-500 leading-relaxed"
                  style={{ background: COLORS.panel2, borderColor: COLORS.border }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogDefectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDefect}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
                >
                  Create & Link Defect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD PORTAL ===================== */}
      {showAddPortal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowAddPortal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Add New Portal</span>
              <button onClick={() => setShowAddPortal(false)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>
            {portalError && (
              <div className="text-xs p-2.5 rounded-lg mb-3 bg-rose-50 text-rose-700 border border-rose-200">
                {portalError}
              </div>
            )}
            <input
              type="text"
              placeholder="Portal name (e.g. Mobile App)"
              value={newPortalName}
              onChange={(e) => setNewPortalName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-4"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddPortal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPortal}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ background: COLORS.accent }}
              >
                Add Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MOVE TEST RUN TO RECYCLE BIN ===================== */}
      {runToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setRunToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                  Move Test Run to Recycle Bin?
                </h3>
                <p className="text-xs text-slate-500">
                  {runToDelete.run_id} · {runToDelete.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This execution cycle will be moved to the <b>Recycle Bin</b>. It will <b>not be permanently deleted</b> and will remain available to restore at any time with all test results preserved.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRunToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteTestRun(runToDelete.id);
                  setRunToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PERMANENTLY PURGE TEST RUN ===================== */}
      {runToPurge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setRunToPurge(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-700">
                  Permanently Delete Test Run?
                </h3>
                <p className="text-xs text-slate-500">
                  {runToPurge.run_id} · {runToPurge.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              <b>Warning:</b> This action is <b>irreversible</b>. The execution cycle and all recorded test results will be completely deleted from the database.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRunToPurge(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await purgeTestRun(runToPurge.id);
                  setRunToPurge(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MOVE PORTAL TO RECYCLE BIN ===================== */}
      {portalToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setPortalToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                  Move Portal to Recycle Bin?
                </h3>
                <p className="text-xs text-slate-500">
                  Portal: &quot;{portalToDelete.name}&quot;
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This portal will be moved to the <b>Recycle Bin</b>. It will remain preserved indefinitely and can be restored at any time.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPortalToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deletePortal(portalToDelete.id);
                  setPortal("All");
                  setPortalToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PERMANENTLY PURGE PORTAL ===================== */}
      {portalToPurge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setPortalToPurge(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl border"
            style={{ background: COLORS.panel, borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-700">
                  Permanently Delete Portal?
                </h3>
                <p className="text-xs text-slate-500">
                  Portal: &quot;{portalToPurge.name}&quot;
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              <b>Warning:</b> This portal will be permanently wiped from the database. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPortalToPurge(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await purgePortal(portalToPurge.id);
                  setPortal("All");
                  setPortalToPurge(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
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
