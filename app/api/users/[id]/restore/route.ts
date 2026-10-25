import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// POST /api/users/[id]/restore - Restore a soft-deleted user from the Recycle Bin
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const sql = `
      UPDATE users 
      SET is_deleted = FALSE, 
          deleted_at = NULL, 
          deleted_by = NULL
      WHERE id = ${userId}
      RETURNING id, name, email, role, status, client_name, assigned_projects, permissions, created_at as "createdAt", is_deleted, deleted_at, deleted_by;
    `;
    const res = await queryDb(sql);

    if (res.length === 0) {
      return NextResponse.json({ error: "User not found in Recycle Bin" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, restored: true, user: res[0] });
  } catch (error: any) {
    console.error("POST /api/users/[id]/restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore user" }, { status: 500 });
  }
}
