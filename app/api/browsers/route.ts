import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export async function GET() {
  try {
    const browsers = await queryDb(
      `SELECT id, browser, engine, version, status, remark
       FROM cross_browsers
       ORDER BY id ASC`
    );
    return NextResponse.json({ ok: true, browsers });
  } catch (error: any) {
    console.error("GET /api/browsers error:", error);
    return NextResponse.json({ error: error.message || "Failed to load browsers" }, { status: 500 });
  }
}
