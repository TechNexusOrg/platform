import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { syncRepositoryIssues } from "@/lib/github/issues";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  // Verify privileged role or internal bearer secret
  const authHeader = request.headers.get("authorization");
  const isAuthorizedSecret =
    authHeader && process.env.AUTH_SECRET && authHeader === `Bearer ${process.env.AUTH_SECRET}`;

  if (!isAuthorizedSecret && (!user || (user.role !== "admin" && user.role !== "maintainer"))) {
    return NextResponse.json({ error: "Unauthorized. Admin or maintainer privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const owner = body.owner || "TechNexusOrg";
    const repo = body.repo || "platform";

    const result = await syncRepositoryIssues(owner, repo);

    return NextResponse.json({
      success: true,
      repository: `${owner}/${repo}`,
      syncedCount: result.syncedCount,
      rateLimitRemaining: result.rateLimitRemaining,
    });
  } catch (error: any) {
    console.error("Issue sync error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync issues" }, { status: 500 });
  }
}
