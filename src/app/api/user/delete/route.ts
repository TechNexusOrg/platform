import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Handles account deletion requests in compliance with GDPR / right to erasure.
 * Permanently deletes the user record and cascades to profile, notifications, claims, etc.
 */
export async function POST(request: NextRequest) {
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

    // Audit log before deletion for compliance records
    await db.insert(schema.auditLogs).values({
      id: `audit_${crypto.randomUUID()}`,
      actorId: sessionUser.id,
      action: "user.account_deleted",
      targetType: "user",
      targetId: sessionUser.id,
      metadata: {
        githubUsername: sessionUser.githubUsername,
        deletedAt: new Date().toISOString(),
      },
    });

    // Delete user from database (cascades to profile, claims, notifications, mentor_requests)
    await db.delete(schema.users).where(eq(schema.users.id, sessionUser.id));

    const response = NextResponse.json({
      success: true,
      message: "Your account and all associated personal records have been successfully deleted.",
    });

    // Clear session cookie
    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch (error: any) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
