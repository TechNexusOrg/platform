import { NextRequest, NextResponse } from "next/server";
import { getContributorPassport } from "@/lib/passport";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const sessionUser = token ? await verifySessionToken(token) : null;

  const passport = await getContributorPassport(username, sessionUser?.id);

  if ("notFound" in passport) {
    return NextResponse.json({ error: "Contributor not found" }, { status: 404 });
  }

  if ("isPrivate" in passport) {
    return NextResponse.json(
      { error: "Contributor passport is private" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    platform: "TechNexusOrg",
    schemaVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    passport,
  });
}
