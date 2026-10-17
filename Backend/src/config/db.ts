import pg from "pg";
import { config } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[PostgreSQL Pool Error]:", err);
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "production") {
    // console.log(`[DB Query] ${text.slice(0, 50)}... (${duration}ms)`);
  }
  return res;
}
