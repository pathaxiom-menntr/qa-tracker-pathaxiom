import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// PUT /api/projects/[id] - Update project details, modules, features, or assignments
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, client_name, client_names, is_shared, description, modules, features, assigned_user_ids } = body;

    const updates: string[] = ["updated_at = NOW()"];

    if (name) updates.push(`name = '${name.replace(/'/g, "''")}'`);
    if (client_name) updates.push(`client_name = '${client_name.replace(/'/g, "''")}'`);
    if (client_names !== undefined) updates.push(`client_names = '${JSON.stringify(client_names).replace(/'/g, "''")}'::jsonb`);
    if (is_shared !== undefined) updates.push(`is_shared = ${is_shared ? "true" : "false"}`);
    if (description !== undefined) updates.push(`description = '${(description || "").replace(/'/g, "''")}'`);
    if (modules) updates.push(`modules = '${JSON.stringify(modules).replace(/'/g, "''")}'::jsonb`);
    if (features) updates.push(`features = '${JSON.stringify(features).replace(/'/g, "''")}'::jsonb`);
    if (assigned_user_ids) updates.push(`assigned_user_ids = '${JSON.stringify(assigned_user_ids).replace(/'/g, "''")}'::jsonb`);

    const sql = `UPDATE projects SET ${updates.join(", ")} WHERE id = ${parseInt(id, 10)} RETURNING *;`;
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

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projId = parseInt(id, 10);
    if (isNaN(projId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    await queryDb(`DELETE FROM projects WHERE id = ${projId}`);
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete project" }, { status: 500 });
  }
}
