import { NextResponse } from "next/server";

import { SHORT_WORKSPACE_SETUP_SQL } from "@/lib/short-workspace-setup-sql";

/** Returns the short DDL setup script as plain text (no DECLARE). */
export async function GET() {
  return new NextResponse(SHORT_WORKSPACE_SETUP_SQL, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
