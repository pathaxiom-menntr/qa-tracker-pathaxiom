"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Role,
  Project,
  Defect,
  DefectAttachment,
  Portal,
  BrowserCompat,
  PlatformCompat,
  VaptFinding,
  PerfEndpoint,
  ReportsByKey,
  TestRun,
  TestCaseExecution,
  TestCaseStatus,
} from "./types";
import { api } from "./api";

// Fallback seed data if backend is offline
const SEED_USERS: User[] = [
  { id: 46, name: "Alex Vance", email: "superadmin@menntr.com", role: "Super Admin", status: "active", createdAt: "2026-09-30T17:52:00Z" },
];

const SEED_PROJECTS: Project[] = [
  {
    id: 1,
    code: "PRJ-001",
    name: "Assessment Platform",
    client_name: "PathAxiom",
    description: "Next-gen developer assessment engine with live code evaluation and proctoring",
    modules: ["Admin Portal", "Assessment Flow", "Coding Worker", "User Management", "Analytics"],
    features: {
      "Admin Portal": ["User CRUD", "Roles and Permissions", "Test Config"],
      "Assessment Flow": ["Test Launch", "Timer Service", "Submission Flow"],
      "Coding Worker": ["Docker Sandbox", "Execution Engine", "Output Diff"],
      "User Management": ["Account Provisioning", "Status Toggle", "Password Reset"],
      Analytics: ["Score Aggregation", "Cohort Reports"],
    },
    assigned_user_ids: [],
  },
  {
    id: 2,
    code: "PRJ-002",
    name: "Payment Gateway & Checkout",
    client_name: "FinTech Global",
    description: "Multi-currency payment processing and reconciliation portal",
    modules: ["Checkout UI", "Webhook Processing", "Refund Engine", "Merchant Dashboard"],
    features: {
      "Checkout UI": ["Card Input", "UPI QR Flow", "3D Secure Redirect"],
      "Webhook Processing": ["Stripe Listener", "PayPal Callback", "Retry Worker"],
      "Refund Engine": ["Partial Refunds", "Ledger Audit", "Reversal API"],
      "Merchant Dashboard": ["Settlement Reports", "API Keys Management"],
    },
    assigned_user_ids: [],
  },
  {
    id: 3,
    code: "PRJ-003",
    name: "HealthPlus EHR Mobile",
    client_name: "HealthPlus Systems",
    description: "HIPAA-compliant Electronic Health Record and patient telemedicine platform",
    modules: ["Patient Records", "Telehealth Video", "Prescription Service", "Billing"],
    features: {
      "Patient Records": ["Vitals Sync", "Lab Results", "History Timeline"],
      "Telehealth Video": ["WebRTC Call", "Screen Sharing", "Waiting Room"],
      "Prescription Service": ["e-Rx Generation", "Pharmacy Dispatch"],
      Billing: ["Insurance Claim", "Copay Processing"],
    },
    assigned_user_ids: [],
  },
];

const SEED_BROWSERS: BrowserCompat[] = [
  { id: 1, browser: "Google Chrome", engine: "Blink", version: "149.0.7827.156", status: "Pass", remark: null },
  { id: 2, browser: "Microsoft Edge", engine: "Blink", version: "149.0.4022.9", status: "Pass", remark: null },
  { id: 3, browser: "Mozilla Firefox", engine: "Gecko", version: "152.0.3", status: "Pass", remark: null },
  { id: 4, browser: "Apple Safari", engine: "WebKit", version: "5.1.7", status: "Pass", remark: null },
  { id: 5, browser: "Opera", engine: "Blink", version: "132.0.5905.73", status: "Pass", remark: null },
  { id: 6, browser: "Brave", engine: "Blink", version: "v1.91.180", status: "Pass", remark: null },
  { id: 7, browser: "Samsung Internet", engine: "Blink", version: "30.0.2.35", status: "Pass", remark: null },
  { id: 8, browser: "DuckDuckGo Browser", engine: "WebKit/Blink", version: "0.163.2", status: "Pass", remark: null },
  { id: 9, browser: "Arc Browser", engine: "Blink/WebKit", version: "1.101.0", status: "Pass", remark: null },
  { id: 10, browser: "Tor Browser", engine: "Gecko", version: "15.0.16", status: "Fail", remark: "Page couldn't load — reload required" },
];

