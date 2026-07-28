import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>["db"];

export interface DbHandle {
  db: ReturnType<typeof drizzle<typeof schema>>;
  /** Close the underlying connection pool (call on shutdown / after tests). */
  close: () => Promise<void>;
}

/**
 * Create a Drizzle client over a postgres.js connection.
 *
 * The engine passes its DIRECT (unpooled) URL; the web app passes the POOLED
 * URL. On Neon the two differ; locally they can be the same string.
 *
 * `channel_binding` is a libpq-only parameter postgres.js doesn't understand, so
 * we strip it; TLS is enabled whenever the URL asks for it (Neon always does).
 */
export function createDb(url: string, options: { max?: number } = {}): DbHandle {
  const cleaned = url.replace(/[?&]channel_binding=require/, "");
  const ssl = /sslmode=require/.test(cleaned) || /\.neon\.tech/.test(cleaned) ? "require" : undefined;
  const sql = postgres(cleaned, { max: options.max ?? 10, ...(ssl ? { ssl } : {}) });
  return { db: drizzle(sql, { schema }), close: () => sql.end() };
}
