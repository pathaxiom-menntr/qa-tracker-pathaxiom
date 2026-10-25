import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);

    await execDb(`
      UPDATE reports
      SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL
      WHERE key = '${decodedKey.replace(/'/g, "''")}'
    `);

    const updated = await queryDb<any>(`
      SELECT key, file_name, format, size_bytes, uploaded_by, 
             TO_CHAR(uploaded_date, 'YYYY-MM-DD') as uploaded_date, 
             version, comments,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM reports
      WHERE key = '${decodedKey.replace(/'/g, "''")}'
    `);

    return NextResponse.json({ ok: true, restored: true, report: updated[0] });
  } catch (error: any) {
    console.error("POST /api/reports/[key]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore report" }, { status: 500 });
  }
}
