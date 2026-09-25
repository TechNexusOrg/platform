import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const revokeSchema = z.object({
  credentialId: z.string().min(1, "Credential ID is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters long"),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Administrative privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = revokeSchema.parse(body);

    const db = await getDb();

    // Verify credential exists
    const credRecords = await db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.id, data.credentialId))
      .limit(1);

    if (credRecords.length === 0) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const cred = credRecords[0];

    // Revoke credential
    await db
      .update(schema.credentials)
      .set({
        status: "revoked",
        revokedReason: data.reason,
      })
      .where(eq(schema.credentials.id, data.credentialId));

    // Create immutable audit log
    await db.insert(schema.auditLogs).values({
      id: `audit_${crypto.randomUUID()}`,
      actorId: sessionUser.id,
      action: "credential.revoked",
      targetType: "credential",
      targetId: data.credentialId,
      metadata: {
        revokedBy: sessionUser.githubUsername,
        reason: data.reason,
        targetUserId: cred.userId,
        credentialType: cred.type,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Credential ${data.credentialId} has been revoked.`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to revoke credential" },
      { status: 500 }
    );
  }
}
