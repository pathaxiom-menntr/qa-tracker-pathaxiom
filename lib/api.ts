import { Role, User, Project, Defect, Portal, BrowserCompat, PlatformCompat, VaptFinding, PerfEndpoint, ReportsByKey } from "./types";

const BASE = "/api";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("qa_tracker_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function handle<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let errMsg = `API ${res.status}: ${text || res.statusText}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) errMsg = parsed.error;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // ==================== AUTH ====================
  async login(email: string, password = "password123"): Promise<{ ok: boolean; token: string; user: User }> {
    return handle(
      await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ email, password }),
      })
    );
  },

  async register(name: string, email: string, password = "password123", role: Role = "QA Engineer"): Promise<{ ok: boolean; token: string; user: User }> {
    return handle(
      await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name, email, password, role }),
      })
    );
  },

  async me(): Promise<{ user: User }> {
    return handle(
      await fetch(`${BASE}/auth/me`, {
        headers: authHeaders(),
      })
    );
  },

  // ==================== USER MANAGEMENT ====================
  async getUsers(): Promise<{ ok: boolean; users: User[] }> {
    return handle(await fetch(`${BASE}/users`));
  },

  async createUser(name: string, email: string, role: Role, password = "password123", client_name?: string, assigned_projects?: string[], permissions?: string[]): Promise<{ ok: boolean; user: User }> {
    return handle(
      await fetch(`${BASE}/users`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name, email, role, password, client_name, assigned_projects, permissions }),
      })
    );
  },

  async updateUser(id: number, data: Partial<User> & { password?: string }): Promise<{ ok: boolean; user: User }> {
    return handle(
      await fetch(`${BASE}/users/${id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      })
    );
  },

  async deleteUser(id: number): Promise<{ ok: boolean }> {
    return handle(
      await fetch(`${BASE}/users/${id}`, {
        method: "DELETE",
      })
    );
  },

  // ==================== DEFECTS ====================
  async getDefects(): Promise<{ defects: Defect[] }> {
    return handle(await fetch(`${BASE}/defects`));
  },

  async createDefect(defect: Defect | Record<string, any>): Promise<any> {
    return handle(
      await fetch(`${BASE}/defects`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(defect),
      })
    );
  },

  async bulkCreateDefects(defects: (Defect | Record<string, any>)[]): Promise<any> {
    return handle(
      await fetch(`${BASE}/defects/bulk`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify({ defects }),
      })
    );
  },

  async updateDefect(id: string, patch: Partial<Defect>): Promise<any> {
    return handle(
      await fetch(`${BASE}/defects/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(patch),
      })
    );
  },

  async deleteDefect(id: string, deletedBy = "QA Team"): Promise<any> {
    return handle(
      await fetch(`${BASE}/defects/${encodeURIComponent(id)}?deleted_by=${encodeURIComponent(deletedBy)}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },

  async restoreDefect(id: string): Promise<any> {
    try {
      const res = await fetch(`${BASE}/defects/restore`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify({ id }),
      });
      if (res.ok) return await res.json();
    } catch {}

    return handle(
      await fetch(`${BASE}/defects/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify({ is_deleted: false }),
      })
    );
  },

  async purgeDefect(id: string): Promise<any> {
    return handle(
      await fetch(`${BASE}/defects/${encodeURIComponent(id)}?purge=true`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },

  // ==================== PROJECTS ====================
  async getProjects(): Promise<{ ok: boolean; projects: Project[] }> {
    return handle(await fetch(`${BASE}/projects`));
  },

  async createProject(project: Partial<Project>): Promise<{ ok: boolean; project: Project }> {
    return handle(
      await fetch(`${BASE}/projects`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(project),
      })
    );
  },

  async updateProject(id: number, patch: Partial<Project>): Promise<{ ok: boolean; project: Project }> {
    return handle(
      await fetch(`${BASE}/projects/${id}`, {
        method: "PUT",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(patch),
      })
    );
  },

  // ==================== PORTALS (TEST CASES) ====================
  async getPortals(): Promise<{ portals: Portal[] }> {
    return handle(await fetch(`${BASE}/portals`));
  },

  async createPortal(name: string): Promise<any> {
    return handle(
      await fetch(`${BASE}/portals`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify({ name }),
      })
    );
  },

  async deletePortal(id: number): Promise<any> {
    return handle(
      await fetch(`${BASE}/portals/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },

  // ==================== BROWSERS & COMPATIBILITY ====================
  async getBrowsers(): Promise<{ ok: boolean; browsers: BrowserCompat[] }> {
    return handle(await fetch(`${BASE}/browsers`));
  },

  async createBrowser(browser: Omit<BrowserCompat, "id">): Promise<{ ok: boolean; browser: BrowserCompat }> {
    return handle(
      await fetch(`${BASE}/browsers`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(browser),
      })
    );
  },

  async getCompat(): Promise<{ compat: PlatformCompat[] }> {
    return handle(await fetch(`${BASE}/compat`));
  },

  // ==================== SECURITY (VAPT) ====================
  async getVapt(): Promise<{ vapt: VaptFinding[] }> {
    return handle(await fetch(`${BASE}/vapt`));
  },

  async createVapt(finding: Omit<VaptFinding, "id">): Promise<any> {
    return handle(
      await fetch(`${BASE}/vapt`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(finding),
      })
    );
  },

  async updateVapt(id: number, patch: Partial<VaptFinding>): Promise<any> {
    return handle(
      await fetch(`${BASE}/vapt/${id}`, {
        method: "PUT",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(patch),
      })
    );
  },

  async deleteVapt(id: number): Promise<any> {
    return handle(
      await fetch(`${BASE}/vapt/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },

  // ==================== PERFORMANCE ====================
  async getPerformance(): Promise<{ fast: PerfEndpoint[]; slow: PerfEndpoint[] }> {
    return handle(await fetch(`${BASE}/performance`));
  },

  async createPerfEndpoint(endpoint: Omit<PerfEndpoint, "id">): Promise<any> {
    return handle(
      await fetch(`${BASE}/performance`, {
        method: "POST",
        headers: { ...jsonHeaders, ...authHeaders() },
        body: JSON.stringify(endpoint),
      })
    );
  },

  // ==================== REPORTS ====================
  async getReports(): Promise<{ reports: ReportsByKey }> {
    return handle(await fetch(`${BASE}/reports`));
  },

  async uploadReport(key: string, file: File, meta: { uploadedBy?: string; comments?: string }): Promise<any> {
    const form = new FormData();
    form.append("file", file);
    form.append("uploadedBy", meta.uploadedBy || "You");
    form.append("comments", meta.comments || "");

    return handle(
      await fetch(`${BASE}/reports/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      })
    );
  },

  async deleteReport(key: string): Promise<any> {
    return handle(
      await fetch(`${BASE}/reports/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },
};