const SEED_PLATFORMS: PlatformCompat[] = [
  { id: 1, platform: "Admin — Desktop Web", total: 33, working: 33 },
  { id: 2, platform: "Admin — Mobile Web", total: 33, working: 33 },
  { id: 3, platform: "Student — Desktop Web", total: 17, working: 17 },
  { id: 4, platform: "Student — Mobile Web", total: 17, working: 13 },
];

interface QAStoreType {
  // Auth
  currentUser: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, role: Role, password?: string) => Promise<boolean>;
  logout: () => void;

  // Users Management (Live Database)
  users: User[];
  addUser: (name: string, email: string, role: Role, password: string, client_name?: string, assigned_projects?: string[], permissions?: string[]) => Promise<void>;
  editUser: (id: number, name: string, email: string, role: Role, password?: string, client_name?: string, assigned_projects?: string[], permissions?: string[]) => Promise<void>;
  toggleUserStatus: (id: number) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  restoreUser: (id: number) => Promise<void>;
  purgeUser: (id: number) => Promise<void>;

  // Projects & Hierarchy (Client -> Project -> Module -> Feature)
  projects: Project[];
  addProject: (project: Partial<Project>) => Promise<void>;
  updateProject: (id: number, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  restoreProject: (id: number) => Promise<void>;
  purgeProject: (id: number) => Promise<void>;

  // Portals (Test Cases)
  portals: Portal[];
  createPortal: (name: string) => Promise<void>;
  deletePortal: (id: number) => Promise<void>;
  restorePortal: (id: number) => Promise<void>;
  purgePortal: (id: number) => Promise<void>;

  // Defects
  defects: Defect[];
  createDefect: (defect: {
    id?: string;
    client_name?: string;
    project_name?: string;
    project_code?: string;
    module: string;
    feature?: string;
    severity: string;
    priority: string;
    title: string;
    description?: string;
    status?: string;
    assignee?: string;
    attachments?: DefectAttachment[];
  }) => Promise<void>;
  updateDefect: (id: string, patch: Partial<Defect>) => Promise<void>;
  deleteDefect: (id: string) => Promise<void>;
  restoreDefect: (id: string) => Promise<void>;
  purgeDefect: (id: string) => Promise<void>;
  bulkCreateDefects: (defects: (Defect | Record<string, any>)[]) => Promise<any>;

  // Browsers & Compatibility
  browsers: BrowserCompat[];
  compat: PlatformCompat[];
  addBrowser: (browser: Omit<BrowserCompat, "id">) => Promise<void>;

  // VAPT
  vapt: VaptFinding[];
  createVapt: (finding: Omit<VaptFinding, "id">) => Promise<void>;
  updateVapt: (id: number, patch: Partial<VaptFinding>) => Promise<void>;
  deleteVapt: (id: number) => Promise<void>;
  restoreVapt: (id: number) => Promise<void>;
  purgeVapt: (id: number) => Promise<void>;

  // Performance
  perfFast: PerfEndpoint[];
  perfSlow: PerfEndpoint[];
  addPerfEndpoint: (endpoint: Omit<PerfEndpoint, "id">) => Promise<void>;

  // Reports
  reports: ReportsByKey;
  uploadReport: (key: string, fileName: string, format: "PDF" | "Excel", comments?: string) => Promise<void>;
  deleteReport: (key: string) => Promise<void>;
  restoreReport: (key: string) => Promise<void>;
  purgeReport: (key: string) => Promise<void>;

  // Test Runs & Execution Cycles
  testRuns: TestRun[];
  createTestRun: (run: Partial<TestRun>) => Promise<TestRun>;
  updateTestRun: (id: number, patch: Partial<TestRun>) => Promise<void>;
  deleteTestRun: (id: number) => Promise<void>;
  restoreTestRun: (id: number) => Promise<void>;
  purgeTestRun: (id: number) => Promise<void>;
  executeTestCase: (
    runId: number,
    testCaseId: string,
    status: TestCaseStatus,
    actualResult?: string,
    notes?: string,
    defectId?: string
  ) => Promise<void>;

  // Refresh
  refreshAll: () => Promise<void>;
  loading: boolean;
}

