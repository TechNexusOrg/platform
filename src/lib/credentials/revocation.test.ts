import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { eq } from "drizzle-orm";

describe("Credential Revocation & Audit Logging", () => {
  const credId = "cred_tn_test_to_revoke_001";
  const userId = "usr_revocation_test_user";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();

    const db = await getDb();

    // Seed test user
    await db.insert(schema.users).values({
      id: userId,
      githubId: 77889900,
      githubUsername: "revocation_target",
      displayName: "Target User",
      role: "contributor",
      level: "contributor",
      isOnboarded: true,
    });

    // Seed test credential
    await db.insert(schema.credentials).values({
      id: credId,
      userId,
      type: "first_pr_merged",
      title: "First PR Merged — Open Source",
      description: "Test credential to be revoked",
      status: "active",
      issuer: "TechNexusOrg",
      evidenceData: { prNumber: 99, repo: "TechNexusOrg/platform" },
      verificationUrl: `http://localhost:3000/verify/${credId}`,
    });
  });

  it("revokes active credential and records audit log", async () => {
    const db = await getDb();
    const adminActorId = "usr_admin_001";
    const revocationReason = "Pull request discovered to be plagiarized";

    // 1. Perform revocation
    await db
      .update(schema.credentials)
      .set({
        status: "revoked",
        revokedReason: revocationReason,
      })
      .where(eq(schema.credentials.id, credId));

    // 2. Insert audit log
    const auditId = `audit_${crypto.randomUUID()}`;
    await db.insert(schema.auditLogs).values({
      id: auditId,
      actorId: adminActorId,
      action: "credential.revoked",
      targetType: "credential",
      targetId: credId,
      metadata: {
        revokedBy: "admin",
        reason: revocationReason,
        targetUserId: userId,
      },
    });

    // 3. Verify status changed to revoked
    const updatedCred = await db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.id, credId));

    expect(updatedCred).toHaveLength(1);
    expect(updatedCred[0].status).toBe("revoked");
    expect(updatedCred[0].revokedReason).toBe(revocationReason);

    // 4. Verify audit log entry exists
    const auditEntries = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.id, auditId));

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].action).toBe("credential.revoked");
    expect(auditEntries[0].targetId).toBe(credId);
  });
});
