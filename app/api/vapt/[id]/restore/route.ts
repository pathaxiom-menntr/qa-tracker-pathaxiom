import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const findingId = parseInt(id, 10);
    if (isNaN(findingId)) {
      return NextResponse.json({ error: "Invalid finding ID" }, { status: 400 });
    }

    await execDb(`
      UPDATE vapt_findings
      SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL
      WHERE id = ${findingId}
    `);

    const updated = await queryDb<any>(`
      SELECT id, title, severity, status,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM vapt_findings
      WHERE id = ${findingId}
    `);

    return NextResponse.json({ ok: true, restored: true, finding: updated[0] });
  } catch (error: any) {
    console.error("POST /api/vapt/[id]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore VAPT finding" }, { status: 500 });
  }
}
