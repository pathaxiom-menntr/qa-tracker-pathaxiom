import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

// POST /api/defects/bulk - Bulk upload defects into PostgreSQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { defects } = body;

    if (!Array.isArray(defects) || defects.length === 0) {
      return NextResponse.json({ error: "Defects array must be provided and not empty" }, { status: 400 });
    }

    // Ensure columns exist
    await execDb(`
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT FALSE;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_at timestamp;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS deleted_by text;
      ALTER TABLE defects ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
    `).catch(() => {});

    // Find the current max bug ID in defects table
    const existing = await queryDb<{ id: string }>("SELECT id FROM defects ORDER BY id DESC LIMIT 500");
    const nums = existing
      .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    let nextNum = nums.length > 0 ? Math.max(...nums) : 0;

    const valueRows: string[] = [];

    for (const d of defects) {
      nextNum += 1;
      const bugId = (d.id?.trim() || `BUG-${String(nextNum).padStart(3, "0")}`).replace(/'/g, "''");
      const clientName = (d.client_name || "PathAxiom").replace(/'/g, "''");
      const projectName = (d.project_name || "Assessment Platform").replace(/'/g, "''");
      const projectCode = (d.project_code || "PRJ-001").replace(/'/g, "''");
      const module = (d.module || "General").replace(/'/g, "''");
      const feature = (d.feature || "General").replace(/'/g, "''");
      const severity = (d.severity || "Medium").replace(/'/g, "''");
      const priority = (d.priority || "Medium").replace(/'/g, "''");
      const title = (d.title || "Untitled Defect").replace(/'/g, "''");
      const description = (d.description || "").replace(/'/g, "''");
      const status = (d.status || "Open").replace(/'/g, "''");
      const createdBy = (d.created_by || "QA Team").replace(/'/g, "''");
      const assignee = (d.assignee || "Unassigned").replace(/'/g, "''");

      valueRows.push(`(
        '${bugId}',
        '${clientName}',
        '${projectName}',
        '${projectCode}',
        '${module}',
        '${feature}',
        '${severity}',
        '${priority}',
        '${title}',
        '${description}',
        '${status}',
        '${createdBy}',
        '${assignee}',
        FALSE,
        NOW(),
        NOW()
      )`);
    }

    const insertSql = `
      INSERT INTO defects (
        id, client_name, project_name, project_code, module, 
        feature, severity, priority, title, description, 
        status, created_by, assignee, is_deleted, created_at, updated_at
      )
      VALUES ${valueRows.join(", ")}
      RETURNING *;
    `;

    const inserted = await queryDb(insertSql);

    return NextResponse.json({
      ok: true,
      count: inserted.length,
      defects: inserted,
    });
  } catch (error: any) {
    console.error("POST /api/defects/bulk error:", error);
    return NextResponse.json({ error: error.message || "Failed to bulk upload defects" }, { status: 500 });
  }
}
