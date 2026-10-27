import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import { getCaller } from "@/lib/auth-check";

// PUT /api/defects/[id] - Update defect details with RBAC & tenant scoping
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to update defects." }, { status: 401 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    // Verify defect exists and check tenant boundary
    const existing = await queryDb<{ id: string; client_name: string | null }>(
      `SELECT id, client_name FROM defects WHERE id = '${cleanId.replace(/'/g, "''")}'`
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }
    const currentDefect = existing[0];

    if (caller.role !== "Super Admin") {
      const callerClient = (caller.client_name || "").toLowerCase();
      const defectClient = (currentDefect.client_name || "").toLowerCase();
      if (!callerClient || callerClient !== defectClient) {
        return NextResponse.json(
          { error: "Access denied. You can only modify defects belonging to your organization." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    let {
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
      updated_by = caller.name || "QA Team",
    } = body;

    // Prevent changing client_name to another organization for non-superadmin
    if (caller.role !== "Super Admin") {
      client_name = caller.client_name || currentDefect.client_name;
    }

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
    if (body.attachments !== undefined) {
      const attachmentsJson = JSON.stringify(body.attachments || []).replace(/'/g, "''");
      updates.push(`attachments = '${attachmentsJson}'::jsonb`);
    }
    if (body.is_deleted !== undefined) {
      updates.push(`is_deleted = ${body.is_deleted ? "TRUE" : "FALSE"}`);
      if (!body.is_deleted) {
        updates.push("deleted_at = NULL", "deleted_by = NULL");
      }
    }

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

// DELETE /api/defects/[id] - Soft delete to Recycle Bin (or permanently purge if ?purge=true)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to delete defects." }, { status: 401 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";
    const deletedBy = searchParams.get("deleted_by") || caller.name || "QA Team";

    // Verify defect exists and check tenant boundary
    const existing = await queryDb<{ id: string; client_name: string | null }>(
      `SELECT id, client_name FROM defects WHERE id = '${cleanId.replace(/'/g, "''")}'`
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }
    const currentDefect = existing[0];

    if (caller.role !== "Super Admin") {
      const callerClient = (caller.client_name || "").toLowerCase();
      const defectClient = (currentDefect.client_name || "").toLowerCase();
      if (!callerClient || callerClient !== defectClient) {
        return NextResponse.json(
          { error: "Access denied. You can only delete defects belonging to your organization." },
          { status: 403 }
        );
      }

      if (purge) {
        return NextResponse.json(
          { error: "Only Super Admin is authorized to permanently purge defects." },
          { status: 403 }
        );
      }
    }

    await execDb(`
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT FALSE;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_at timestamp;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_by text;
    `).catch(() => {});

    if (purge) {
      await execDb(`DELETE FROM defects WHERE id = '${cleanId.replace(/'/g, "''")}';`);
      return NextResponse.json({ ok: true, purged: true });
    } else {
      await execDb(`
        UPDATE defects 
        SET is_deleted = TRUE, 
            deleted_at = NOW(), 
            deleted_by = '${deletedBy.replace(/'/g, "''")}' 
        WHERE id = '${cleanId.replace(/'/g, "''")}';
      `);
      return NextResponse.json({ ok: true, soft_deleted: true });
    }
  } catch (error: any) {
    console.error("DELETE /api/defects/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete defect" }, { status: 500 });
  }
}
