-- =============================================================================
-- QA TRACKER ENTERPRISE — MASTER DATABASE SCHEMA & MIGRATION SCRIPT
-- =============================================================================
-- This script idempotently creates and aligns all 8 required tables:
--   1. users            - Authentication, RBAC, tenant isolation & account lockouts
--   2. projects         - Workspace hierarchy, modules & features configuration
--   3. defects          - End-to-end defect tracking lifecycle & attachments
--   4. cross_browsers   - Browser compatibility matrix (10 desktop/mobile engines)
--   5. test_portals     - Portal-based test suites (Admin, Student, Corporate)
--   6. reports          - Multi-format test audit & compliance documents
--   7. test_runs        - Execution cycles, test cases, passes & defect linkage
--   8. vapt_findings    - Security vulnerabilities, OWASP Top 10 & CVSS statuses
--
-- Plus supporting dashboard telemetry tables (platform_compat, perf_endpoints)
-- Compatible with:
--   - Fresh local PostgreSQL databases
--   - Docker Compose (/docker-entrypoint-initdb.d/01_init.sql)
--   - Microsoft Azure Container Apps & Azure Database for PostgreSQL Flexible Server
-- =============================================================================

-- =============================================================================
-- 1. USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id                     SERIAL PRIMARY KEY,
  name                   TEXT NOT NULL,
  email                  TEXT UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL,
  role                   TEXT NOT NULL DEFAULT 'QA Engineer',
  status                 TEXT NOT NULL DEFAULT 'active',
  client_name            TEXT DEFAULT NULL,
  assigned_projects      JSONB DEFAULT '[]'::jsonb,
  permissions            JSONB DEFAULT '[]'::jsonb,
  failed_login_attempts  INT NOT NULL DEFAULT 0,
  locked_until           TIMESTAMPTZ DEFAULT NULL,
  is_deleted             BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at             TIMESTAMPTZ DEFAULT NULL,
  deleted_by             TEXT DEFAULT '',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist for existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'QA Engineer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_projects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_client ON users (client_name);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users (is_deleted);

-- =============================================================================
-- 2. PROJECTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id                 SERIAL PRIMARY KEY,
  code               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  client_name        TEXT NOT NULL DEFAULT 'PathAxiom',
  client_names       JSONB DEFAULT '[]'::jsonb,
  is_shared          BOOLEAN NOT NULL DEFAULT FALSE,
  description        TEXT DEFAULT '',
  modules            JSONB DEFAULT '["Admin Portal", "Assessment Flow", "Coding Worker", "User Management", "Analytics"]'::jsonb,
  features           JSONB DEFAULT '{"Admin Portal": ["User CRUD", "Roles and Permissions", "Test Config"], "Assessment Flow": ["Test Launch", "Timer Service", "Submission Flow"], "Coding Worker": ["Docker Sandbox", "Execution Engine", "Output Diff"], "User Management": ["Account Provisioning", "Status Toggle", "Password Reset"], "Analytics": ["Score Aggregation", "Cohort Reports"]}'::jsonb,
  assigned_user_ids  JSONB DEFAULT '[]'::jsonb,
  is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at         TIMESTAMPTZ DEFAULT NULL,
  deleted_by         TEXT DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'PathAxiom';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_names JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '["Admin Portal", "Assessment Flow", "Coding Worker", "User Management", "Analytics"]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"Admin Portal": ["User CRUD", "Roles and Permissions", "Test Config"], "Assessment Flow": ["Test Launch", "Timer Service", "Submission Flow"], "Coding Worker": ["Docker Sandbox", "Execution Engine", "Output Diff"], "User Management": ["Account Provisioning", "Status Toggle", "Password Reset"], "Analytics": ["Score Aggregation", "Cohort Reports"]}'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_user_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects (code);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (client_name);
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects (is_deleted);

