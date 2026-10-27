import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import { getCaller } from "@/lib/auth-check";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/users/:id - Update user in PostgreSQL with RBAC & tenant scoping
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to update users." }, { status: 401 });
    }

    if (caller.role !== "Super Admin" && caller.role !== "Admin") {
      return NextResponse.json({ error: "Insufficient permissions to update users." }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Fetch target user from PostgreSQL
    const targetUsers = await queryDb<{ id: number; role: string; client_name: string | null }>(
      `SELECT id, role, client_name FROM users WHERE id = ${userId}`
    );
    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const target = targetUsers[0];

    const body = await req.json();
    let { name, email, role, status, password, client_name, assigned_projects, permissions } = body;

    // Prevent promoting any account to Super Admin
    if (role === "Super Admin" && target.role !== "Super Admin") {
      return NextResponse.json(
        { error: "Promoting accounts to Super Admin is prohibited. Super Admin is a single predefined role." },
        { status: 403 }
      );
    }

    // Strict Admin (Org Admin) Scoping Checks:
    if (caller.role === "Admin") {
      // 1. Cannot modify users outside their assigned organization
      const callerClient = (caller.client_name || "").toLowerCase();
      const targetClient = (target.client_name || "").toLowerCase();
      if (!callerClient || callerClient !== targetClient) {
        return NextResponse.json(
          { error: "Access denied. You can only manage users within your assigned organization." },
          { status: 403 }
        );
      }

      // 2. Cannot modify Super Admin or other Admin accounts
      if (target.role === "Super Admin" || target.role === "Admin") {
        return NextResponse.json(
          { error: "Admins cannot modify Super Admin or other Admin accounts." },
          { status: 403 }
        );
      }

      // 3. Cannot promote to Admin
      if (role === "Admin") {
        return NextResponse.json(
          { error: "Admins cannot assign the Admin role. Only QA Manager, QA Lead, QA Engineer, or Client roles can be assigned." },
          { status: 403 }
        );
      }

      // 4. Cannot reassign user to another organization
      if (client_name !== undefined) {
        client_name = caller.client_name;
      }
    }

    const updates: string[] = [];
    if (name) updates.push(`name = '${name.trim().replace(/'/g, "''")}'`);
    if (email) updates.push(`email = '${email.trim().toLowerCase().replace(/'/g, "''")}'`);
    if (role) updates.push(`role = '${role.replace(/'/g, "''")}'`);
    if (status) updates.push(`status = '${status.replace(/'/g, "''")}'`);
    if (client_name !== undefined) {
      updates.push(`client_name = ${client_name ? `'${client_name.replace(/'/g, "''")}'` : "NULL"}`);
    }
    if (assigned_projects !== undefined) {
      updates.push(`assigned_projects = '${JSON.stringify(assigned_projects).replace(/'/g, "''")}'::jsonb`);
    }
    if (permissions !== undefined) {
      updates.push(`permissions = '${JSON.stringify(permissions).replace(/'/g, "''")}'::jsonb`);
    }
    if (password && password.length >= 6) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = '${hash}'`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    await execDb("ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;").catch(() => {});
    const updated = await queryDb(
      `UPDATE users
       SET ${updates.join(", ")}
       WHERE id = ${userId}
       RETURNING id, name, email, role, status, client_name, assigned_projects, permissions, created_at as "createdAt"`
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: updated[0] });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users/:id - Soft delete to Recycle Bin (or permanently purge if ?purge=true)
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Authentication required to delete users." }, { status: 401 });
    }

    if (caller.role !== "Super Admin" && caller.role !== "Admin") {
      return NextResponse.json({ error: "Insufficient permissions to delete users." }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";
    const deletedBy = searchParams.get("deleted_by") || caller.name || "Admin";

    // Fetch target user
    const targetUsers = await queryDb<{ id: number; role: string; client_name: string | null }>(
      `SELECT id, role, client_name FROM users WHERE id = ${userId}`
    );
    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const target = targetUsers[0];

    // Prevent deleting the predefined Super Admin
    if (target.role === "Super Admin") {
      return NextResponse.json(
        { error: "The single predefined Super Admin account cannot be deleted." },
        { status: 403 }
      );
    }

    // Admin (Org Admin) Restrictions:
    if (caller.role === "Admin") {
      const callerClient = (caller.client_name || "").toLowerCase();
      const targetClient = (target.client_name || "").toLowerCase();
      if (!callerClient || callerClient !== targetClient) {
        return NextResponse.json(
          { error: "Access denied. You can only manage users within your assigned organization." },
          { status: 403 }
        );
      }

      if (target.role === "Admin" || target.role === "Super Admin") {
        return NextResponse.json(
          { error: "Admins cannot delete other Admin or Super Admin accounts." },
          { status: 403 }
        );
      }

      if (purge) {
        return NextResponse.json(
          { error: "Only Super Admin is authorized to permanently purge user accounts." },
          { status: 403 }
        );
      }
    }

    if (purge) {
      await execDb(`DELETE FROM users WHERE id = ${userId}`);
      return NextResponse.json({ ok: true, purged: true, message: `User ${userId} permanently purged` });
    } else {
      await execDb(`
        UPDATE users 
        SET is_deleted = TRUE, 
            deleted_at = NOW(), 
            deleted_by = '${deletedBy.replace(/'/g, "''")}' 
        WHERE id = ${userId}
      `);
      return NextResponse.json({ ok: true, soft_deleted: true, message: `User ${userId} moved to Recycle Bin` });
    }
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