const QAStoreContext = createContext<QAStoreType | null>(null);

export function QAStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(SEED_USERS[0]);
  const [loading, setLoading] = useState(true);

  // Live Database states
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [browsers, setBrowsers] = useState<BrowserCompat[]>(SEED_BROWSERS);
  const [compat, setCompat] = useState<PlatformCompat[]>(SEED_PLATFORMS);
  const [vapt, setVapt] = useState<VaptFinding[]>([]);
  const [perfFast, setPerfFast] = useState<PerfEndpoint[]>([]);
  const [perfSlow, setPerfSlow] = useState<PerfEndpoint[]>([]);
  const [reports, setReports] = useState<ReportsByKey>({});
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);

  // Helper to ensure a valid backend token is present
  const ensureValidToken = async (): Promise<string | null> => {
    let token = typeof window !== "undefined" ? localStorage.getItem("qa_tracker_token") : null;
    if (token) return token;

    try {
      const auth = await api.login("superadmin@menntr.com", "password123");
      if (auth?.token) {
        localStorage.setItem("qa_tracker_token", auth.token);
        if (auth.user) setCurrentUser(auth.user);
        return auth.token;
      }
    } catch (e) {
      console.warn("Auto-token generation fallback:", e);
    }
    return null;
  };

  // Fetch real data from Backend & PostgreSQL
  const refreshAll = useCallback(async () => {
    try {
      const [
        usersRes,
        projectsRes,
        defectsRes,
        portalsRes,
        browsersRes,
        compatRes,
        vaptRes,
        perfRes,
        reportsRes,
        testRunsRes,
      ] = await Promise.allSettled([
        api.getUsers(),
        api.getProjects(),
        api.getDefects(),
        api.getPortals(),
        api.getBrowsers(),
        api.getCompat(),
        api.getVapt(),
        api.getPerformance(),
        api.getReports(),
        api.getTestRuns(),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value?.users) {
        const liveUsers = usersRes.value.users;
        setUsers(liveUsers);
        setCurrentUser((prev) => {
          if (!prev) return null;
          const fresh = liveUsers.find(
            (u: User) =>
              u.id === prev.id ||
              u.email.toLowerCase() === prev.email.toLowerCase()
          );
          return fresh ? { ...prev, ...fresh } : prev;
        });
      }
      if (projectsRes.status === "fulfilled" && projectsRes.value?.projects) {
        setProjects(projectsRes.value.projects);
      }
      if (defectsRes.status === "fulfilled" && defectsRes.value?.defects) {
        setDefects(defectsRes.value.defects);
      }
      if (portalsRes.status === "fulfilled" && portalsRes.value?.portals) {
        setPortals(portalsRes.value.portals);
      }
      if (browsersRes.status === "fulfilled" && browsersRes.value?.browsers) {
        setBrowsers(browsersRes.value.browsers);
      }
      if (compatRes.status === "fulfilled" && compatRes.value?.compat) {
        setCompat(compatRes.value.compat);
      }
      if (vaptRes.status === "fulfilled" && vaptRes.value?.vapt) {
        setVapt(vaptRes.value.vapt);
      }
      if (perfRes.status === "fulfilled" && perfRes.value) {
        if (perfRes.value.fast) setPerfFast(perfRes.value.fast);
        if (perfRes.value.slow) setPerfSlow(perfRes.value.slow);
      }
      if (reportsRes.status === "fulfilled" && reportsRes.value?.reports) {
        setReports(reportsRes.value.reports);
      }
      if (testRunsRes.status === "fulfilled" && testRunsRes.value?.testRuns) {
        setTestRuns(testRunsRes.value.testRuns);
      }
    } catch (e) {
      console.error("Failed to refresh live data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize session and token
  useEffect(() => {
    (async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("qa_tracker_token") : null;
      if (token) {
        try {
          const res = await api.me();
          if (res?.user) setCurrentUser(res.user);
        } catch {
          // Token expired, re-authenticate as Super Admin
          await ensureValidToken();
        }
      } else {
        await ensureValidToken();
      }
      await refreshAll();
    })();
  }, [refreshAll]);

  // Auth methods
  const login = async (email: string, password = "password123"): Promise<boolean> => {
    try {
      const res = await api.login(email, password);
      if (res.token && res.user) {
        localStorage.setItem("qa_tracker_token", res.token);
        setCurrentUser(res.user);
        await refreshAll();
        return true;
      }
    } catch (e: any) {
      if (
        e?.message?.includes("401") ||
        e?.message?.toLowerCase().includes("invalid") ||
        e?.message?.toLowerCase().includes("unauthorized")
      ) {
        throw new Error("Invalid email or password.");
      }
      const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        if (matched.status === "deactivated") {
          throw new Error("This account is deactivated. Please contact your administrator.");
        }
        setCurrentUser(matched);
        return true;
      }
      throw e;
    }
    return false;
  };

  const register = async (name: string, email: string, role: Role = "Super Admin", password = "password123"): Promise<boolean> => {
    try {
      const res = await api.register(name, email, password, role);
      if (res.token && res.user) {
        localStorage.setItem("qa_tracker_token", res.token);
        setCurrentUser(res.user);
        await refreshAll();
        return true;
      }
    } catch (e: any) {
      throw e;
    }
    return false;
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("qa_tracker_token");
    }
    setCurrentUser(null);
  };

  // User Management
  const addUser = async (name: string, email: string, role: Role, password: string, client_name?: string, assigned_projects?: string[], permissions?: string[]) => {
    try {
      await api.createUser(name, email, role, password, client_name, assigned_projects, permissions);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to add user: " + e.message);
      throw e;
    }
  };

  const editUser = async (id: number, name: string, email: string, role: Role, password?: string, client_name?: string, assigned_projects?: string[], permissions?: string[]) => {
    try {
      await api.updateUser(id, { name, email, role, password: password || undefined, client_name, assigned_projects, permissions });
      await refreshAll();
      if (currentUser?.id === id) {
        setCurrentUser((prev) => (prev ? { ...prev, name, email, role, client_name, assigned_projects, permissions } : null));
      }
    } catch (e: any) {
      alert("Failed to update user in database: " + e.message);
      throw e;
    }
  };

  const toggleUserStatus = async (id: number) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const nextStatus = target.status === "active" ? "deactivated" : "active";
    try {
      await api.updateUser(id, { status: nextStatus });
      await refreshAll();
    } catch (e: any) {
      alert("Failed to toggle user status: " + e.message);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await api.deleteUser(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to delete user: " + e.message);
    }
  };

  const restoreUser = async (id: number) => {
    try {
      await api.restoreUser(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to restore user: " + e.message);
    }
  };

  const purgeUser = async (id: number) => {
    try {
      await api.purgeUser(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to permanently delete user: " + e.message);
    }
  };

  // Projects
  const addProject = async (project: Partial<Project>) => {
    try {
      await ensureValidToken();
      await api.createProject(project);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to create project: " + e.message);
      throw e;
    }
  };

  const updateProject = async (id: number, patch: Partial<Project>) => {
    try {
      await ensureValidToken();
      await api.updateProject(id, patch);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to update project: " + e.message);
      throw e;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await ensureValidToken();
      await api.deleteProject(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to delete project: " + e.message);
      throw e;
    }
  };

  const restoreProject = async (id: number) => {
    try {
      await ensureValidToken();
      await api.restoreProject(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to restore project: " + e.message);
    }
  };

  const purgeProject = async (id: number) => {
    try {
      await ensureValidToken();
      await api.purgeProject(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to permanently delete project: " + e.message);
    }
  };

  // Portals
  const createPortal = async (name: string) => {
    try {
      await ensureValidToken();
      await api.createPortal(name);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to create portal: " + e.message);
    }
  };

  const deletePortal = async (id: number) => {
    try {
      await ensureValidToken();
      await api.deletePortal(id);
      setPortals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_deleted: true, deleted_at: new Date().toISOString() } : p))
      );
    } catch (e: any) {
      setPortals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_deleted: true, deleted_at: new Date().toISOString() } : p))
      );
    }
  };

  const restorePortal = async (id: number) => {
    try {
      await ensureValidToken();
      await api.restorePortal(id);
    } catch {}
    setPortals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_deleted: false, deleted_at: undefined } : p))
    );
  };

  const purgePortal = async (id: number) => {
    try {
      await ensureValidToken();
      await api.purgePortal(id);
    } catch {}
    setPortals((prev) => prev.filter((p) => p.id !== id));
  };

  // Defects
  const createDefect = async (defect: {
    id?: string;
    client_name?: string;
    project_name?: string;
    project_code?: string;
    module: string;
    feature?: string;
    severity: string;
    priority: string;
    title: string;
    description?: string;
    status?: string;
    assignee?: string;
    attachments?: DefectAttachment[];
  }) => {
    try {
      await ensureValidToken();

      // Ensure id exists (e.g. BUG-156)
      let defectId = defect.id?.trim();
      if (!defectId) {
        const nums = defects
          .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
          .filter((n) => !isNaN(n));
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        defectId = `BUG-${String(max + 1).padStart(3, "0")}`;
      }

      await api.createDefect({
        id: defectId,
        client_name: defect.client_name || "PathAxiom",
        project_name: defect.project_name || "Assessment Platform",
        project_code: defect.project_code || "PRJ-001",
        module: defect.module.trim(),
        feature: defect.feature || "General",
        severity: defect.severity,
        priority: defect.priority,
        title: defect.title.trim(),
        description: (defect.description || "").trim(),
        status: defect.status || "Open",
        created_by: currentUser?.name || "You",
        assignee: defect.assignee || "Unassigned",
      });

      await refreshAll();
    } catch (e: any) {
      console.error("createDefect error:", e);
      throw e;
    }
  };

  const updateDefect = async (id: string, patch: Partial<Defect>) => {
    try {
      await ensureValidToken();
      await api.updateDefect(id, {
        ...patch,
        updated_by: currentUser?.name || "You",
      });
      await refreshAll();
    } catch (e: any) {
      alert("Failed to update defect: " + e.message);
    }
  };

  const deleteDefect = async (id: string) => {
    try {
      await ensureValidToken();
      await api.deleteDefect(id, currentUser?.name || "QA Team");
      await refreshAll();
    } catch (e: any) {
      alert("Failed to delete defect: " + e.message);
    }
  };

  const restoreDefect = async (id: string) => {
    try {
      await ensureValidToken();
      await api.restoreDefect(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to restore defect: " + e.message);
    }
  };

  const purgeDefect = async (id: string) => {
    try {
      await ensureValidToken();
      await api.purgeDefect(id);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to permanently delete defect: " + e.message);
    }
  };

  const bulkCreateDefects = async (defectsList: (Defect | Record<string, any>)[]) => {
    try {
      await ensureValidToken();
      const res = await api.bulkCreateDefects(defectsList);
      await refreshAll();
      return res;
    } catch (e: any) {
      alert("Failed to bulk upload defects: " + e.message);
      throw e;
    }
  };

  // VAPT
  const createVapt = async (finding: Omit<VaptFinding, "id">) => {
    try {
      await ensureValidToken();
      await api.createVapt(finding);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to add finding: " + e.message);
    }
  };

  const updateVapt = async (id: number, patch: Partial<VaptFinding>) => {
    try {
      await ensureValidToken();
      await api.updateVapt(id, patch);
      await refreshAll();
    } catch (e: any) {
      alert("Failed to update finding: " + e.message);
    }
  };

  const deleteVapt = async (id: number) => {
    try {
      await ensureValidToken();
      await api.deleteVapt(id);
      setVapt((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_deleted: true, deleted_at: new Date().toISOString() } : v))
      );
    } catch (e: any) {
      setVapt((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_deleted: true, deleted_at: new Date().toISOString() } : v))
      );
    }
  };

  const restoreVapt = async (id: number) => {
    try {
      await ensureValidToken();
      await api.restoreVapt(id);
    } catch {}
    setVapt((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_deleted: false, deleted_at: undefined } : v))
    );
  };

  const purgeVapt = async (id: number) => {
    try {
      await ensureValidToken();
      await api.purgeVapt(id);
    } catch {}
    setVapt((prev) => prev.filter((v) => v.id !== id));
  };

  // Reports
  const uploadReport = async (key: string, fileName: string, format: "PDF" | "Excel", comments = "") => {
    try {
      await ensureValidToken();
      const file = new File([`QA Tracker Report: ${fileName}`], fileName, {
        type: format === "PDF" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      await api.uploadReport(key, file, {
        uploadedBy: currentUser?.name || "You",
        comments,
      });
      await refreshAll();
    } catch (e: any) {
      alert("Failed to upload report: " + e.message);
    }
  };

  const deleteReport = async (key: string) => {
    try {
      await ensureValidToken();
      await api.deleteReport(key);
      setReports((prev) => ({
        ...prev,
        [key]: { ...prev[key], is_deleted: true, deleted_at: new Date().toISOString() },
      }));
    } catch (e: any) {
      setReports((prev) => ({
        ...prev,
        [key]: { ...prev[key], is_deleted: true, deleted_at: new Date().toISOString() },
      }));
    }
  };

  const restoreReport = async (key: string) => {
    try {
      await ensureValidToken();
      await api.restoreReport(key);
    } catch {}
    setReports((prev) => ({
      ...prev,
      [key]: { ...prev[key], is_deleted: false, deleted_at: undefined },
    }));
  };

  const purgeReport = async (key: string) => {
    try {
      await ensureValidToken();
      await api.purgeReport(key);
    } catch {}
    setReports((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Browsers
  const addBrowser = async (browser: Omit<BrowserCompat, "id">) => {
    try {
      const res = await api.createBrowser(browser);
      if (res?.browser) {
        setBrowsers((prev) => [...prev, res.browser]);
      } else {
        await refreshAll();
      }
    } catch {
      // Dynamic fallback
      setBrowsers((prev) => [...prev, { id: Date.now(), ...browser }]);
    }
  };

  // Performance
  const addPerfEndpoint = async (endpoint: Omit<PerfEndpoint, "id">) => {
    try {
      await ensureValidToken();
      await api.createPerfEndpoint(endpoint);
      await refreshAll();
    } catch {
      // Dynamic fallback
      const newEntry: PerfEndpoint = { ...endpoint };
      if (endpoint.category === "Fast" || endpoint.avg <= 200) {
        setPerfFast((prev) => [newEntry, ...prev]);
      } else {
        setPerfSlow((prev) => [newEntry, ...prev]);
      }
    }
  };

  // Test Runs & Execution Cycles
  const createTestRun = async (run: Partial<TestRun>): Promise<TestRun> => {
    try {
      await ensureValidToken();
      const res = await api.createTestRun(run);
      if (res?.testRun) {
        setTestRuns((prev) => [res.testRun, ...prev]);
        return res.testRun;
      }
      await refreshAll();
      return res.testRun;
    } catch (err: any) {
      console.error("Failed to create test run:", err);
      throw err;
    }
  };

  const updateTestRun = async (id: number, patch: Partial<TestRun>) => {
    setTestRuns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    try {
      await ensureValidToken();
      await api.updateTestRun(id, patch);
    } catch (err) {
      console.error("Failed to update test run on server:", err);
      await refreshAll();
    }
  };

  const deleteTestRun = async (id: number) => {
    try {
      await ensureValidToken();
      await api.deleteTestRun(id);
      await refreshAll();
    } catch (err) {
      console.error("Failed to delete test run:", err);
      setTestRuns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_deleted: true, deleted_at: new Date().toISOString() } : r))
      );
    }
  };

  const restoreTestRun = async (id: number) => {
    try {
      await ensureValidToken();
      await api.restoreTestRun(id);
      await refreshAll();
    } catch (err) {
      console.error("Failed to restore test run:", err);
      setTestRuns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_deleted: false, deleted_at: undefined } : r))
      );
    }
  };

  const purgeTestRun = async (id: number) => {
    try {
      await ensureValidToken();
      await api.purgeTestRun(id);
      await refreshAll();
    } catch (err) {
      console.error("Failed to purge test run:", err);
      setTestRuns((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const executeTestCase = async (
    runId: number,
    testCaseId: string,
    status: TestCaseStatus,
    actualResult?: string,
    notes?: string,
    defectId?: string
  ) => {
    const targetRun = testRuns.find((r) => r.id === runId);
    if (!targetRun) return;

    const updatedCases = targetRun.test_cases.map((tc) => {
      if (tc.id !== testCaseId) return tc;
      return {
        ...tc,
        status,
        actualResult: actualResult !== undefined ? actualResult : tc.actualResult,
        notes: notes !== undefined ? notes : tc.notes,
        defectId: defectId !== undefined ? defectId : tc.defectId,
        executedBy: currentUser?.name || "QA Tester",
        executedAt: new Date().toISOString(),
      };
    });

    const allTested = updatedCases.every((tc) => tc.status !== "Untested");
    const hasFailed = updatedCases.some((tc) => tc.status === "Failed");
    const hasBlocked = updatedCases.some((tc) => tc.status === "Blocked");

    let nextRunStatus = targetRun.status;
    let completedAt = targetRun.completed_at;
    if (allTested) {
      nextRunStatus = hasFailed ? "In Progress" : hasBlocked ? "Blocked" : "Completed";
      completedAt = targetRun.completed_at || new Date().toISOString();
    } else {
      nextRunStatus = "In Progress";
    }

    const patch: Partial<TestRun> = {
      test_cases: updatedCases,
      status: nextRunStatus,
      completed_at: completedAt,
    };

    setTestRuns((prev) =>
      prev.map((r) => (r.id === runId ? { ...r, ...patch } : r))
    );

    try {
      await ensureValidToken();
      await api.updateTestRun(runId, patch);
    } catch (err) {
      console.error("Failed to update test run execution:", err);
      await refreshAll();
    }
  };

  return (
    <QAStoreContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        users,
        addUser,
        editUser,
        toggleUserStatus,
        deleteUser,
        restoreUser,
        purgeUser,
        projects,
        addProject,
        updateProject,
        deleteProject,
        restoreProject,
        purgeProject,
        portals,
        createPortal,
        deletePortal,
        restorePortal,
        purgePortal,
        defects,
        createDefect,
        updateDefect,
        deleteDefect,
        restoreDefect,
        purgeDefect,
        bulkCreateDefects,
        browsers,
        compat,
        addBrowser,
        vapt,
        createVapt,
        updateVapt,
        deleteVapt,
        restoreVapt,
        purgeVapt,
        perfFast,
        perfSlow,
        addPerfEndpoint,
        reports,
        uploadReport,
        deleteReport,
        restoreReport,
        purgeReport,
        testRuns,
        createTestRun,
        updateTestRun,
        deleteTestRun,
        restoreTestRun,
        purgeTestRun,
        executeTestCase,
        refreshAll,
        loading,
      }}
    >
      {children}
    </QAStoreContext.Provider>
  );
}

export function useQAStore() {
  const ctx = useContext(QAStoreContext);
  if (!ctx) throw new Error("useQAStore must be used within QAStoreProvider");
  return ctx;
}
