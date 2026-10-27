import { NextResponse } from "next/server";
import { getCaller } from "@/lib/auth-check";
import { queryDb } from "@/lib/db";
import { User } from "@/lib/types";

// GET /api/auth/me - Retrieve current authenticated caller identity & profile
export async function GET(req: Request) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await queryDb<User>(
      `SELECT id, name, email, role, 
              COALESCE(status, 'active') as status, 
              client_name,
              COALESCE(assigned_projects, '[]'::jsonb) as assigned_projects,
              COALESCE(permissions, '[]'::jsonb) as permissions,
              COALESCE(failed_login_attempts, 0) as failed_login_attempts,
              locked_until,
              created_at as "createdAt",
              COALESCE(is_deleted, false) as is_deleted
       FROM users
       WHERE id = ${caller.id} AND COALESCE(is_deleted, false) = false
       LIMIT 1`
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User session expired or user deactivated" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: users[0] });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: error.message || "Failed to load session profile" }, { status: 500 });
  }
}
