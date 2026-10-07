import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

// GET /api/browsers - Load all cross-browser test records
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

// POST /api/browsers - Add a new browser compatibility record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { browser, engine, version, status = "Pass", remark = "" } = body;

    if (!browser || !engine || !version) {
      return NextResponse.json(
        { error: "Browser, rendering engine, and tested version are required" },
        { status: 400 }
      );
    }

    const cleanBrowser = browser.trim().replace(/'/g, "''");
    const cleanEngine = engine.trim().replace(/'/g, "''");
    const cleanVersion = version.trim().replace(/'/g, "''");
    const cleanStatus = status === "Fail" ? "Fail" : "Pass";
    const cleanRemark = (remark || "").trim().replace(/'/g, "''");

    const inserted = await queryDb(
      `INSERT INTO cross_browsers (browser, engine, version, status, remark)
       VALUES ('${cleanBrowser}', '${cleanEngine}', '${cleanVersion}', '${cleanStatus}', '${cleanRemark}')
       RETURNING id, browser, engine, version, status, remark`
    );

    return NextResponse.json({ ok: true, browser: inserted[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/browsers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add browser" },
      { status: 500 }
    );
  }
}
