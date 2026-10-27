import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { getCaller } from "@/lib/auth-check";

// GET /api/projects - Fetch projects with RBAC & tenant scoping
export async function GET(req: Request) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ ok: true, projects: [] });
    }

    let sql = `
      SELECT id, code, name, client_name, description, 
             COALESCE(client_names, '[]'::jsonb) as "client_names",
             COALESCE(is_shared, false) as "is_shared",
             COALESCE(modules, '[]'::jsonb) as modules, 
             COALESCE(features, '{}'::jsonb) as features, 
             COALESCE(assigned_user_ids, '[]'::jsonb) as "assigned_user_ids",
             created_at as "created_at", updated_at as "updated_at",
             COALESCE(is_deleted, false) as "is_deleted",
             deleted_at,
             COALESCE(deleted_by, '') as "deleted_by"
      FROM projects
    `;

    // Multi-tenant scoping: Non-Super Admin roles can only access projects associated with their organization
    if (caller.role !== "Super Admin") {
      const callerClient = (caller.client_name || "PathAxiom").replace(/'/g, "''").toLowerCase();
      const rawClient = (caller.client_name || "PathAxiom").replace(/'/g, "''");
      sql += ` WHERE (LOWER(COALESCE(client_name, '')) = '${callerClient}' OR client_names @> '["${rawClient}"]'::jsonb)`;
    }

    sql += ` ORDER BY id ASC`;

    const projects = await queryDb(sql);
    return NextResponse.json({ ok: true, projects });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to load projects" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project with RBAC & tenant scoping
export async function POST(req: Request) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to create projects." }, { status: 401 });
    }

    const body = await req.json();
    let {
      code,
      name,
      client_name = "PathAxiom",
      client_names = [],
      is_shared = false,
      description = "",
      modules = ["General"],
      features = { General: ["Core"] },
      assigned_user_ids = [],
    } = body;

    // Enforce tenant boundary for non-Super Admin
    if (caller.role !== "Super Admin") {
      client_name = caller.client_name || "PathAxiom";
      client_names = [client_name];
      is_shared = false;
    }

    if (!code || !name) {
      return NextResponse.json({ error: "Project code and name are required" }, { status: 400 });
    }

    const safeCode = code.trim().toUpperCase();
    const safeName = name.trim();
    const safeClient = client_name.trim();

    const inserted = await queryDb(
      `INSERT INTO projects (code, name, client_name, client_names, is_shared, description, modules, features, assigned_user_ids)
       VALUES (
         '${safeCode.replace(/'/g, "''")}',
         '${safeName.replace(/'/g, "''")}',
         '${safeClient.replace(/'/g, "''")}',
         '${JSON.stringify(client_names).replace(/'/g, "''")}'::jsonb,
         ${is_shared ? "true" : "false"},
         '${description.replace(/'/g, "''")}',
         '${JSON.stringify(modules).replace(/'/g, "''")}'::jsonb,
         '${JSON.stringify(features).replace(/'/g, "''")}'::jsonb,
         '${JSON.stringify(assigned_user_ids).replace(/'/g, "''")}'::jsonb
       )
       RETURNING id, code, name, client_name, client_names, is_shared, description, modules, features, assigned_user_ids, created_at`
    );

    return NextResponse.json({ ok: true, project: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
