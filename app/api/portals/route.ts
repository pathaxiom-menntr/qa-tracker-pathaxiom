import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function GET() {
  try {
    await execDb(`
      ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT FALSE;
      ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS deleted_at timestamp;
      ALTER TABLE test_portals ADD COLUMN IF NOT EXISTS deleted_by text;
    `).catch(() => {});

    const rows = await queryDb<any>(`
      SELECT id, name, 
             COALESCE(smoke, 0) as smoke, 
             COALESCE(functional, 0) as functional, 
             COALESCE(regression, 0) as regression, 
             COALESCE(total, 0) as total, 
             high_p as "highP", 
             med_p as "medP", 
             low_p as "lowP", 
             passed, failed,
             COALESCE(is_deleted, false) as is_deleted,
             deleted_at,
             COALESCE(deleted_by, '') as deleted_by
      FROM test_portals
      ORDER BY id ASC
    `);

    return NextResponse.json({ ok: true, portals: rows });
  } catch (error: any) {
    console.error("GET /api/portals error:", error);
    return NextResponse.json({ error: error.message || "Failed to load portals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Portal name is required" }, { status: 400 });
    }

    const inserted = await queryDb<any>(`
      INSERT INTO test_portals (name, smoke, functional, regression, total)
      VALUES ('${name.trim().replace(/'/g, "''")}', 0, 0, 0, 0)
      RETURNING id, name, smoke, functional, regression, total, high_p as "highP", med_p as "medP", low_p as "lowP", passed, failed, is_deleted, deleted_at, deleted_by
    `);

    return NextResponse.json({ ok: true, portal: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/portals error:", error);
    return NextResponse.json({ error: error.message || "Failed to create portal" }, { status: 500 });
  }
}
