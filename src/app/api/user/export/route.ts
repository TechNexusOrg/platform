import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Handles personal data export requests in compliance with GDPR / data portability.
 * Returns an exhaustive JSON document containing all personal and contribution records.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const db = await getDb();

    // 1. Fetch user core record
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, sessionUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch profile
    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, sessionUser.id))
      .limit(1);

    // 3. Fetch contributions
    const contributions = await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.userId, sessionUser.id));

    // 4. Fetch credentials
    const credentials = await db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.userId, sessionUser.id));

    // 5. Fetch issue claims
    const claims = await db
      .select()
      .from(schema.issueClaims)
      .where(eq(schema.issueClaims.userId, sessionUser.id));

    // 6. Fetch mentor requests
    const mentorRequests = await db
      .select()
      .from(schema.mentorRequests)
      .where(eq(schema.mentorRequests.studentId, sessionUser.id));

    // 7. Fetch notifications
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, sessionUser.id));

    const exportPayload = {
      exportMetadata: {
        platform: "TechNexusOrg",
        schemaVersion: "1.0.0",
        exportedAt: new Date().toISOString(),
        subjectId: user.id,
        githubUsername: user.githubUsername,
      },
      account: {
        id: user.id,
        githubId: user.githubId,
        githubUsername: user.githubUsername,
        displayName: user.displayName,
        email: user.email,
        bio: user.bio,
        location: user.location,
        portfolioUrl: user.portfolioUrl,
        linkedinUrl: user.linkedinUrl,
        role: user.role,
        level: user.level,
        foundingNumber: user.foundingNumber,
        isOnboarded: user.isOnboarded,
        isPublic: user.isPublic,
        publicConsentGivenAt: user.publicConsentGivenAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile || null,
      contributions,
      credentials,
      issueClaims: claims,
      mentorRequests,
      notifications,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="technexus-data-${user.githubUsername}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Data export failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}
