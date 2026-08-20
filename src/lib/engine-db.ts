import { createDb, type Db } from "@libs/db";

const globalForDb = globalThis as unknown as { itpDb?: Db };

export function getEngineDb(): Db | undefined {
  if (globalForDb.itpDb) return globalForDb.itpDb;
  const url = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL_DIRECT;
  if (!url) return undefined;
  try {
    globalForDb.itpDb = createDb(url, { max: 3 }).db;
    return globalForDb.itpDb;
  } catch {
    return undefined;
  }
}
