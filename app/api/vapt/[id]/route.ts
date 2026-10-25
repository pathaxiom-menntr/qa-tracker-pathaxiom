import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const findingId = parseInt(id, 10);
    if (isNaN(findingId)) {
      return NextResponse.json({ error: "Invalid finding ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, severity, status } = body;

    const updates: string[] = [];
    if (title !== undefined) updates.push(`title = '${title.trim().replace(/'/g, "''")}'`);
    if (severity !== undefined) updates.push(`severity = '${severity}'`);
    if (status !== undefined) updates.push(`status = '${status}'`);

    if (updates.length > 0) {
      await execDb(`UPDATE vapt_findings SET ${updates.join(", ")} WHERE id = ${findingId}`);
    }

    const updated = await queryDb<any>(`
      SELECT id, title, severity, status,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM vapt_findings
      WHERE id = ${findingId}
    `);

    return NextResponse.json({ ok: true, finding: updated[0] });
  } catch (error: any) {
    console.error("PUT /api/vapt/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update VAPT finding" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const findingId = parseInt(id, 10);
    if (isNaN(findingId)) {
      return NextResponse.json({ error: "Invalid finding ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";

    if (purge) {
      // Hard delete / permanent purge
      await execDb(`DELETE FROM vapt_findings WHERE id = ${findingId}`);
      return NextResponse.json({ ok: true, purged: true, id: findingId });
    } else {
      // Soft delete: move to Recycle Bin
      await execDb(`
        UPDATE vapt_findings
        SET is_deleted = TRUE, deleted_at = NOW()
        WHERE id = ${findingId}
      `);
      return NextResponse.json({ ok: true, softDeleted: true, id: findingId });
    }
  } catch (error: any) {
    console.error("DELETE /api/vapt/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete VAPT finding" }, { status: 500 });
  }
}
