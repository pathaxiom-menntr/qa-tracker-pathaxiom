import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/users - Fetch all users from PostgreSQL
export async function GET() {
  try {
    await execDb("ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;").catch(() => {});
    const users = await queryDb(
      `SELECT id, name, email, role, COALESCE(status, 'active') as status, client_name, 
              COALESCE(assigned_projects, '[]'::jsonb) as assigned_projects, 
              COALESCE(permissions, '[]'::jsonb) as permissions, 
              created_at as "createdAt",
              COALESCE(is_deleted, false) as is_deleted,
              deleted_at,
              COALESCE(deleted_by, '') as deleted_by
       FROM users
       ORDER BY id DESC`
    );
    return NextResponse.json({ ok: true, users });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message || "Failed to load users" }, { status: 500 });
  }
}

// POST /api/users - Create new user in PostgreSQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      role = "QA Engineer",
      password = "password123",
      client_name = null,
      assigned_projects = [],
      permissions = [],
    } = body;

    // Strict Restriction: Super Admin is a single, predefined system role
    if (role === "Super Admin") {
      return NextResponse.json(
        { error: "Super Admin is a single predefined role. Adding additional Super Admin accounts is prohibited." },
        { status: 403 }
      );
    }

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user exists
    const existing = await queryDb(
      `SELECT id FROM users WHERE LOWER(email) = LOWER('${cleanEmail.replace(/'/g, "''")}')`
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientVal = client_name ? `'${client_name.replace(/'/g, "''")}'` : "NULL";

    await execDb("ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;").catch(() => {});
    const inserted = await queryDb(
      `INSERT INTO users (name, email, password_hash, role, status, client_name, assigned_projects, permissions)
       VALUES ('${cleanName.replace(/'/g, "''")}', '${cleanEmail.replace(/'/g, "''")}', '${hashedPassword}', '${role}', 'active', ${clientVal}, '${JSON.stringify(assigned_projects).replace(/'/g, "''")}'::jsonb, '${JSON.stringify(permissions).replace(/'/g, "''")}'::jsonb)
       RETURNING id, name, email, role, status, client_name, assigned_projects, permissions, created_at as "createdAt"`
    );

    return NextResponse.json({ ok: true, user: inserted[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
