import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// POST /api/projects/[id]/restore - Restore a soft-deleted project from the Recycle Bin
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projId = parseInt(id, 10);
    if (isNaN(projId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const sql = `
      UPDATE projects 
      SET is_deleted = FALSE, 
          deleted_at = NULL, 
          deleted_by = NULL,
          updated_at = NOW()
      WHERE id = ${projId}
      RETURNING *;
    `;
    const res = await queryDb(sql);

    if (res.length === 0) {
      return NextResponse.json({ error: "Project not found in Recycle Bin" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, restored: true, project: res[0] });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore project" }, { status: 500 });
  }
}
