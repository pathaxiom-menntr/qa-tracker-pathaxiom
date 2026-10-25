import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function GET() {
  try {
    await execDb(`
      ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT FALSE;
      ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS deleted_at timestamp;
      ALTER TABLE vapt_findings ADD COLUMN IF NOT EXISTS deleted_by text;
    `).catch(() => {});

    const rows = await queryDb<any>(`
      SELECT id, title, severity, status,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM vapt_findings
      ORDER BY id ASC
    `);

    return NextResponse.json({ ok: true, vapt: rows });
  } catch (error: any) {
    console.error("GET /api/vapt error:", error);
    return NextResponse.json({ error: error.message || "Failed to load VAPT findings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, severity = "Major", status = "Open" } = body;
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Finding title is required" }, { status: 400 });
    }

    // Get max ID
    const maxRow = await queryDb<any>(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM vapt_findings`);
    const nextId = maxRow[0]?.next_id || 1;

    const inserted = await queryDb<any>(`
      INSERT INTO vapt_findings (id, title, severity, status)
      VALUES (${nextId}, '${title.trim().replace(/'/g, "''")}', '${severity}', '${status}')
      RETURNING id, title, severity, status, is_deleted, deleted_at, deleted_by
    `);

    return NextResponse.json({ ok: true, finding: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/vapt error:", error);
    return NextResponse.json({ error: error.message || "Failed to create VAPT finding" }, { status: 500 });
  }
}
