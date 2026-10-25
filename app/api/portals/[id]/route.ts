import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portalId = parseInt(id, 10);
    if (isNaN(portalId)) {
      return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";

    if (purge) {
      // Hard delete / permanent purge from database
      await execDb(`DELETE FROM test_portals WHERE id = ${portalId}`);
      return NextResponse.json({ ok: true, purged: true, id: portalId });
    } else {
      // Soft delete: move to Recycle Bin
      await execDb(`
        UPDATE test_portals
        SET is_deleted = TRUE, deleted_at = NOW()
        WHERE id = ${portalId}
      `);
      return NextResponse.json({ ok: true, softDeleted: true, id: portalId });
    }
  } catch (error: any) {
    console.error("DELETE /api/portals/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete portal" }, { status: 500 });
  }
}
