export type Role =
  | "Super Admin"
  | "Admin"
  | "QA Manager"
  | "QA Lead"
  | "QA Engineer"
  | "Client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "active" | "deactivated";
  client_name?: string;
  assigned_projects?: string[];
  permissions?: string[];
  createdAt: string;
  createdBy?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  client_name: string;
  client_names?: string[];
  is_shared?: boolean;
  description?: string;
  modules: string[];
  features: Record<string, string[]>;
  assigned_user_ids?: (number | string)[];
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface DefectAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 data URL
  uploaded_at: string;
}

export interface Defect {
  id: string;
  client_name?: string;
  project_name?: string;
  project_code?: string;
  module: string;
  feature?: string;
  severity: string;
  priority: string;
  title: string;
  description?: string;
  status: string;
  assignee?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  attachments?: DefectAttachment[];
}

export type TestCaseStatus = "Untested" | "Passed" | "Failed" | "Blocked" | "Skipped";

export interface TestCaseExecution {
  id: string; // e.g. "TC-101"
  title: string;
  module: string;
  feature?: string;
  type: "Smoke" | "Functional" | "Regression" | "Security" | "Performance";
  priority: "Critical" | "High" | "Medium" | "Low";
  preconditions?: string;
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: TestCaseStatus;
  executedBy?: string;
  executedAt?: string;
  durationMs?: number;
  defectId?: string; // Linked defect ID if logged (e.g. DEF-042)
  notes?: string;
}

export interface TestRun {
  id: number;
  run_id: string; // e.g. "RUN-2026-001"
  title: string;
  project_name: string;
  project_code: string;
  client_name: string;
  environment: "Staging" | "Production" | "UAT" | "QA / Dev";
  status: "In Progress" | "Completed" | "Blocked" | "Draft";
  created_by: string;
  assigned_to?: string;
  created_at: string;
  completed_at?: string;
  summary?: string;
  test_cases: TestCaseExecution[];
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface Portal {
  id: number;
  name: string;
  smoke: number;
  functional: number;
  regression: number;
  total: number;
  highP: number | null;
  medP: number | null;
  lowP: number | null;
  passed: number | null;
  failed: number | null;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface BrowserCompat {
  id: number;
  browser: string;
  engine: string;
  version: string;
  status: "Pass" | "Fail";
  remark?: string | null;
}

export interface PlatformCompat {
  id: number;
  platform: string;
  total: number;
  working: number;
}

export interface VaptFinding {
  id: number;
  title: string;
  severity: string;
  status: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface PerfEndpoint {
  ep: string;
  avg: number;
  p95: number;
  p99: number;
  err: number;
  max: number;
  category?: string;
  name?: string;
  load?: string;
  status?: string;
  notes?: string;
  date?: string;
}

export interface ReportEntry {
  key?: string;
  fileName: string;
  format: "PDF" | "Excel";
  size: string;
  uploadedBy: string;
  date: string;
  version: string;
  comments: string;
  hasBlob: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export type ReportsByKey = Record<string, ReportEntry>;
