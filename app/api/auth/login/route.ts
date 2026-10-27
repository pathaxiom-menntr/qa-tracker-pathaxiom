import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

function signJwt(payload: { id: number; name: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      iat: now,
      exp: now + 7 * 24 * 60 * 60, // 7 days
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user by email
    const users = await queryDb<{
      id: number;
      name: string;
      email: string;
      role: string;
      password_hash: string;
      status: string;
      client_name: string | null;
      assigned_projects: any;
      permissions: any;
      failed_login_attempts: number;
      locked_until: string | null;
      is_deleted: boolean;
    }>(
      `SELECT id, name, email, role, password_hash,
              COALESCE(status, 'active') as status,
              client_name,
              COALESCE(assigned_projects, '[]'::jsonb) as assigned_projects,
              COALESCE(permissions, '[]'::jsonb) as permissions,
              COALESCE(failed_login_attempts, 0) as failed_login_attempts,
              locked_until,
              COALESCE(is_deleted, false) as is_deleted
       FROM users
       WHERE LOWER(email) = LOWER('${cleanEmail.replace(/'/g, "''")}')
       LIMIT 1`
    );

    if (users.length === 0 || users[0].is_deleted) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check if account is deactivated
    if (user.status === "deactivated") {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    const now = new Date();
    const isLocked = user.locked_until && new Date(user.locked_until) > now;

    // 1. If account is currently locked, block access for this specific user ID
    if (isLocked) {
      return NextResponse.json(
        {
          error: "This account is temporarily blocked due to 5 consecutive failed login attempts. Please try again after 10 minutes.",
        },
        { status: 423 }
      );
    }

    // If locked_until was in the past, the 10-minute lockout expired: reset baseline attempts to 0
    const hadExpiredLock = user.locked_until && new Date(user.locked_until) <= now;
    const effectiveFailedAttempts = hadExpiredLock ? 0 : user.failed_login_attempts || 0;

    // 2. Validate password
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch {
      isValidPassword = false;
    }
    // Fallback comparison for unhashed legacy test accounts
    if (!isValidPassword && password === user.password_hash) {
      isValidPassword = true;
    }

    // 3. Handle Successful Login
    if (isValidPassword) {
      // Reset failed attempts and clear lock
      await execDb(
        `UPDATE users
         SET failed_login_attempts = 0, locked_until = NULL
         WHERE id = ${user.id}`
      );

      const token = signJwt({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      return NextResponse.json({
        ok: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          client_name: user.client_name,
          assigned_projects: user.assigned_projects,
          permissions: user.permissions,
        },
      });
    }

    // 4. Handle Failed Password Attempt
    const newAttemptCount = effectiveFailedAttempts + 1;

    if (newAttemptCount >= 5) {
      // 5 consecutive failed attempts reached: Lock this user ID for 10 minutes
      await execDb(
        `UPDATE users
         SET failed_login_attempts = 0,
             locked_until = NOW() + INTERVAL '10 minutes'
         WHERE id = ${user.id}`
      );

      return NextResponse.json(
        {
          error: "This account is temporarily blocked due to 5 consecutive failed login attempts. Please try again after 10 minutes.",
        },
        { status: 423 }
      );
    } else {
      // Under 5 attempts: Record attempt and notify remaining attempts
      await execDb(
        `UPDATE users
         SET failed_login_attempts = ${newAttemptCount},
             locked_until = NULL
         WHERE id = ${user.id}`
      );

      const remainingAttempts = 5 - newAttemptCount;
      return NextResponse.json(
        {
          error: `Invalid email or password. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before a 10-minute block.`,
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed. Please verify your credentials." },
      { status: 500 }
    );
  }
}
