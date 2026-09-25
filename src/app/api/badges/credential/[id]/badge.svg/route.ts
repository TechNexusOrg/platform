import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateCredentialSvgBadge } from "@/lib/credentials/badge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();

  const credRecords = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.id, id))
    .limit(1);

  let svg: string;
  if (credRecords.length === 0) {
    svg = generateCredentialSvgBadge("Unverified", "revoked");
  } else {
    const cred = credRecords[0];
    svg = generateCredentialSvgBadge(
      cred.title.split("—")[0].trim(),
      cred.status as "active" | "revoked"
    );
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
