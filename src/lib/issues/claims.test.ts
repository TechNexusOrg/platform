import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import {
  claimIssue,
  releaseIssueClaim,
  getActiveClaimForIssue,
  expireOverdueClaims,
  getMaxActiveClaimsForLevel,
  CLAIM_LIMITS_BY_LEVEL,
} from "./claims";
import { eq } from "drizzle-orm";

describe("Issue Claims Engine & Concurrency", () => {
  const user1Id = "usr_claim_test_1";
  const user2Id = "usr_claim_test_2";
  const userActiveId = "usr_claim_test_active";
  const projectId = "proj_claims_test";
  const issue1Id = "iss_claim_test_1";
  const issue2Id = "iss_claim_test_2";
  const issue3Id = "iss_claim_test_concurrent";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
    const db = await getDb();

    // Seed test users with canonical levels
    await db.insert(schema.users).values([
      {
        id: user1Id,
        githubId: 881001,
        githubUsername: "student_alice",
        displayName: "Alice Developer",
        role: "contributor",
        level: "explorer",
        isOnboarded: true,
      },
      {
        id: user2Id,
        githubId: 881002,
        githubUsername: "student_bob",
        displayName: "Bob Engineer",
        role: "contributor",
        level: "contributor",
        isOnboarded: true,
      },
      {
        id: userActiveId,
        githubId: 881003,
        githubUsername: "student_carol",
        displayName: "Carol Builder",
        role: "contributor",
        level: "active_contributor",
        isOnboarded: true,
      },
    ]);

    // Seed official approved test project
    await db.insert(schema.projects).values({
      id: projectId,
      name: "Core Platform",
      slug: "core-platform-test",
      githubRepo: "TechNexusOrg/core-platform-test",
      description: "Official TechNexusOrg core platform test repository",
      primaryLanguage: "TypeScript",
      isOfficial: true,
      contributionEnabled: true,
      firstPrEnabled: true,
      approvedAt: new Date(),
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
      {
        id: issue3Id,
        projectId,
        githubIssueId: 993,
        githubIssueNumber: 103,
        title: "Concurrent claim stress target",
        state: "open",
        htmlUrl: "https://github.com/TechNexusOrg/core-platform-test/issues/103",
        difficulty: "beginner",
      },
    ]);
  });

  describe("Claim Limits by Canonical Level", () => {
    it("returns expected claim limits for every canonical level", () => {
      expect(getMaxActiveClaimsForLevel("explorer")).toBe(1);
      expect(getMaxActiveClaimsForLevel("contributor")).toBe(1);
      expect(getMaxActiveClaimsForLevel("active_contributor")).toBe(2);
      expect(getMaxActiveClaimsForLevel("core_contributor")).toBe(2);
      expect(getMaxActiveClaimsForLevel("maintainer")).toBe(3);
      expect(getMaxActiveClaimsForLevel("project_lead")).toBe(3);
      expect(getMaxActiveClaimsForLevel("mentor")).toBe(3);
      expect(getMaxActiveClaimsForLevel(null)).toBe(1);
      expect(getMaxActiveClaimsForLevel(undefined)).toBe(1);
    });

    it("has all canonical schema levels defined in CLAIM_LIMITS_BY_LEVEL", () => {
      const canonicalLevels = [
        "explorer",
        "contributor",
        "active_contributor",
        "core_contributor",
        "maintainer",
        "project_lead",
        "mentor",
      ];
      for (const lvl of canonicalLevels) {
        expect(CLAIM_LIMITS_BY_LEVEL[lvl]).toBeDefined();
        expect(CLAIM_LIMITS_BY_LEVEL[lvl]).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("Claim Lifecycle & Single User Limits", () => {
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

    it("prevents explorer from claiming more than 1 active issue", async () => {
      await expect(
        claimIssue({
          issueId: issue2Id,
          userId: user1Id,
        })
      ).rejects.toThrow(/limit of 1 active claim/);
    });

    it("allows active_contributor to claim up to 2 active issues", async () => {
      const result1 = await claimIssue({
        issueId: issue2Id,
        userId: userActiveId,
      });
      expect(result1.success).toBe(true);
      expect(result1.claim.userId).toBe(userActiveId);

      // Release user1's claim on issue1Id so userActiveId can claim a 2nd issue
      await releaseIssueClaim({ issueId: issue1Id, userId: user1Id });

      const result2 = await claimIssue({
        issueId: issue1Id,
        userId: userActiveId,
      });
      expect(result2.success).toBe(true);

      // Clean up for subsequent tests
      await releaseIssueClaim({ issueId: issue1Id, userId: userActiveId });
      await releaseIssueClaim({ issueId: issue2Id, userId: userActiveId });
    });

    it("allows user to release their own claim", async () => {
      await claimIssue({ issueId: issue1Id, userId: user1Id });
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

  describe("Concurrent Issue Claiming Protection", () => {
    it("guarantees only one winner when two users simultaneously claim the same issue", async () => {
      // Clear all active claims so neither user is blocked by active claim limits
      const db = await getDb();
      await db.delete(schema.issueClaims);

      // Alice and Bob simultaneously click Claim on issue3Id
      const results = await Promise.allSettled([
        claimIssue({ issueId: issue3Id, userId: user1Id }, db),
        claimIssue({ issueId: issue3Id, userId: user2Id }, db),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const rejectedReason = String(
        (rejected[0] as PromiseRejectedResult).reason?.message ||
        (rejected[0] as PromiseRejectedResult).reason
      );
      expect(
        rejectedReason.includes("currently claimed") ||
        rejectedReason.includes("This issue was just claimed by another contributor.")
      ).toBe(true);

      // Verify DB has strictly 1 active claim
      const activeInDb = await db
        .select()
        .from(schema.issueClaims)
        .where(eq(schema.issueClaims.issueId, issue3Id));

      const activeOnly = activeInDb.filter((c: any) => c.status === "active");
      expect(activeOnly.length).toBe(1);
    });
  });
});
