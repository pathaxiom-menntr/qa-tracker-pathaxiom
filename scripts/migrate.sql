-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  modules JSONB DEFAULT '["Admin Portal", "Assessment Flow", "Coding Worker", "User Management"]'::jsonb,
  features JSONB DEFAULT '{"Admin Portal": ["User CRUD", "Roles and Permissions"], "Assessment Flow": ["Test Launch", "Submission"], "Coding Worker": ["Execution Engine", "Output Diff"], "User Management": ["Account Provisioning", "Status Toggle"]}'::jsonb,
  assigned_user_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to defects table
ALTER TABLE defects ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT 'PathAxiom';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT 'Assessment Platform';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS project_code TEXT DEFAULT 'PRJ-001';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS feature TEXT DEFAULT 'General';
ALTER TABLE defects ADD COLUMN IF NOT EXISTS assignee TEXT DEFAULT 'Unassigned';

-- 3. Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_projects JSONB DEFAULT '[]'::jsonb;

-- 4. Seed initial projects if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
    INSERT INTO projects (code, name, client_name, description, modules, features, assigned_user_ids)
    VALUES 
    (
      'PRJ-001', 
      'Assessment Platform', 
      'PathAxiom', 
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
      'HIPAA-compliant Electronic Health Record and patient telemedicine platform',
      '["Patient Records", "Telehealth Video", "Prescription Service", "Billing"]'::jsonb,
      '{
        "Patient Records": ["Vitals Sync", "Lab Results", "History Timeline"],
        "Telehealth Video": ["WebRTC Call", "Screen Sharing", "Waiting Room"],
        "Prescription Service": ["e-Rx Generation", "Pharmacy Dispatch"],
        "Billing": ["Insurance Claim", "Copay Processing"]
      }'::jsonb,
      '[]'::jsonb
    );
  END IF;
END $$;

-- 5. Seed sample defects for FinTech Global and HealthPlus Systems if not present
INSERT INTO defects (id, client_name, project_name, project_code, module, feature, severity, priority, title, status, created_by, assignee, description)
VALUES
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
  'Open',
  'QA FinTech Lead',
  'Payment Team',
  'When submitting the 3D secure form on iOS Safari, the callback fails with 400 Bad Request.'
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
  'In Progress',
  'Alex Vance',
  'Ledger Engineer',
  'Refunding 50% of the transaction amount creates two entries of 50% in the database ledger.'
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
  'Open',
  'Health QA Lead',
  'Video Team',
  'ICE candidate renegotiation fails after turn server lease expiry.'
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
  'Closed',
  'Doctor App Tester',
  'PDF Service Dev',
  'Rendered PDF has an empty placeholder where the digital signature certificate was expected.'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Update existing PathAxiom defects
UPDATE defects 
SET client_name = 'PathAxiom', project_name = 'Assessment Platform', project_code = 'PRJ-001'
WHERE client_name IS NULL OR client_name = '' OR project_code IS NULL;

-- 7. Ensure Client users have client_name assigned
UPDATE users 
SET client_name = 'PathAxiom', assigned_projects = '["PRJ-001"]'::jsonb
WHERE role = 'Client' AND (client_name IS NULL OR client_name = '');
