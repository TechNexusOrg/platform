import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      version: "0.1.0",
      organization: "TechNexusOrg",
    },
    { status: 200 }
  );
}
