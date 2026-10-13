import { NextResponse } from "next/server";
import { execDb, queryDb } from "@/lib/db";

// POST /api/defects/[id]/restore - Restore a soft-deleted defect from the Recycle Bin
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    const sql = `
      UPDATE defects 
      SET is_deleted = FALSE, 
          deleted_at = NULL, 
          deleted_by = NULL,
          updated_at = NOW()
      WHERE id = '${cleanId.replace(/'/g, "''")}'
      RETURNING *;
    `;
    const res = await queryDb(sql);

    if (res.length === 0) {
      return NextResponse.json({ error: "Defect not found in Recycle Bin" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, restored: true, defect: res[0] });
  } catch (error: any) {
    console.error("POST /api/defects/[id]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore defect" }, { status: 500 });
  }
}
