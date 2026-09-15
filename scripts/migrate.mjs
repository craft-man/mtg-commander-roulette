import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const migrationUrl = new URL("../db/migrations/001_collaborative_games.sql", import.meta.url);
const migration = await readFile(fileURLToPath(migrationUrl), "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query(migration);
  console.log("Collaborative game schema is ready.");
} finally {
  client.release();
  await pool.end();
}