-- =============================================================================
-- 3. DEFECTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS defects (
  id           TEXT PRIMARY KEY,
  client_name  TEXT NOT NULL DEFAULT 'PathAxiom',
  project_name TEXT NOT NULL DEFAULT 'Assessment Platform',
  project_code TEXT NOT NULL DEFAULT 'PRJ-001',
  module       TEXT NOT NULL,
  feature      TEXT NOT NULL DEFAULT 'General',
  severity     TEXT NOT NULL DEFAULT 'Medium',
  priority     TEXT NOT NULL DEFAULT 'Medium',
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'Open',
  created_by   TEXT DEFAULT 'QA Team',
  assignee     TEXT DEFAULT 'Unassigned',
  updated_by   TEXT DEFAULT '',
  attachments  JSONB DEFAULT '[]'::jsonb,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at   TIMESTAMPTZ DEFAULT NULL,
  deleted_by   TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE defects ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'PathAxiom';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS project_name TEXT NOT NULL DEFAULT 'Assessment Platform';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS project_code TEXT NOT NULL DEFAULT 'PRJ-001';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS feature TEXT NOT NULL DEFAULT 'General';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'Medium';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Medium';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Open';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'QA Team';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS assignee TEXT DEFAULT 'Unassigned';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT '';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_defects_module ON defects (module);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects (status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects (severity);
CREATE INDEX IF NOT EXISTS idx_defects_priority ON defects (priority);
CREATE INDEX IF NOT EXISTS idx_defects_project_code ON defects (project_code);
CREATE INDEX IF NOT EXISTS idx_defects_client_name ON defects (client_name);
CREATE INDEX IF NOT EXISTS idx_defects_deleted ON defects (is_deleted);

-- =============================================================================
-- 4. CROSS_BROWSERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cross_browsers (
  id          SERIAL PRIMARY KEY,
  browser     TEXT UNIQUE NOT NULL,
  engine      TEXT NOT NULL,
  version     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Pass',
  remark      TEXT DEFAULT '',
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ DEFAULT NULL,
  deleted_by  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS engine TEXT NOT NULL DEFAULT 'Blink';
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT 'Latest';
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pass';
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS remark TEXT DEFAULT '';
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE cross_browsers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cross_browsers_browser ON cross_browsers (browser);
CREATE INDEX IF NOT EXISTS idx_cross_browsers_status ON cross_browsers (status);
CREATE INDEX IF NOT EXISTS idx_cross_browsers_deleted ON cross_browsers (is_deleted);

-- =============================================================================
-- 5. TEST_PORTALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS test_portals (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  smoke       INT NOT NULL DEFAULT 0,
  functional  INT NOT NULL DEFAULT 0,
  regression  INT NOT NULL DEFAULT 0,
  total       INT NOT NULL DEFAULT 0,
  high_p      INT DEFAULT 0,
  med_p       INT DEFAULT 0,
  low_p       INT DEFAULT 0,
  passed      INT DEFAULT 0,
  failed      INT DEFAULT 0,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ DEFAULT NULL,
  deleted_by  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS smoke INT NOT NULL DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS functional INT NOT NULL DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS regression INT NOT NULL DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS total INT NOT NULL DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS high_p INT DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS med_p INT DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS low_p INT DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS passed INT DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS failed INT DEFAULT 0;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_test_portals_name ON test_portals (name);
CREATE INDEX IF NOT EXISTS idx_test_portals_deleted ON test_portals (is_deleted);

-- =============================================================================
-- 6. REPORTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS reports (
  key            TEXT PRIMARY KEY,
  file_name      TEXT NOT NULL,
  stored_path    TEXT NOT NULL DEFAULT '',
  format         TEXT NOT NULL DEFAULT 'PDF',
  size_bytes     BIGINT NOT NULL DEFAULT 0,
  uploaded_by    TEXT DEFAULT 'You',
  uploaded_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  version        TEXT NOT NULL DEFAULT '1.0',
  comments       TEXT DEFAULT '',
  is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at     TIMESTAMPTZ DEFAULT NULL,
  deleted_by     TEXT DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reports ADD COLUMN IF NOT EXISTS stored_path TEXT NOT NULL DEFAULT '';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'PDF';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS size_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS uploaded_by TEXT DEFAULT 'You';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS uploaded_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_reports_key ON reports (key);
CREATE INDEX IF NOT EXISTS idx_reports_format ON reports (format);
CREATE INDEX IF NOT EXISTS idx_reports_deleted ON reports (is_deleted);

-- =============================================================================
-- 7. TEST_RUNS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS test_runs (
  id            SERIAL PRIMARY KEY,
  run_id        TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  project_name  TEXT NOT NULL DEFAULT 'Assessment Platform',
  project_code  TEXT NOT NULL DEFAULT 'PRJ-001',
  client_name   TEXT NOT NULL DEFAULT 'PathAxiom',
  environment   TEXT NOT NULL DEFAULT 'Staging',
  status        TEXT NOT NULL DEFAULT 'In Progress',
  created_by    TEXT NOT NULL DEFAULT 'Alex Vance',
  assigned_to   TEXT NOT NULL DEFAULT 'Alex Vance',
  summary       TEXT DEFAULT '',
  test_cases    JSONB DEFAULT '[]'::jsonb,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at    TIMESTAMPTZ DEFAULT NULL,
  deleted_by    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS project_name TEXT NOT NULL DEFAULT 'Assessment Platform';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS project_code TEXT NOT NULL DEFAULT 'PRJ-001';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'PathAxiom';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'Staging';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'In Progress';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'Alex Vance';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS assigned_to TEXT NOT NULL DEFAULT 'Alex Vance';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_test_runs_run_id ON test_runs (run_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_project ON test_runs (project_code);
CREATE INDEX IF NOT EXISTS idx_test_runs_client ON test_runs (client_name);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs (status);
CREATE INDEX IF NOT EXISTS idx_test_runs_deleted ON test_runs (is_deleted);

-- =============================================================================
-- 8. VAPT_FINDINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS vapt_findings (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'Medium',
  status      TEXT NOT NULL DEFAULT 'Open',
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ DEFAULT NULL,
  deleted_by  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'Medium';
ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Open';
ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '';
ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vapt_findings_status ON vapt_findings (status);
CREATE INDEX IF NOT EXISTS idx_vapt_findings_severity ON vapt_findings (severity);
CREATE INDEX IF NOT EXISTS idx_vapt_findings_deleted ON vapt_findings (is_deleted);

-- =============================================================================
-- SUPPORTING TABLES: PLATFORM & PERFORMANCE COMPATIBILITY
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_compat (
  id          SERIAL PRIMARY KEY,
  platform    TEXT UNIQUE NOT NULL,
  total       INT NOT NULL DEFAULT 0,
  working     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perf_endpoints (
  id          SERIAL PRIMARY KEY,
  endpoint    TEXT UNIQUE NOT NULL,
  avg_ms      NUMERIC NOT NULL,
  p95_ms      NUMERIC,
  p99_ms      NUMERIC,
  err_pct     NUMERIC DEFAULT 0,
  max_ms      NUMERIC,
  category    TEXT NOT NULL DEFAULT 'fast',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA (Idempotent: Uses ON CONFLICT DO NOTHING / existence checks)
-- =============================================================================

-- 1. Seed Users (Default Super Admin, QA Lead, QA Engineer)
-- Password for all seed users is 'password123'
INSERT INTO users (name, email, password_hash, role, status, client_name, assigned_projects, permissions)
VALUES
(
  'Alex Vance',
  'superadmin@menntr.com',
  '$2a$10$w8T9Vv47n0XvjR5v1eWqaeu1P3E.m7P.B8I/V2lXqR6c4X7x9YmCe',
  'Super Admin',
  'active',
  'PathAxiom',
  '["PRJ-001", "PRJ-002", "PRJ-003"]'::jsonb,
  '["*"]'::jsonb
),
(
  'Sarah Connor',
  'qa.lead@pathaxiom.com',
  '$2a$10$w8T9Vv47n0XvjR5v1eWqaeu1P3E.m7P.B8I/V2lXqR6c4X7x9YmCe',
  'QA Lead',
  'active',
  'PathAxiom',
  '["PRJ-001"]'::jsonb,
  '["defects:read", "defects:write", "testcases:write"]'::jsonb
),
(
  'John Doe',
  'qa.engineer@pathaxiom.com',
  '$2a$10$w8T9Vv47n0XvjR5v1eWqaeu1P3E.m7P.B8I/V2lXqR6c4X7x9YmCe',
  'QA Engineer',
  'active',
  'PathAxiom',
  '["PRJ-001"]'::jsonb,
  '["defects:read", "defects:write"]'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Projects
INSERT INTO projects (code, name, client_name, client_names, is_shared, description, modules, features, assigned_user_ids)
VALUES 
(
  'PRJ-001', 
  'Assessment Platform', 
  'PathAxiom',
  '["PathAxiom"]'::jsonb,
  false,
  'Next-gen developer assessment engine with live code evaluation and proctoring',
  '["Admin Portal", "Assessment Flow", "Coding Worker", "User Management", "Analytics"]'::jsonb,
  '{
    "Admin Portal": ["User CRUD", "Roles and Permissions", "Test Config"],
    "Assessment Flow": ["Test Launch", "Timer Service", "Submission Flow"],
    "Coding Worker": ["Docker Sandbox", "Execution Engine", "Output Diff"],
    "User Management": ["Account Provisioning", "Status Toggle", "Password Reset"],
    "Analytics": ["Score Aggregation", "Cohort Reports"]
  }'::jsonb,
  '[]'::jsonb
),
(
  'PRJ-002', 
  'Payment Gateway & Checkout', 
  'FinTech Global',
  '["FinTech Global"]'::jsonb,
  false,
  'Multi-currency payment processing and reconciliation portal',
  '["Checkout UI", "Webhook Processing", "Refund Engine", "Merchant Dashboard"]'::jsonb,
  '{
    "Checkout UI": ["Card Input", "UPI QR Flow", "3D Secure Redirect"],
    "Webhook Processing": ["Stripe Listener", "PayPal Callback", "Retry Worker"],
    "Refund Engine": ["Partial Refunds", "Ledger Audit", "Reversal API"],
    "Merchant Dashboard": ["Settlement Reports", "API Keys Management"]
  }'::jsonb,
  '[]'::jsonb
),
(
  'PRJ-003', 
  'HealthPlus EHR Mobile', 
  'HealthPlus Systems',
  '["HealthPlus Systems"]'::jsonb,
  false,
  'HIPAA-compliant Electronic Health Record and patient telemedicine platform',
  '["Patient Records", "Telehealth Video", "Prescription Service", "Billing"]'::jsonb,
  '{
    "Patient Records": ["Vitals Sync", "Lab Results", "History Timeline"],
    "Telehealth Video": ["WebRTC Call", "Screen Sharing", "Waiting Room"],
    "Prescription Service": ["e-Rx Generation", "Pharmacy Dispatch"],
    "Billing": ["Insurance Claim", "Copay Processing"]
  }'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- 3. Seed Defects
INSERT INTO defects (id, client_name, project_name, project_code, module, feature, severity, priority, title, description, status, created_by, assignee)
VALUES
(
  'BUG-001',
  'PathAxiom',
  'Assessment Platform',
  'PRJ-001',
  'Assessment Flow',
  'Timer Service',
  'Critical',
  'High',
  'Candidate assessment timer fails to auto-submit on countdown reach zero',
  'When network jitter occurs right at 00:00, the auto-submit webhook hangs.',
  'Open',
  'Sarah Connor',
  'Dev Lead'
),
(
  'BUG-002',
  'PathAxiom',
  'Assessment Platform',
  'PRJ-001',
  'Coding Worker',
  'Docker Sandbox',
  'Major',
  'High',
  'Memory cgroup limit does not trigger SIGKILL on memory leak scripts',
  'Python infinite memory allocation loops cause worker OOM instead of sandbox isolate termination.',
  'In Progress',
  'John Doe',
  'Infrastructure Dev'
),
(
  'BUG-003',
  'PathAxiom',
  'Assessment Platform',
  'PRJ-001',
  'Admin Portal',
  'User CRUD',
  'Medium',
  'Medium',
  'User management search box is case sensitive for email addresses',
  'Searching for SuperAdmin does not match superadmin@menntr.com.',
  'Resolved',
  'Alex Vance',
  'UI Engineer'
),
(
  'BUG-201',
  'FinTech Global',
  'Payment Gateway & Checkout',
  'PRJ-002',
  'Checkout UI',
  '3D Secure Redirect',
  'Critical',
  'High',
  '3D Secure OTP verification fails on Safari Mobile',
  'When submitting the 3D secure form on iOS Safari, the callback fails with 400 Bad Request.',
  'Open',
  'QA FinTech Lead',
  'Payment Team'
),
(
  'BUG-202',
  'FinTech Global',
  'Payment Gateway & Checkout',
  'PRJ-002',
  'Refund Engine',
  'Partial Refunds',
  'Major',
  'High',
  'Partial refund creates duplicate reversal ledger entry',
  'Refunding 50% of the transaction amount creates two entries of 50% in the database ledger.',
  'In Progress',
  'Alex Vance',
  'Ledger Engineer'
),
(
  'BUG-301',
  'HealthPlus Systems',
  'HealthPlus EHR Mobile',
  'PRJ-003',
  'Telehealth Video',
  'WebRTC Call',
  'Critical',
  'High',
  'Video feed disconnects after 15 minutes of consultation',
  'ICE candidate renegotiation fails after turn server lease expiry.',
  'Open',
  'Health QA Lead',
  'Video Team'
),
(
  'BUG-302',
  'HealthPlus Systems',
  'HealthPlus EHR Mobile',
  'PRJ-003',
  'Prescription Service',
  'e-Rx Generation',
  'Medium',
  'Medium',
  'Prescription PDF download missing doctor digital signature badge',
  'Rendered PDF has an empty placeholder where the digital signature certificate was expected.',
  'Closed',
  'Doctor App Tester',
  'PDF Service Dev'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Cross-Browser Compatibility Matrix
INSERT INTO cross_browsers (browser, engine, version, status, remark)
VALUES
('Google Chrome', 'Blink', '149.0.7827.156', 'Pass', 'All modules verified'),
('Microsoft Edge', 'Blink', '149.0.4022.9', 'Pass', 'Full WebRTC & hardware acceleration pass'),
('Mozilla Firefox', 'Gecko', '152.0.3', 'Pass', 'Passed full execution cycle'),
('Apple Safari', 'WebKit', '18.1', 'Pass', 'Verified on macOS and iPadOS'),
('Opera', 'Blink', '132.0.5905.73', 'Pass', 'Verified built-in VPN compatible'),
('Brave', 'Blink', 'v1.91.180', 'Pass', 'Shields down exception validated'),
('Samsung Internet', 'Blink', '30.0.2.35', 'Pass', 'Mobile viewport verified'),
('DuckDuckGo Browser', 'WebKit/Blink', '0.163.2', 'Pass', 'Passed smoke suite'),
('Arc Browser', 'Blink/WebKit', '1.101.0', 'Pass', 'Spaces & split views verified'),
('Tor Browser', 'Gecko', '15.0.16', 'Fail', 'Page reload required under circuit switch')
ON CONFLICT (browser) DO NOTHING;

-- 5. Seed Test Portals
INSERT INTO test_portals (name, smoke, functional, regression, total, high_p, med_p, low_p, passed, failed)
VALUES
('Admin Portal', 85, 351, 100, 536, 397, 131, 8, 528, 8),
('Student Portal', 25, 179, 40, 244, 180, 54, 10, 240, 4),
('Corporate Portal', 24, 160, 40, 224, 150, 60, 14, 218, 6)
ON CONFLICT (name) DO NOTHING;

-- 6. Seed Reports
INSERT INTO reports (key, file_name, stored_path, format, size_bytes, uploaded_by, uploaded_date, version, comments)
VALUES
('executive', 'Executive_Quality_Digest_Q3.pdf', 'reports/Executive_Quality_Digest_Q3.pdf', 'PDF', 248576, 'Alex Vance', CURRENT_DATE, '1.2', 'Executive quality summary and release readiness report'),
('testcase', 'Test_Execution_Summary_Sprint25.xlsx', 'reports/Test_Execution_Summary_Sprint25.xlsx', 'Excel', 114688, 'Sarah Connor', CURRENT_DATE, '2.0', 'Complete test case run metrics by portal'),
('vapt', 'VAPT_Compliance_Matrix_2026.pdf', 'reports/VAPT_Compliance_Matrix_2026.pdf', 'PDF', 524288, 'Security Team', CURRENT_DATE, '1.0', 'Third-party vulnerability assessment audit sign-off'),
('performance', 'API_Performance_Latency_Benchmarks.xlsx', 'reports/API_Performance_Latency_Benchmarks.xlsx', 'Excel', 98304, 'Alex Vance', CURRENT_DATE, '1.5', 'P95 and P99 latency SLA benchmarks')
ON CONFLICT (key) DO NOTHING;

-- 7. Seed Test Runs
INSERT INTO test_runs (run_id, title, project_name, project_code, client_name, environment, status, created_by, assigned_to, summary, test_cases)
VALUES
(
  'RUN-2026-001',
  'Sprint 25 Platform Regression & Evaluation Run',
  'Assessment Platform',
  'PRJ-001',
  'PathAxiom',
  'Staging',
  'In Progress',
  'Alex Vance',
  'Alex Vance',
  'Comprehensive regression test suite verifying core candidate flow, proctoring, and sandbox evaluator.',
  '[
    {
      "id": "TC-101",
      "title": "Verify user authentication with valid credentials and MFA OTP",
      "module": "Admin Portal",
      "feature": "Roles and Permissions",
      "type": "Smoke",
      "priority": "Critical",
      "preconditions": "User registered with active status and MFA secret enabled",
      "steps": ["Navigate to /login", "Enter email and password", "Submit valid 6-digit OTP code", "Verify successful redirect to /dashboard"],
      "expectedResult": "User authenticated with JWT token and directed to role dashboard with permissions loaded",
      "actualResult": "Authenticated in 340ms, redirect smooth without flash",
      "status": "Passed",
      "executedBy": "Alex Vance",
      "executedAt": "2026-10-21T10:15:00Z",
      "durationMs": 4200,
      "notes": "MFA challenge verified under 5s"
    },
    {
      "id": "TC-102",
      "title": "Candidate assessment timer auto-submits answers on expiry",
      "module": "Assessment Flow",
      "feature": "Timer Service",
      "type": "Functional",
      "priority": "Critical",
      "preconditions": "Candidate on active assessment attempt with timer set to 30s",
      "steps": ["Launch assessment", "Allow test countdown timer to reach 00:00", "Observe auto-submit network payload and UI modal"],
      "expectedResult": "Timer triggers auto-submit modal, locks further input, and submits current answers",
      "actualResult": "Auto-submitted instantly at 00:00 without dropping pending code edits",
      "status": "Passed",
      "executedBy": "Alex Vance",
      "executedAt": "2026-10-21T10:22:00Z",
      "durationMs": 31000
    },
    {
      "id": "TC-103",
      "title": "Docker code evaluation sandbox memory limit enforcement",
      "module": "Coding Worker",
      "feature": "Docker Sandbox",
      "type": "Regression",
      "priority": "High",
      "preconditions": "Python coding question active in sandbox evaluator",
      "steps": ["Submit script allocating > 256MB RAM in infinite loop", "Trigger run evaluation", "Observe worker response and container isolation"],
      "expectedResult": "Worker terminates sandbox with Memory Limit Exceeded within 5s",
      "actualResult": "Container hung for 48s and returned HTTP 504 Gateway Timeout",
      "status": "Failed",
      "executedBy": "Alex Vance",
      "executedAt": "2026-10-21T10:35:00Z",
      "durationMs": 48000,
      "defectId": "BUG-002",
      "notes": "Cgroups memory limit exceeded signal wasn''t caught"
    }
  ]'::jsonb
),
(
  'RUN-2026-002',
  'v2.4 Pre-Release Smoke Verification',
  'Payment Gateway & Checkout',
  'PRJ-002',
  'FinTech Global',
  'Production',
  'Completed',
  'Alex Vance',
  'Alex Vance',
  'Production verification of checkout redirect, webhook listener, and 3D Secure fallback flow.',
  '[
    {
      "id": "TC-201",
      "title": "Checkout UI renders multi-currency card form correctly",
      "module": "Checkout UI",
      "feature": "Card Input",
      "type": "Smoke",
      "priority": "Critical",
      "preconditions": "Checkout session active with USD/EUR currency",
      "steps": ["Open payment checkout URL", "Verify Luhn card number validator and CVV masking", "Submit payment with test token"],
      "expectedResult": "Form validates card brand and redirects to payment processing gateway",
      "actualResult": "Verified on desktop and mobile browsers in 280ms",
      "status": "Passed",
      "executedBy": "Alex Vance",
      "executedAt": "2026-10-20T14:10:00Z",
      "durationMs": 3500
    }
  ]'::jsonb
)
ON CONFLICT (run_id) DO NOTHING;

-- 8. Seed VAPT Findings
INSERT INTO vapt_findings (id, title, severity, status)
VALUES
(1, 'Profile Password Change & Weak Password Policy', 'Major', 'Closed'),
(2, 'Lower Version of Nginx', 'Medium', 'Closed'),
(3, 'Cross Origin Resource Sharing (CORS)', 'Major', 'Closed'),
(4, 'Weak Lockout Mechanism', 'Medium', 'Open'),
(5, 'User Enumeration — Reset Email for Non-Registered Address', 'Medium', 'Open'),
(6, 'Host Header Injection Validation', 'Major', 'Closed'),
(7, 'Vulnerable and Outdated Components', 'Medium', 'Closed'),
(8, 'Server-Side Request Forgery (SSRF)', 'Medium', 'Closed'),
(9, 'Security Misconfiguration — Improper Session Timeout', 'Major', 'Open'),
(10, 'Cryptographic Failures — Unencrypted Communication', 'High', 'Closed')
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Supporting Dashboard Tables
INSERT INTO platform_compat (platform, total, working)
VALUES
('Admin — Desktop Web', 33, 33),
('Admin — Mobile Web', 33, 33),
('Student — Desktop Web', 17, 17),
('Student — Mobile Web', 17, 13)
ON CONFLICT (platform) DO NOTHING;

INSERT INTO perf_endpoints (endpoint, avg_ms, p95_ms, p99_ms, err_pct, max_ms, category)
VALUES
('/assessments/{id}/submit-preview', 76, 96, 134, 0, NULL, 'fast'),
('/assessments/{id}/runtime', 79, 103, 142, 0, NULL, 'fast'),
('/assessments/{id}/start', 86, 113, 165, 0, NULL, 'fast'),
('/student/assignments', 88, 125, 184, 10.5, NULL, 'fast'),
('/assessments/{id}/submit', 93, 118, 151, 0, NULL, 'fast'),
('/auth/me/context', 100, 145, 185, 10.5, NULL, 'fast'),
('/assessments/{id}/consent', 101, 176, 305, 0, NULL, 'fast'),
('/answers/coding/run', 646, 604, 804, 0, 15935, 'slow'),
('/answers/coding/save', 701, 652, 10090, 0, 16040, 'slow')
ON CONFLICT (endpoint) DO NOTHING;
