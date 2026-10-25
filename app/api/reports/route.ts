import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import { ReportsByKey } from "@/lib/types";

export async function GET() {
  try {
    await execDb(`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT FALSE;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_at timestamp;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_by text;
    `).catch(() => {});

    const rows = await queryDb<any>(`
      SELECT key, file_name, format, size_bytes, uploaded_by, 
             TO_CHAR(uploaded_date, 'YYYY-MM-DD') as uploaded_date, 
             version, comments,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM reports
      ORDER BY created_at DESC
    `);

    const reportsObj: ReportsByKey = {};
    for (const r of rows) {
      reportsObj[r.key] = {
        key: r.key,
        fileName: r.file_name,
        format: r.format as "PDF" | "Excel",
        size: r.size_bytes ? `${Math.round(r.size_bytes / 1024)} KB` : "45 KB",
        uploadedBy: r.uploaded_by || "QA Team",
        date: r.uploaded_date || new Date().toISOString().slice(0, 10),
        version: r.version || "1.0",
        comments: r.comments || "",
        hasBlob: true,
        is_deleted: r.is_deleted,
        deleted_at: r.deleted_at,
        deleted_by: r.deleted_by,
      };
    }

    return NextResponse.json({ ok: true, reports: reportsObj });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: error.message || "Failed to load reports" }, { status: 500 });
  }
}
