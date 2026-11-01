import { Pool, PoolConfig } from "pg";
import { execFile } from "child_process";

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "postgres://qa_user:qa_password@db:5432/qa_tracker"
    : "postgres://qa_user:qa_password@localhost:5432/qa_tracker");

// Detect if SSL is required (e.g. Azure Database for PostgreSQL Flexible Server)
const isAzure =
  connectionString.includes("azure.com") ||
  connectionString.includes("postgres.database.azure.com");

const useSsl =
  process.env.DB_SSL === "true" ||
  isAzure ||
  connectionString.includes("sslmode=require");

const poolConfig: PoolConfig = {
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
};

export const pool = new Pool(poolConfig);

// Helper to determine the target docker container name for local dev fallback
const targetContainer =
  process.env.DB_CONTAINER ||
  process.env.POSTGRES_CONTAINER ||
  "qa-tracker-db";

const fallbackContainers = [targetContainer, "qa-monorepo-db", "project-db-1"];

export async function queryDb<T = any>(sql: string): Promise<T[]> {
  const cleanSql = sql.trim().replace(/;+$/, "");

  // 1. Direct PostgreSQL connection pool (standard in Docker, Azure, and host when port is open)
  try {
    const res = await pool.query(cleanSql);
    return res.rows as T[];
  } catch (poolErr: any) {
    // In production or cloud/Azure, do not attempt docker exec fallback
    if (process.env.NODE_ENV === "production" || isAzure) {
      console.error("Database Query error:", poolErr.message);
      throw new Error(`Database error: ${poolErr.message}`);
    }

    // 2. Local development fallback via docker exec (when running Next.js on host and port 5432 is internal)
    const isDml = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(cleanSql);
    const wrapped = isDml
      ? `WITH t AS (${cleanSql}) SELECT COALESCE(json_agg(t), '[]'::json) FROM t;`
      : `SELECT COALESCE(json_agg(t), '[]'::json) FROM (${cleanSql}) t;`;

    return new Promise((resolve, reject) => {
      // Try configured container first
      function tryExec(containerIdx: number) {
        if (containerIdx >= fallbackContainers.length) {
          console.error("DB Query error (pool & docker exec failed):", poolErr.message);
          return reject(new Error(poolErr.message || "Failed to connect to database"));
        }

        const containerName = fallbackContainers[containerIdx];
        execFile(
          "docker",
          ["exec", containerName, "psql", "-U", "qa_user", "-d", "qa_tracker", "-t", "-A", "-c", wrapped],
          (err, stdout, stderr) => {
            if (err) {
              // Try next fallback container
              return tryExec(containerIdx + 1);
            }
            try {
              const trimmed = stdout.trim();
              const parsed = trimmed ? JSON.parse(trimmed) : [];
              resolve(parsed);
            } catch (e) {
              console.error("JSON parse error from docker exec:", e, "Raw:", stdout);
              resolve([]);
            }
          }
        );
      }

      tryExec(0);
    });
  }
}

export async function execDb(sql: string): Promise<string> {
  try {
    const res = await pool.query(sql);
    return res.command;
  } catch (poolErr: any) {
    if (process.env.NODE_ENV === "production" || isAzure) {
      throw new Error(`Database exec error: ${poolErr.message}`);
    }

    return new Promise((resolve, reject) => {
      function tryExec(containerIdx: number) {
        if (containerIdx >= fallbackContainers.length) {
          return reject(new Error(poolErr.message || "Failed to execute database statement"));
        }

        const containerName = fallbackContainers[containerIdx];
        execFile(
          "docker",
          ["exec", containerName, "psql", "-U", "qa_user", "-d", "qa_tracker", "-c", sql],
          (err, stdout, stderr) => {
            if (err) {
              return tryExec(containerIdx + 1);
            }
            resolve(stdout.trim());
          }
        );
      }

      tryExec(0);
    });
  }
}
