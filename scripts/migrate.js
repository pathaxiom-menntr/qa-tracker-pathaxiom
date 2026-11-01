#!/usr/bin/env node
/**
 * QA Tracker Database Migration Runner
 * Standardized migration execution for Local, Docker, and Azure Container Apps.
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env or .env.local if available without external dependencies
function loadEnvFile(envPath) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://qa_user:qa_password@localhost:5432/qa_tracker";

const isAzure =
  connectionString.includes("azure.com") ||
  connectionString.includes("postgres.database.azure.com");

const useSsl =
  process.env.DB_SSL === "true" ||
  isAzure ||
  connectionString.includes("sslmode=require");

console.log("=================================================");
console.log("🚀 QA Tracker Enterprise Database Migration");
console.log("=================================================");
console.log(`Connecting to: ${connectionString.replace(/:([^:@]+)@/, ":****@")}`);
console.log(`SSL Enabled:   ${useSsl ? "YES (Azure/Secure)" : "NO (Standard)"}`);

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

const REQUIRED_TABLES = [
  "users",
  "projects",
  "defects",
  "cross_browsers",
  "test_portals",
  "reports",
  "test_runs",
  "vapt_findings"
];

async function runMigration() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, "migrate.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration SQL file not found at ${sqlPath}`);
    }

    console.log("📄 Reading migration script: scripts/migrate.sql...");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("⚡ Executing schema migration and initial data seeding...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Schema migration and seed executed successfully.\n");

    console.log("🔍 Verifying 8 required tables...");
    console.log("-----------------------------------------------------------------");
    console.log(String("Table Name").padEnd(20) + String("Status").padEnd(12) + String("Columns").padEnd(12) + "Rows");
    console.log("-----------------------------------------------------------------");

    let allPassed = true;
    for (const table of REQUIRED_TABLES) {
      const tableCheck = await client.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const exists = parseInt(tableCheck.rows[0].count, 10) > 0;

      if (!exists) {
        console.log(String(table).padEnd(20) + String("❌ MISSING").padEnd(12) + String("-").padEnd(12) + "-");
        allPassed = false;
        continue;
      }

      const colRes = await client.query(
        `SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const rowRes = await client.query(`SELECT COUNT(*) as count FROM ${table}`);

      const cols = colRes.rows[0].count;
      const rows = rowRes.rows[0].count;

      console.log(
        String(table).padEnd(20) +
        String("✅ OK").padEnd(12) +
        String(cols).padEnd(12) +
        rows
      );
    }
    console.log("-----------------------------------------------------------------");

    if (!allPassed) {
      throw new Error("One or more required tables failed to create.");
    }

    console.log("\n🎉 Database migration completed with all 8 tables verified!");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("\n❌ Migration failed:", err.message || err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
