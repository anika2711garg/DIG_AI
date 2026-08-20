import { createApiServer } from "@libs/api/server";

import { getEngineDb } from "@/lib/engine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = createApiServer(getEngineDb());

async function handler(req: Request) {
  return api.fetch(req);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
