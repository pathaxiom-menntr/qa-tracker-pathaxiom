import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

// PUT /api/defects/[id] - Update defect details
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const body = await req.json();
    const {
      title,
      description,
      module,
      feature,
      severity,
      priority,
      status,
      assignee,
      client_name,
      project_name,
      project_code,
      updated_by = "QA Team",
    } = body;

    const updates: string[] = ["updated_at = NOW()", `updated_by = '${updated_by.replace(/'/g, "''")}'`];

    if (title !== undefined) updates.push(`title = '${title.replace(/'/g, "''")}'`);
    if (description !== undefined) updates.push(`description = '${description.replace(/'/g, "''")}'`);
    if (module !== undefined) updates.push(`module = '${module.replace(/'/g, "''")}'`);
    if (feature !== undefined) updates.push(`feature = '${feature.replace(/'/g, "''")}'`);
    if (severity !== undefined) updates.push(`severity = '${severity.replace(/'/g, "''")}'`);
    if (priority !== undefined) updates.push(`priority = '${priority.replace(/'/g, "''")}'`);
    if (status !== undefined) updates.push(`status = '${status.replace(/'/g, "''")}'`);
    if (assignee !== undefined) updates.push(`assignee = '${assignee.replace(/'/g, "''")}'`);
    if (client_name !== undefined) updates.push(`client_name = '${client_name.replace(/'/g, "''")}'`);
    if (project_name !== undefined) updates.push(`project_name = '${project_name.replace(/'/g, "''")}'`);
    if (project_code !== undefined) updates.push(`project_code = '${project_code.replace(/'/g, "''")}'`);

    const sql = `UPDATE defects SET ${updates.join(", ")} WHERE id = '${cleanId.replace(/'/g, "''")}' RETURNING *;`;
    const res = await queryDb(sql);

    if (res.length === 0) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, defect: res[0] });
  } catch (error: any) {
    console.error("PUT /api/defects/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update defect" }, { status: 500 });
  }
}

// DELETE /api/defects/[id] - Delete a defect
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    await execDb(`DELETE FROM defects WHERE id = '${cleanId.replace(/'/g, "''")}';`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/defects/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete defect" }, { status: 500 });
  }
}
