import { NextRequest, NextResponse } from "next/server";
import { getFreshAuthenticatedUser, hasRole } from "@/lib/auth/authorization";
import { syncRepositoryIssues } from "@/lib/github/issues";
import { env, safeCompare } from "@/lib/env";

export async function POST(request: NextRequest) {
  // 1. Verify service bearer token using constant-time comparison
  const authHeader = request.headers.get("authorization");
  const expectedBearer = `Bearer ${env.INTERNAL_SERVICE_SECRET}`;
  const isAuthorizedService = safeCompare(authHeader, expectedBearer);

  let isAuthorizedUser = false;
  if (!isAuthorizedService) {
    // 2. Fall back to fresh server-side DB session verification
    const freshUser = await getFreshAuthenticatedUser(request);
    if (freshUser && hasRole(freshUser, ["admin", "maintainer"])) {
      // CSRF / Origin validation for session cookie requests
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: "CSRF protection: Invalid origin." }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "CSRF protection: Malformed origin." }, { status: 403 });
        }
      }
      isAuthorizedUser = true;
    }
  }

  if (!isAuthorizedService && !isAuthorizedUser) {
    return NextResponse.json(
      { error: "Unauthorized. Admin or maintainer privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const owner = (body.owner || env.TECH_NEXUS_ORG_NAME).trim();
    const repo = (body.repo || "platform").trim();

    // Trust boundary: enforce official organization
    if (owner.toLowerCase() !== env.TECH_NEXUS_ORG_NAME.toLowerCase()) {
      return NextResponse.json(
        { error: `Forbidden: Only repositories under ${env.TECH_NEXUS_ORG_NAME} may be synced.` },
        { status: 400 }
      );
    }

    const result = await syncRepositoryIssues(owner, repo);

    return NextResponse.json({
      success: true,
      repository: `${owner}/${repo}`,
      syncedCount: result.syncedCount,
      rateLimitRemaining: result.rateLimitRemaining,
    });
  } catch (error: any) {
    console.error("Issue sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync issues" },
      { status: 500 }
    );
  }
}
