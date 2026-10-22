import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { TestRun, TestCaseExecution } from "@/lib/types";

const SEED_TEST_RUNS = [
  {
    run_id: "RUN-2026-001",
    title: "Sprint 25 Platform Regression & Evaluation Run",
    project_name: "Assessment Platform",
    project_code: "PRJ-001",
    client_name: "PathAxiom",
    environment: "Staging",
    status: "In Progress",
    created_by: "Alex Vance",
    assigned_to: "Alex Vance",
    summary: "Comprehensive regression test suite verifying core candidate flow, proctoring, and sandbox evaluator.",
    test_cases: [
      {
        id: "TC-101",
        title: "Verify user authentication with valid credentials and MFA OTP",
        module: "Admin Portal",
        feature: "Roles and Permissions",
        type: "Smoke",
        priority: "Critical",
        preconditions: "User registered with active status and MFA secret enabled",
        steps: [
          "Navigate to /login",
          "Enter email and password",
          "Submit valid 6-digit OTP code",
          "Verify successful redirect to /dashboard"
        ],
        expectedResult: "User authenticated with JWT token and directed to role dashboard with permissions loaded",
        actualResult: "Authenticated in 340ms, redirect smooth without flash",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-21T10:15:00Z",
        durationMs: 4200,
        notes: "MFA challenge verified under 5s"
      },
      {
        id: "TC-102",
        title: "Candidate assessment timer auto-submits answers on expiry",
        module: "Assessment Flow",
        feature: "Timer Service",
        type: "Functional",
        priority: "Critical",
        preconditions: "Candidate on active assessment attempt with timer set to 30s",
        steps: [
          "Launch assessment",
          "Allow test countdown timer to reach 00:00",
          "Observe auto-submit network payload and UI modal"
        ],
        expectedResult: "Timer triggers auto-submit modal, locks further input, and submits current answers to /api/assessments/submit",
        actualResult: "Auto-submitted instantly at 00:00 without dropping pending code edits",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-21T10:22:00Z",
        durationMs: 31000
      },
      {
        id: "TC-103",
        title: "Docker code evaluation sandbox memory limit enforcement",
        module: "Coding Worker",
        feature: "Docker Sandbox",
        type: "Regression",
        priority: "High",
        preconditions: "Python coding question active in sandbox evaluator",
        steps: [
          "Submit script allocating > 256MB RAM in infinite loop",
          "Trigger run evaluation",
          "Observe worker response and container isolation"
        ],
        expectedResult: "Worker terminates sandbox with 'Memory Limit Exceeded' within 5s without crashing container host",
        actualResult: "Container hung for 48s and returned HTTP 504 Gateway Timeout instead of graceful limit signal",
        status: "Failed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-21T10:35:00Z",
        durationMs: 48000,
        defectId: "DEF-028",
        notes: "Cgroups memory limit exceeded signal wasn't caught by Node wrapper"
      },
      {
        id: "TC-104",
        title: "Proctoring webcam snapshot upload over throttled slow 3G",
        module: "Assessment Flow",
        feature: "Submission Flow",
        type: "Functional",
        priority: "Medium",
        preconditions: "Chrome DevTools network throttled to Slow 3G (400Kbps)",
        steps: [
          "Start assessment with proctoring enabled",
          "Allow scheduled webcam snapshot capture to fire",
          "Observe upload retry queue in background"
        ],
        expectedResult: "Snapshot payload uploaded asynchronously; retry queue executes 3 retries without blocking candidate UI",
        actualResult: "Uploaded successfully on 2nd retry after 1.8s backoff",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-21T10:48:00Z",
        durationMs: 8500
      },
      {
        id: "TC-105",
        title: "Candidate score aggregation and multi-page PDF generation",
        module: "Analytics",
        feature: "Cohort Reports",
        type: "Functional",
        priority: "Medium",
        preconditions: "Batch of 50 evaluated candidate submissions",
        steps: [
          "Navigate to Analytics Cohort Reports",
          "Click Export PDF Summary for current cohort",
          "Verify PDF formatting and table layout"
        ],
        expectedResult: "PDF generated within 3s with zero text overlaps or clipped tables",
        actualResult: "Blocked: Analytics reporting service currently undergoing DB index migration on staging",
        status: "Blocked",
        executedBy: "Alex Vance",
        executedAt: "2026-10-21T11:00:00Z",
        durationMs: 1200,
        notes: "Waiting on backend migration"
      },
      {
        id: "TC-106",
        title: "Account provisioning rate-limiting prevents rapid brute-force registration",
        module: "User Management",
        feature: "Account Provisioning",
        type: "Security",
        priority: "High",
        preconditions: "Anonymous client IP",
        steps: [
          "Send 10 rapid registration requests within 10 seconds",
          "Check HTTP status on 6th request"
        ],
        expectedResult: "Returns HTTP 429 Too Many Requests after 5 attempts with Retry-After header",
        status: "Untested",
        durationMs: 0
      }
    ]
  },
  {
    run_id: "RUN-2026-002",
    title: "v2.4 Pre-Release Smoke Verification",
    project_name: "Payment Gateway & Checkout",
    project_code: "PRJ-002",
    client_name: "FinTech Global",
    environment: "Production",
    status: "Completed",
    created_by: "Alex Vance",
    assigned_to: "Alex Vance",
    summary: "Production verification of checkout redirect, webhook listener, and 3D Secure fallback flow.",
    test_cases: [
      {
        id: "TC-201",
        title: "Checkout UI renders multi-currency card form correctly",
        module: "Checkout UI",
        feature: "Card Input",
        type: "Smoke",
        priority: "Critical",
        preconditions: "Checkout session active with USD/EUR currency",
        steps: [
          "Open payment checkout URL",
          "Verify Luhn card number validator and CVV masking",
          "Submit payment with test token"
        ],
        expectedResult: "Form validates card brand and redirects to payment processing gateway",
        actualResult: "Verified on desktop and mobile browsers in 280ms",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-20T14:10:00Z",
        durationMs: 3500
      },
      {
        id: "TC-202",
        title: "3D Secure 2.0 authentication redirect and callback handle",
        module: "Checkout UI",
        feature: "3D Secure Redirect",
        type: "Functional",
        priority: "Critical",
        preconditions: "3DS-enrolled test card",
        steps: [
          "Initiate charge",
          "Complete OTP on simulated bank iframe",
          "Verify merchant return URL"
        ],
        expectedResult: "3DS challenge accepted; webhook emits charge.success within 2s",
        actualResult: "Challenge callback handled cleanly",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-20T14:18:00Z",
        durationMs: 7200
      },
      {
        id: "TC-203",
        title: "Webhook listener idempotent processing for duplicate events",
        module: "Webhook Processing",
        feature: "Stripe Listener",
        type: "Regression",
        priority: "High",
        preconditions: "Webhook endpoint active",
        steps: [
          "Post identical charge.succeeded webhook payload twice with 100ms interval",
          "Inspect database transactions and ledger balances"
        ],
        expectedResult: "First event records payment; second event acknowledges 200 OK without double-crediting balance",
        actualResult: "Idempotency key prevented second ledger write as expected",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-20T14:30:00Z",
        durationMs: 1400
      },
      {
        id: "TC-204",
        title: "Partial refund engine updates ledger audit record",
        module: "Refund Engine",
        feature: "Partial Refunds",
        type: "Functional",
        priority: "High",
        preconditions: "Settled transaction for $150.00",
        steps: [
          "Call refund API with amount $50.00",
          "Check remaining balance and merchant statement"
        ],
        expectedResult: "Refund processed; remaining refundable balance displays $100.00",
        actualResult: "Ledger recorded partial debit correctly",
        status: "Passed",
        executedBy: "Alex Vance",
        executedAt: "2026-10-20T14:45:00Z",
        durationMs: 2800
      }
    ]
  }
];

