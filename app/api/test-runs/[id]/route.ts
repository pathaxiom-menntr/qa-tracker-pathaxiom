import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// PUT /api/test-runs/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const runId = parseInt(id, 10);
    if (isNaN(runId)) {
      return NextResponse.json({ error: "Invalid test run ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, status, environment, summary, test_cases, completed_at, assigned_to } = body;

    const updates: string[] = [];

    if (title) updates.push(`title = '${title.trim().replace(/'/g, "''")}'`);
    if (status) updates.push(`status = '${status.trim().replace(/'/g, "''")}'`);
    if (environment) updates.push(`environment = '${environment.trim().replace(/'/g, "''")}'`);
    if (assigned_to !== undefined) updates.push(`assigned_to = '${assigned_to.trim().replace(/'/g, "''")}'`);
    if (summary !== undefined) updates.push(`summary = '${(summary || "").replace(/'/g, "''")}'`);
    if (completed_at !== undefined) {
      updates.push(completed_at ? `completed_at = '${completed_at}'` : `completed_at = NULL`);
    }
    if (test_cases !== undefined) {
      updates.push(`test_cases = '${JSON.stringify(test_cases).replace(/'/g, "''")}'::jsonb`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const sql = `UPDATE test_runs SET ${updates.join(", ")} WHERE id = ${runId} RETURNING id, run_id, title, project_name, project_code, client_name, environment, status, created_by, assigned_to, created_at, completed_at, summary, test_cases;`;
    const res = await queryDb(sql);

    if (!res || res.length === 0) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, testRun: res[0] });
  } catch (error: any) {
    console.error("PUT /api/test-runs/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update test run" }, { status: 500 });
  }
}

// DELETE /api/test-runs/[id] - Soft delete to Recycle Bin (or permanently purge if ?purge=true)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const runId = parseInt(id, 10);
    if (isNaN(runId)) {
      return NextResponse.json({ error: "Invalid test run ID" }, { status: 400 });
    }
    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";
    const deletedBy = searchParams.get("deleted_by") || "QA Team";

    if (purge) {
      await queryDb(`DELETE FROM test_runs WHERE id = ${runId}`);
      return NextResponse.json({ ok: true, purged: true, message: `Test run ${runId} permanently purged` });
    } else {
      await queryDb(`
        UPDATE test_runs 
        SET is_deleted = TRUE, 
            deleted_at = NOW(), 
            deleted_by = '${deletedBy.replace(/'/g, "''")}' 
        WHERE id = ${runId}
      `);
      return NextResponse.json({ ok: true, soft_deleted: true, message: `Test run ${runId} moved to Recycle Bin` });
    }
  } catch (error: any) {
    console.error("DELETE /api/test-runs/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete test run" }, { status: 500 });
  }
}
