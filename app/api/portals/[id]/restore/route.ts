import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portalId = parseInt(id, 10);
    if (isNaN(portalId)) {
      return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });
    }

    await execDb(`
      UPDATE test_portals
      SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL
      WHERE id = ${portalId}
    `);

    const updated = await queryDb<any>(`
      SELECT id, name, smoke, functional, regression, total,
             high_p as "highP", med_p as "medP", low_p as "lowP",
             passed, failed,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM test_portals
      WHERE id = ${portalId}
    `);

    return NextResponse.json({ ok: true, restored: true, portal: updated[0] });
  } catch (error: any) {
    console.error("POST /api/portals/[id]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore portal" }, { status: 500 });
  }
}
