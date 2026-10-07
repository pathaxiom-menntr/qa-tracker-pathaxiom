import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

// POST /api/auth/register - Only Super Admin can register via public sign up
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role = "Super Admin" } = body;

    // Enforce rule: Only Super Admin can self-register
    if (role && role !== "Super Admin") {
      return NextResponse.json(
        {
          error:
            "Self-registration is restricted to Super Admin only. All other users (Admin, QA Manager, QA Lead, QA Engineer, Client) must be created by their respective authorities in User Management.",
        },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Enforce single Super Admin: Check if a Super Admin is already registered
    const existingSuperAdmin = await queryDb<{ id: number }>(
      "SELECT id FROM users WHERE role = 'Super Admin' LIMIT 1"
    );
    if (existingSuperAdmin.length > 0) {
      return NextResponse.json(
        {
          error:
            "A Super Admin account already exists. Super Admin is a single, predefined system role for the QA Tracker.",
        },
        { status: 403 }
      );
    }

    // Forward to backend to create user and issue JWT token with role locked to Super Admin
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "Super Admin",
      }),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete Super Admin registration" },
      { status: 500 }
    );
  }
}
