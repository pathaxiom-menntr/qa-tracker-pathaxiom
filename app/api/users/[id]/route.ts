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
    const { name, email, role, status, password } = body;

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
    if (password && password.length >= 6) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = '${hash}'`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const updated = await queryDb(
      `UPDATE users
       SET ${updates.join(", ")}
       WHERE id = ${parseInt(id, 10)}
       RETURNING id, name, email, role, status, created_at as "createdAt"`
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

// DELETE /api/users/:id - Delete user from PostgreSQL
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    // Prevent deleting the predefined Super Admin
    const targetUser = await queryDb<{ role: string }>(`SELECT role FROM users WHERE id = ${userId}`);
    if (targetUser.length > 0 && targetUser[0].role === "Super Admin") {
      return NextResponse.json(
        { error: "The single predefined Super Admin account cannot be deleted." },
        { status: 403 }
      );
    }

    await execDb(`DELETE FROM users WHERE id = ${userId}`);
    return NextResponse.json({ ok: true, message: `User ${userId} deleted` });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
