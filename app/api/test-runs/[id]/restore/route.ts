import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// POST /api/test-runs/[id]/restore - Restore a soft-deleted test run from the Recycle Bin
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const runId = parseInt(id, 10);
    if (isNaN(runId)) {
      return NextResponse.json({ error: "Invalid test run ID" }, { status: 400 });
    }

    const sql = `
      UPDATE test_runs 
      SET is_deleted = FALSE, 
          deleted_at = NULL, 
          deleted_by = NULL
      WHERE id = ${runId}
      RETURNING *;
    `;
    const res = await queryDb(sql);

    if (res.length === 0) {
      return NextResponse.json({ error: "Test run not found in Recycle Bin" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, restored: true, testRun: res[0] });
  } catch (error: any) {
    console.error("POST /api/test-runs/[id]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore test run" }, { status: 500 });
  }
}
