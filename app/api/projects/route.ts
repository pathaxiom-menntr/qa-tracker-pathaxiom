import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// GET /api/projects - Fetch all projects with their modules and features
export async function GET() {
  try {
    const projects = await queryDb(
      `SELECT id, code, name, client_name, description, 
              COALESCE(client_names, '[]'::jsonb) as "client_names",
              COALESCE(is_shared, false) as "is_shared",
              COALESCE(modules, '[]'::jsonb) as modules, 
              COALESCE(features, '{}'::jsonb) as features, 
              COALESCE(assigned_user_ids, '[]'::jsonb) as "assigned_user_ids",
              created_at as "created_at", updated_at as "updated_at"
       FROM projects
       ORDER BY id ASC`
    );
    return NextResponse.json({ ok: true, projects });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to load projects" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
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
