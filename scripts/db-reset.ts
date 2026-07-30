/**
 * DEV ONLY — drop and recreate the public schema, wiping all data. Use after a
 * schema change during development, then `pnpm db:migrate` to reapply.
 *   set -a; source .env; set +a; pnpm tsx scripts/db-reset.ts
 */
import { createDb } from "@libs/db";
import { sql } from "drizzle-orm";

async function main() {
  const { db, close } = createDb(process.env.DATABASE_URL_DIRECT!, { max: 1 });
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  // Drizzle keeps its migration journal in a separate `drizzle` schema; without
  // dropping it too, `db:migrate` sees 0000 as applied and recreates nothing.
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  console.log("public + drizzle schemas reset — run `pnpm db:migrate` next");
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
