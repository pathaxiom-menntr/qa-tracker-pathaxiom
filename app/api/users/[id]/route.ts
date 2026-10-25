import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/users/:id - Update user in PostgreSQL
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, status, password, client_name, assigned_projects, permissions } = body;

    // Prevent promoting any account to Super Admin
    if (role === "Super Admin") {
      const targetUser = await queryDb<{ role: string }>(`SELECT role FROM users WHERE id = ${parseInt(id, 10)}`);
      if (targetUser.length === 0 || targetUser[0].role !== "Super Admin") {
        return NextResponse.json(
          { error: "Promoting accounts to Super Admin is prohibited. Super Admin is a single predefined role." },
          { status: 403 }
        );
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
       WHERE id = ${parseInt(id, 10)}
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
    const { id } = await params;
    const userId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";
    const deletedBy = searchParams.get("deleted_by") || "Admin";

    // Prevent deleting the predefined Super Admin
    const targetUser = await queryDb<{ role: string }>(`SELECT role FROM users WHERE id = ${userId}`);
    if (targetUser.length > 0 && targetUser[0].role === "Super Admin") {
      return NextResponse.json(
        { error: "The single predefined Super Admin account cannot be deleted." },
        { status: 403 }
      );
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
