import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { getCaller } from "@/lib/auth-check";

// POST /api/users/[id]/restore - Restore a soft-deleted user from the Recycle Bin with RBAC check
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to restore users." }, { status: 401 });
    }

    if (caller.role !== "Super Admin" && caller.role !== "Admin") {
      return NextResponse.json({ error: "Insufficient permissions to restore users." }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Verify target user
    const targetUsers = await queryDb<{ id: number; role: string; client_name: string | null }>(
      `SELECT id, role, client_name FROM users WHERE id = ${userId}`
    );
    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const target = targetUsers[0];

    // Admin scoping
    if (caller.role === "Admin") {
      const callerClient = (caller.client_name || "").toLowerCase();
      const targetClient = (target.client_name || "").toLowerCase();
      if (!callerClient || callerClient !== targetClient) {
        return NextResponse.json(
          { error: "Access denied. You can only restore users within your assigned organization." },
          { status: 403 }
        );
      }
      if (target.role === "Admin" || target.role === "Super Admin") {
        return NextResponse.json(
          { error: "Admins cannot restore Admin or Super Admin accounts." },
          { status: 403 }
        );
      }
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