export async function GET() {
  try {
    let runs = await queryDb<any>(
      `SELECT id, run_id, title, project_name, project_code, client_name, environment, status, 
              created_by, assigned_to, created_at, completed_at, summary,
              COALESCE(test_cases, '[]'::jsonb) as test_cases
       FROM test_runs
       ORDER BY id DESC`
    );

    // Auto-seed if empty
    if (!runs || runs.length === 0) {
      for (const seed of SEED_TEST_RUNS) {
        await queryDb(
          `INSERT INTO test_runs (run_id, title, project_name, project_code, client_name, environment, status, created_by, assigned_to, summary, test_cases)
           VALUES (
             '${seed.run_id}',
             '${seed.title.replace(/'/g, "''")}',
             '${seed.project_name.replace(/'/g, "''")}',
             '${seed.project_code}',
             '${seed.client_name.replace(/'/g, "''")}',
             '${seed.environment}',
             '${seed.status}',
             '${seed.created_by.replace(/'/g, "''")}',
             '${seed.assigned_to.replace(/'/g, "''")}',
             '${seed.summary.replace(/'/g, "''")}',
             '${JSON.stringify(seed.test_cases).replace(/'/g, "''")}'::jsonb
           )`
        );
      }

      runs = await queryDb<any>(
        `SELECT id, run_id, title, project_name, project_code, client_name, environment, status, 
                created_by, assigned_to, created_at, completed_at, summary,
                COALESCE(test_cases, '[]'::jsonb) as test_cases
         FROM test_runs
         ORDER BY id DESC`
      );
    }

    return NextResponse.json({ ok: true, testRuns: runs });
  } catch (error: any) {
    console.error("GET /api/test-runs error:", error);
    return NextResponse.json({ error: error.message || "Failed to load test runs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      project_name = "Assessment Platform",
      project_code = "PRJ-001",
      client_name = "PathAxiom",
      environment = "Staging",
      status = "In Progress",
      created_by = "Alex Vance",
      assigned_to = "Alex Vance",
      summary = "",
      test_cases = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Test run title is required" }, { status: 400 });
    }

    // Auto-derive run_id
    const existing = await queryDb<any>(`SELECT run_id FROM test_runs ORDER BY id DESC LIMIT 1`);
    let nextNum = 1;
    if (existing && existing.length > 0) {
      const match = existing[0].run_id.match(/RUN-\d+-(\d+)/) || existing[0].run_id.match(/RUN-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const run_id = `RUN-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;

    const inserted = await queryDb(
      `INSERT INTO test_runs (run_id, title, project_name, project_code, client_name, environment, status, created_by, assigned_to, summary, test_cases)
       VALUES (
         '${run_id}',
         '${title.trim().replace(/'/g, "''")}',
         '${project_name.trim().replace(/'/g, "''")}',
         '${project_code.trim()}',
         '${client_name.trim().replace(/'/g, "''")}',
         '${environment}',
         '${status}',
         '${created_by.trim().replace(/'/g, "''")}',
         '${assigned_to.trim().replace(/'/g, "''")}',
         '${summary.trim().replace(/'/g, "''")}',
         '${JSON.stringify(test_cases).replace(/'/g, "''")}'::jsonb
       )
       RETURNING id, run_id, title, project_name, project_code, client_name, environment, status, created_by, assigned_to, created_at, completed_at, summary, test_cases`
    );

    return NextResponse.json({ ok: true, testRun: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/test-runs error:", error);
    return NextResponse.json({ error: error.message || "Failed to create test run" }, { status: 500 });
  }
}
