import { Pool } from "pg";
import { execFile } from "child_process";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://qa_user:qa_password@db:5432/qa_tracker",
  connectionTimeoutMillis: 3000,
});

export async function queryDb<T = any>(sql: string): Promise<T[]> {
  const cleanSql = sql.trim().replace(/;+$/, "");

  // Direct PostgreSQL query (used inside Docker or with network access)
  try {
    const res = await pool.query(cleanSql);
    return res.rows as T[];
  } catch (poolErr: any) {
    // Fallback for host development via docker exec
    const isDml = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(cleanSql);
    const wrapped = isDml
      ? `WITH t AS (${cleanSql}) SELECT COALESCE(json_agg(t), '[]'::json) FROM t;`
      : `SELECT COALESCE(json_agg(t), '[]'::json) FROM (${cleanSql}) t;`;

    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["exec", "project-db-1", "psql", "-U", "qa_user", "-d", "qa_tracker", "-t", "-A", "-c", wrapped],
        (err, stdout, stderr) => {
          if (err) {
            console.error("DB Query error:", stderr || err.message || poolErr.message);
            return reject(new Error(stderr || err.message || poolErr.message));
          }
          try {
            const trimmed = stdout.trim();
            const parsed = trimmed ? JSON.parse(trimmed) : [];
            resolve(parsed);
          } catch (e) {
            console.error("JSON parse error:", e, "Raw output:", stdout);
            resolve([]);
          }
        }
      );
    });
  }
}

export async function execDb(sql: string): Promise<string> {
  try {
    const res = await pool.query(sql);
    return res.command;
  } catch {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["exec", "project-db-1", "psql", "-U", "qa_user", "-d", "qa_tracker", "-c", sql],
        (err, stdout, stderr) => {
          if (err) {
            return reject(new Error(stderr || err.message));
          }
          resolve(stdout.trim());
        }
      );
    });
  }
}
