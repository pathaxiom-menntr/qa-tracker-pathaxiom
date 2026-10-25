import { NextResponse } from "next/server";
import { queryDb, execDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadedBy = (formData.get("uploadedBy") as string) || "QA Team";
    const comments = (formData.get("comments") as string) || "";

    const fileName = file ? file.name : `${key}-report.pdf`;
    const format = fileName.toLowerCase().endsWith(".xlsx") || fileName.toLowerCase().endsWith(".xls") ? "Excel" : "PDF";
    const sizeBytes = file ? file.size : 1024;
    const storedPath = `${key}-${Date.now()}-${fileName}`;

    // Upsert into reports table
    await execDb(`
      INSERT INTO reports (key, file_name, stored_path, format, size_bytes, uploaded_by, uploaded_date, version, comments, is_deleted, deleted_at, deleted_by)
      VALUES (
        '${key.replace(/'/g, "''")}',
        '${fileName.replace(/'/g, "''")}',
        '${storedPath.replace(/'/g, "''")}',
        '${format}',
        ${sizeBytes},
        '${uploadedBy.replace(/'/g, "''")}',
        CURRENT_DATE,
        '1.0',
        '${comments.replace(/'/g, "''")}',
        FALSE,
        NULL,
        NULL
      )
      ON CONFLICT (key) DO UPDATE SET
        file_name = EXCLUDED.file_name,
        stored_path = EXCLUDED.stored_path,
        format = EXCLUDED.format,
        size_bytes = EXCLUDED.size_bytes,
        uploaded_by = EXCLUDED.uploaded_by,
        uploaded_date = CURRENT_DATE,
        comments = EXCLUDED.comments,
        updated_at = NOW(),
        is_deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL;
    `);

    return NextResponse.json({ ok: true, key, fileName });
  } catch (error: any) {
    console.error("POST /api/reports/[key] error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload report" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);

    const { searchParams } = new URL(req.url);
    const purge = searchParams.get("purge") === "true";

    if (purge) {
      // Hard delete / permanent purge
      await execDb(`DELETE FROM reports WHERE key = '${decodedKey.replace(/'/g, "''")}'`);
      return NextResponse.json({ ok: true, purged: true, key: decodedKey });
    } else {
      // Soft delete: move to Recycle Bin
      await execDb(`
        UPDATE reports
        SET is_deleted = TRUE, deleted_at = NOW()
        WHERE key = '${decodedKey.replace(/'/g, "''")}'
      `);
      return NextResponse.json({ ok: true, softDeleted: true, key: decodedKey });
    }
  } catch (error: any) {
    console.error("DELETE /api/reports/[key] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete report" }, { status: 500 });
  }
}
