# QA Tracker Enterprise — Next.js & TypeScript Suite

Enterprise Quality Assurance Management Platform featuring full **Role-Based Access Control (RBAC)**, multi-project tenancy, comprehensive test lifecycle tracking, and an unrestricted **Super Admin Centralized Administration Console**.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Getting Started

From this directory (`qa-tracker-next`):

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start development server
npm run dev

# 3. Or build for production
npm run build
npm start
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌟 Key Features & Requirements Implemented

### 1. Dashboard & Monitoring
- Overall QA health index, active project scope selector ("All Projects (Global Scope)" for Super Admin).
- Real-time telemetry across test execution passes (Pass, Fail, Blocked, Not Run), defects by severity/status, OWASP VAPT vulnerabilities, and API latency benchmarks.

### 2. User Management
- Create, edit, deactivate, and manage users.
- Assign users to projects and manage their access scopes.
- Account activity and status toggling (Active / Deactivated).

### 3. Role & Permission Management (RBAC)
- 7 Standard Roles: **Super Admin**, **QA Admin**, **QA Lead**, **QA Engineer**, **Developer**, **Project Manager**, **Viewer**.
- Action-level permissions matrix: **View**, **Create**, **Edit**, **Delete**, **Approve**, **Export** across all 14 QA modules.
- Live interactive RBAC matrix editor.
- **Super Admin Unrestricted Access**: The Super Admin has global bypass authority across all projects, modules, and configurations.
- **Quick Persona Switcher**: In the top header, switch instantly between any of the 7 personas to simulate and verify RBAC enforcement live.

### 4. Project Management
- Multi-project workspace management: create, edit, deactivate, and manage projects.
- Assign QA Leads and team members to projects.
- Module toggles per project (enable/disable specific testing verticals per project).

### 5. Test Case Management
- Create, edit, delete, import, export, and manage test cases.
- Assign test cases to QA engineers.
- Track execution status: **Pass**, **Fail**, **Blocked**, and **Not Run**.
- Bulk execution updates and CSV export.

### 6. Defect Management
- Full defect lifecycle: `Open` ➔ `In Progress` ➔ `Resolved` ➔ `Retest` ➔ `Closed` / `Reopened` / `Deferred`.
- Track severity (Critical, Major, Medium, Minor), priority (P1-P4), status, assignee, and reporter.
- Reopen workflow with reason capture and reopen counter.
- Close defects following QA verification.

### 7. QA Testing Modules
Dedicated verticals for all testing domains:
- **Functional Testing**: Feature-by-feature verification suites.
- **Regression Testing**: Re-run passes across sprint builds.
- **Smoke & Sanity Testing**: Fast-feedback build gates.
- **Performance Testing**: Response time benchmarks, p95/p99 SLA tracking, error rates, throughput.
- **Security (VAPT) Testing**: OWASP Top 10 vulnerabilities, CVSS scores, remediation tracking.
- **Cross-Browser Testing**: Compatibility matrix across 10 desktop browser engines.
- **Mobile & Responsive Testing**: Mobile browser viewports and device compatibility.

### 8. Evidence & Document Management
- Upload, inspect, download, and manage screenshots, reproduction videos, HAR logs, and test evidence.

### 9. Reports & Analytics
- Multi-format report generator: Executive Quality Digest, Test Execution Summary, Defect Density & Aging, VAPT Compliance Matrix, and API Performance Reports.
- Export in PDF and Excel / CSV formats, plus print-ready view.

### 10. Environment & Release Management
- Manage QA, UAT, Staging, and Production environment statuses and URLs.
- Manage release candidate builds and track QA Lead sign-off gates.

### 11. Audit Logs
- Complete immutable audit history tracking actor, role, timestamp, action (CREATE, UPDATE, DELETE, ASSIGN, APPROVE, REOPEN, CLOSE, DEACTIVATE), and entity deltas.

### 12. System Configuration
- Configure defect severity and priority resolution SLAs.
- Configure test execution statuses and application notification rules.

### 13. Notifications
- Real-time in-app notification center for assignments, status changes, approvals, and security alerts.

### 14. Data Management
- Full platform JSON backup export.
- Bulk CSV/Excel data ingestion.
- Historical project data archival.
