import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { getCaller } from "@/lib/auth-check";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/projects/[id] - Update project details with RBAC & tenant scoping
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to update projects." }, { status: 401 });
    }

    const { id } = await params;
    const projId = parseInt(id, 10);
    if (isNaN(projId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify existing project
    const existing = await queryDb<{ id: number; client_name: string; client_names: any }>(
      `SELECT id, client_name, client_names FROM projects WHERE id = ${projId}`
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const currentProj = existing[0];

    // Multi-tenant check
    if (caller.role !== "Super Admin") {
      const callerClient = (caller.client_name || "").toLowerCase();
      const projClient = (currentProj.client_name || "").toLowerCase();
      const clientNames = Array.isArray(currentProj.client_names)
        ? currentProj.client_names.map((c: string) => (c || "").toLowerCase())
        : [];

      if (!callerClient || (callerClient !== projClient && !clientNames.includes(callerClient))) {
        return NextResponse.json(
          { error: "Access denied. You can only manage projects belonging to your organization." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    let { name, client_name, client_names, is_shared, description, modules, features, assigned_user_ids } = body;

    // Prevent changing project client organization for non-superadmin
    if (caller.role !== "Super Admin") {
      client_name = currentProj.client_name;
      client_names = [currentProj.client_name];
      is_shared = false;
    }

    const updates: string[] = ["updated_at = NOW()"];

    if (name) updates.push(`name = '${name.replace(/'/g, "''")}'`);
    if (client_name) updates.push(`client_name = '${client_name.replace(/'/g, "''")}'`);
    if (client_names !== undefined) updates.push(`client_names = '${JSON.stringify(client_names).replace(/'/g, "''")}'::jsonb`);
    if (is_shared !== undefined) updates.push(`is_shared = ${is_shared ? "true" : "false"}`);
    if (description !== undefined) updates.push(`description = '${(description || "").replace(/'/g, "''")}'`);
    if (modules) updates.push(`modules = '${JSON.stringify(modules).replace(/'/g, "''")}'::jsonb`);
    if (features) updates.push(`features = '${JSON.stringify(features).replace(/'/g, "''")}'::jsonb`);
    if (assigned_user_ids) updates.push(`assigned_user_ids = '${JSON.stringify(assigned_user_ids).replace(/'/g, "''")}'::jsonb`);

    const sql = `UPDATE projects SET ${updates.join(", ")} WHERE id = ${projId} RETURNING *;`;
    const res = await queryDb(sql);

    if (res.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, project: res[0] });
  } catch (error: any) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Soft delete to Recycle Bin (or permanently purge if ?purge=true)
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to delete projects." }, { status: 401 });
    }

    const { id } = await params;
    const projId = parseInt(id, 10);
    if (isNaN(projId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }
    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";
    const deletedBy = searchParams.get("deleted_by") || caller.name || "Admin";

    // Verify existing project
    const existing = await queryDb<{ id: number; client_name: string; client_names: any }>(
      `SELECT id, client_name, client_names FROM projects WHERE id = ${projId}`
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const currentProj = existing[0];

    // Multi-tenant check
    if (caller.role !== "Super Admin") {
      const callerClient = (caller.client_name || "").toLowerCase();
      const projClient = (currentProj.client_name || "").toLowerCase();
      const clientNames = Array.isArray(currentProj.client_names)
        ? currentProj.client_names.map((c: string) => (c || "").toLowerCase())
        : [];

      if (!callerClient || (callerClient !== projClient && !clientNames.includes(callerClient))) {
        return NextResponse.json(
          { error: "Access denied. You can only delete projects belonging to your organization." },
          { status: 403 }
        );
      }

      if (purge) {
        return NextResponse.json(
          { error: "Only Super Admin is authorized to permanently purge projects." },
          { status: 403 }
        );
      }
    }

    if (purge) {
      await queryDb(`DELETE FROM projects WHERE id = ${projId}`);
      return NextResponse.json({ ok: true, purged: true, message: `Project ${projId} permanently purged` });
    } else {
      await queryDb(`
        UPDATE projects 
        SET is_deleted = TRUE, 
            deleted_at = NOW(), 
            deleted_by = '${deletedBy.replace(/'/g, "''")}' 
        WHERE id = ${projId}
      `);
      return NextResponse.json({ ok: true, soft_deleted: true, message: `Project ${projId} moved to Recycle Bin` });
    }
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete project" }, { status: 500 });
  }
}
