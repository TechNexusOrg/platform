import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { claimFoundingMembership } from "./index";
import { eq } from "drizzle-orm";

describe("Founding 1,000 Allocation Engine", () => {
  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
  });

  it("assigns sequential member numbers to contributors with verified first PRs", async () => {
    const db = await getDb();

    // Seed test project
    await db.insert(schema.projects).values({
      id: "proj_founding_test",
      name: "platform",
      slug: "platform",
      githubRepo: "TechNexusOrg/platform",
      description: "Platform repo",
      primaryLanguage: "TypeScript",
      languages: ["TypeScript"],
      isOfficial: true,
    });

    // Seed test user 1
    const userId1 = "usr_founding_test_001";
    await db.insert(schema.users).values({
      id: userId1,
      githubId: 881101,
      githubUsername: "founding_alpha",
      displayName: "Alpha Founder",
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
    });

    // Seed test user 2
    const userId2 = "usr_founding_test_002";
    await db.insert(schema.users).values({
      id: userId2,
      githubId: 881102,
      githubUsername: "founding_beta",
      displayName: "Beta Founder",
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
    });

    // Seed contributions for user 1 & 2
    await db.insert(schema.contributions).values([
      {
        id: "contrib_001",
        userId: userId1,
        projectId: "proj_founding_test",
        githubPrNumber: 101,
        prTitle: "fix: initial setup",
        prUrl: "https://github.com/TechNexusOrg/platform/pull/101",
        state: "merged",
        isFirstPr: true,
        mergedAt: new Date(),
      },
      {
        id: "contrib_002",
        userId: userId2,
        projectId: "proj_founding_test",
        githubPrNumber: 102,
        prTitle: "feat: add cli parser",
        prUrl: "https://github.com/TechNexusOrg/platform/pull/102",
        state: "merged",
        isFirstPr: true,
        mergedAt: new Date(),
      },
      {
        id: "contrib_duplicate",
        userId: userId1,
        projectId: "proj_founding_test",
        githubPrNumber: 999,
        prTitle: "duplicate pr",
        prUrl: "https://github.com/TechNexusOrg/platform/pull/999",
        state: "merged",
        isFirstPr: false,
        mergedAt: new Date(),
      },
    ]);

    // Claim for user 1
    const res1 = await claimFoundingMembership(db, {
      userId: userId1,
      contributionId: "contrib_001",
      githubUsername: "founding_alpha",
      repo: "TechNexusOrg/platform",
      prNumber: 101,
      prUrl: "https://github.com/TechNexusOrg/platform/pull/101",
      prTitle: "fix: initial setup",
      mergedAt: new Date(),
    });

    expect(res1.claimed).toBe(true);
    expect(res1.memberNumber).toBeGreaterThanOrEqual(1);

    // Claim for user 2
    const res2 = await claimFoundingMembership(db, {
      userId: userId2,
      contributionId: "contrib_002",
      githubUsername: "founding_beta",
      repo: "TechNexusOrg/platform",
      prNumber: 102,
      prUrl: "https://github.com/TechNexusOrg/platform/pull/102",
      prTitle: "feat: add cli parser",
      mergedAt: new Date(),
    });

    expect(res2.claimed).toBe(true);
    expect(res2.memberNumber).toBe((res1.memberNumber || 0) + 1);

    // Verify user record reflects the founding number
    const [user1] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId1));
    expect(user1.foundingNumber).toBe(res1.memberNumber);

    // Verify founding_1000 credential was minted
    const creds = await db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.userId, userId1));

    const foundingCred = creds.find((c: any) => c.type === "founding_1000");
    expect(foundingCred).toBeDefined();
    expect(foundingCred?.status).toBe("active");
  });

  it("prevents duplicate founding claims for the same user", async () => {
    const db = await getDb();
    const userId = "usr_founding_test_001";

    const duplicateRes = await claimFoundingMembership(db, {
      userId,
      contributionId: "contrib_duplicate",
      githubUsername: "founding_alpha",
      repo: "TechNexusOrg/platform",
      prNumber: 999,
      prUrl: "https://github.com/TechNexusOrg/platform/pull/999",
      prTitle: "duplicate pr",
      mergedAt: new Date(),
    });

    expect(duplicateRes.claimed).toBe(true);
    expect(duplicateRes.reason).toBe("already_claimed");
  });
});
