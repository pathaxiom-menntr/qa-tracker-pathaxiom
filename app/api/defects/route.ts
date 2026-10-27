import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import { getCaller } from "@/lib/auth-check";

// GET /api/defects - Fetch defects from PostgreSQL with RBAC & tenant scoping
export async function GET(req: Request) {
  try {
    await execDb(`
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT FALSE;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_at timestamp;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_by text;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
    `).catch(() => {});

    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ ok: true, defects: [] });
    }

    const { searchParams } = new URL(req.url);
    let clientFilter = searchParams.get("client");
    const projectFilter = searchParams.get("project");

    // Strict multi-tenant enforcement: Non-Super Admin roles cannot view cross-org defects
    if (caller.role !== "Super Admin") {
      clientFilter = caller.client_name || "PathAxiom";
    }

    let sql = `
      SELECT id, 
             COALESCE(client_name, 'PathAxiom') as client_name,
             COALESCE(project_name, 'Assessment Platform') as project_name,
             COALESCE(project_code, 'PRJ-001') as project_code,
             module, 
             COALESCE(feature, 'General') as feature,
             severity, priority, title, 
             COALESCE(description, '') as description, 
             status, 
             COALESCE(created_by, 'QA Team') as created_by,
             COALESCE(assignee, 'Unassigned') as assignee,
             COALESCE(updated_by, '') as updated_by, 
             created_at, updated_at,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by,
             COALESCE(attachments, '[]'::jsonb) as attachments
      FROM defects
    `;

    const conditions: string[] = [];
    if (clientFilter && clientFilter !== "All") {
      conditions.push(`LOWER(client_name) = '${clientFilter.replace(/'/g, "''").toLowerCase()}'`);
    }
    if (projectFilter && projectFilter !== "All") {
      conditions.push(`(project_code = '${projectFilter.replace(/'/g, "''")}' OR project_name = '${projectFilter.replace(/'/g, "''")}')`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` ORDER BY id DESC;`;

    const defects = await queryDb(sql);
    return NextResponse.json({ ok: true, defects });
  } catch (error: any) {
    console.error("GET /api/defects error:", error);
    return NextResponse.json({ error: error.message || "Failed to load defects" }, { status: 500 });
  }
}

// POST /api/defects - Create a new defect in PostgreSQL with RBAC & tenant scoping
export async function POST(req: Request) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to create defects." }, { status: 401 });
    }

    const body = await req.json();
    let {
      id,
      client_name = "PathAxiom",
      project_name = "Assessment Platform",
      project_code = "PRJ-001",
      module = "General",
      feature = "General",
      severity = "Medium",
      priority = "Medium",
      title,
      description = "",
      status = "Open",
      created_by = caller.name || "QA Team",
      assignee = "Unassigned",
      attachments = [],
    } = body;

    // Enforce tenant boundary for Admin / Client
    if (caller.role !== "Super Admin") {
      client_name = caller.client_name || "PathAxiom";
    }

    if (!title || !module) {
      return NextResponse.json({ error: "Title and Module are required" }, { status: 400 });
    }

    // Auto-generate bug ID if not provided
    let bugId = (id || "").trim();
    if (!bugId) {
      const existing = await queryDb<{ id: string }>("SELECT id FROM defects ORDER BY id DESC LIMIT 50");
      const nums = existing
        .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
        .filter((n) => !isNaN(n));
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      bugId = `BUG-${String(max + 1).padStart(3, "0")}`;
    }

    const attachmentsJson = JSON.stringify(attachments || []).replace(/'/g, "''");
    const inserted = await queryDb(
      `INSERT INTO defects (id, client_name, project_name, project_code, module, feature, severity, priority, title, description, status, created_by, assignee, attachments)
       VALUES (
         '${bugId.replace(/'/g, "''")}',
         '${client_name.replace(/'/g, "''")}',
         '${project_name.replace(/'/g, "''")}',
         '${project_code.replace(/'/g, "''")}',
         '${module.replace(/'/g, "''")}',
         '${feature.replace(/'/g, "''")}',
         '${severity.replace(/'/g, "''")}',
         '${priority.replace(/'/g, "''")}',
         '${title.replace(/'/g, "''")}',
         '${(description || "").replace(/'/g, "''")}',
         '${status.replace(/'/g, "''")}',
         '${created_by.replace(/'/g, "''")}',
         '${assignee.replace(/'/g, "''")}',
         '${attachmentsJson}'::jsonb
       )
       RETURNING *;`
    );

    return NextResponse.json({ ok: true, defect: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/defects error:", error);
    return NextResponse.json({ error: error.message || "Failed to create defect" }, { status: 500 });
  }
}
