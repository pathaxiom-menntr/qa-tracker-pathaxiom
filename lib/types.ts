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
  createdAt: string;
  createdBy?: string;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  client_name: string;
  description?: string;
  modules: string[];
  features: Record<string, string[]>;
  assigned_user_ids?: (number | string)[];
  created_at?: string;
  updated_at?: string;
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
  fileName: string;
  format: "PDF" | "Excel";
  size: string;
  uploadedBy: string;
  date: string;
  version: string;
  comments: string;
  hasBlob: boolean;
}

export type ReportsByKey = Record<string, ReportEntry>;
