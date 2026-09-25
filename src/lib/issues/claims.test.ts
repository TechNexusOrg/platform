import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import {
  claimIssue,
  releaseIssueClaim,
  getActiveClaimForIssue,
  expireOverdueClaims,
} from "./claims";
import { eq } from "drizzle-orm";

describe("Issue Claims Engine", () => {
  const user1Id = "usr_claim_test_1";
  const user2Id = "usr_claim_test_2";
  const projectId = "proj_claims_test";
  const issue1Id = "iss_claim_test_1";
  const issue2Id = "iss_claim_test_2";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
    const db = await getDb();

    // Seed test users
    await db.insert(schema.users).values([
      {
        id: user1Id,
        githubId: 881001,
        githubUsername: "student_alice",
        displayName: "Alice Developer",
        role: "contributor",
        level: "level_1",
        isOnboarded: true,
      },
      {
        id: user2Id,
        githubId: 881002,
        githubUsername: "student_bob",
        displayName: "Bob Engineer",
        role: "contributor",
        level: "level_1",
        isOnboarded: true,
      },
    ]);

    // Seed test project
    await db.insert(schema.projects).values({
      id: projectId,
      name: "Core Platform",
      slug: "core-platform-test",
      githubRepo: "TechNexusOrg/core-platform-test",
      description: "Official TechNexusOrg core platform test repository",
      primaryLanguage: "TypeScript",
      contributionEnabled: true,
    });

    // Seed test issues
    await db.insert(schema.issues).values([
      {
        id: issue1Id,
        projectId,
        githubIssueId: 991,
        githubIssueNumber: 101,
        title: "Implement issue claim timeout notification",
        state: "open",
        htmlUrl: "https://github.com/TechNexusOrg/core-platform-test/issues/101",
        difficulty: "beginner",
        isGoodFirstIssue: true,
      },
      {
        id: issue2Id,
        projectId,
        githubIssueId: 992,
        githubIssueNumber: 102,
        title: "Refactor session cache",
        state: "open",
        htmlUrl: "https://github.com/TechNexusOrg/core-platform-test/issues/102",
        difficulty: "intermediate",
      },
    ]);
  });

  it("successfully claims an available open issue", async () => {
    const result = await claimIssue({
      issueId: issue1Id,
      userId: user1Id,
    });

    expect(result.success).toBe(true);
    expect(result.claim.status).toBe("active");
    expect(result.claim.userId).toBe(user1Id);
    expect(result.claim.issueId).toBe(issue1Id);

    const activeClaim = await getActiveClaimForIssue(issue1Id);
    expect(activeClaim).not.toBeNull();
    expect(activeClaim?.user.githubUsername).toBe("student_alice");
  });

  it("prevents another user from claiming the same active issue", async () => {
    await expect(
      claimIssue({
        issueId: issue1Id,
        userId: user2Id,
      })
    ).rejects.toThrow(/currently claimed by @student_alice/);
  });

  it("prevents level_1 user from claiming more than 1 active issue", async () => {
    await expect(
      claimIssue({
        issueId: issue2Id,
        userId: user1Id,
      })
    ).rejects.toThrow(/limit of 1 active claim/);
  });

  it("allows user to release their own claim", async () => {
    const result = await releaseIssueClaim({
      issueId: issue1Id,
      userId: user1Id,
    });

    expect(result.success).toBe(true);
    expect(result.claim.status).toBe("released");

    const activeClaim = await getActiveClaimForIssue(issue1Id);
    expect(activeClaim).toBeNull();
  });

  it("allows another user to claim after release", async () => {
    const result = await claimIssue({
      issueId: issue1Id,
      userId: user2Id,
    });

    expect(result.success).toBe(true);
    expect(result.claim.userId).toBe(user2Id);

    const activeClaim = await getActiveClaimForIssue(issue1Id);
    expect(activeClaim?.user.githubUsername).toBe("student_bob");
  });

  it("expires overdue claims and allows re-claiming", async () => {
    const db = await getDb();
    // Simulate expired claim
    await db
      .update(schema.issueClaims)
      .set({
        expiresAt: new Date(Date.now() - 1000 * 60), // 1 minute ago
      })
      .where(eq(schema.issueClaims.issueId, issue1Id));

    await expireOverdueClaims(db);

    const activeClaim = await getActiveClaimForIssue(issue1Id);
    expect(activeClaim).toBeNull();

    // Now user1 can claim it again
    const result = await claimIssue({
      issueId: issue1Id,
      userId: user1Id,
    });
    expect(result.success).toBe(true);
    expect(result.claim.userId).toBe(user1Id);
  });
});
