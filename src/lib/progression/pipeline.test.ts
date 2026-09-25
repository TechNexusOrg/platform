import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { processProgressionOnContribution } from "./pipeline";
import { eq, and } from "drizzle-orm";

describe("Contributor Progression Automation Pipeline", () => {
  const userId = "usr_progression_pipeline_test";
  const projectId = "proj_progression_test";
  const repoFullName = "TechNexusOrg/test-runner";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();

    const db = await getDb();

    // Seed test user as explorer
    await db.insert(schema.users).values({
      id: userId,
      githubId: 9922001,
      githubUsername: "pipeline_explorer",
      displayName: "Pipeline Explorer",
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
    });

    // Seed test official project
    await db.insert(schema.projects).values({
      id: projectId,
      name: "test-runner",
      slug: "test-runner",
      githubRepo: repoFullName,
      description: "Automated test runner",
      primaryLanguage: "TypeScript",
      languages: ["TypeScript"],
      isOfficial: true,
      contributionEnabled: true,
      firstPrEnabled: true,
      approvedAt: new Date(),
    });
  });

  it("promotes explorer to contributor and mints first_pr_merged and founding_1000 on first PR", async () => {
    const db = await getDb();
    const contribId = "contrib_first_pr_001";
    const mergedAt = new Date();

    // Insert first contribution record
    await db.insert(schema.contributions).values({
      id: contribId,
      userId,
      projectId,
      githubPrNumber: 1,
      prTitle: "fix: solve memory leak in test suite",
      prUrl: `https://github.com/${repoFullName}/pull/1`,
      state: "merged",
      isFirstPr: true,
      mergedAt,
      verifiedAt: new Date(),
      verificationSource: "github_webhook",
    });

    const result = await processProgressionOnContribution(db, {
      userId,
      contributionId: contribId,
      githubUsername: "pipeline_explorer",
      repoFullName,
      prNumber: 1,
      prUrl: `https://github.com/${repoFullName}/pull/1`,
      prTitle: "fix: solve memory leak in test suite",
      mergedAt,
      isFirstPr: true,
    });

    expect(result.promoted).toBe(true);
    expect(result.previousLevel).toBe("explorer");
    expect(result.newLevel).toBe("contributor");
    expect(result.credentialsIssued.length).toBeGreaterThanOrEqual(1);
    expect(result.foundingMemberNumber).toBeGreaterThanOrEqual(1);

    // Verify database user level updated
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(user.level).toBe("contributor");

    // Verify first_pr_merged credential exists
    const creds = await db
      .select()
      .from(schema.credentials)
      .where(
        and(
          eq(schema.credentials.userId, userId),
          eq(schema.credentials.type, "first_pr_merged")
        )
      );
    expect(creds.length).toBe(1);
    expect(creds[0].status).toBe("active");
  });

  it("promotes contributor to active_contributor upon 3 merged PRs and mints verified_contributor credential", async () => {
    const db = await getDb();

    // Insert 2nd merged contribution
    await db.insert(schema.contributions).values({
      id: "contrib_pipeline_002",
      userId,
      projectId,
      githubPrNumber: 2,
      prTitle: "feat: add colored test reporter",
      prUrl: `https://github.com/${repoFullName}/pull/2`,
      state: "merged",
      isFirstPr: false,
      mergedAt: new Date(),
      verifiedAt: new Date(),
    });

    // Insert 3rd merged contribution
    const contribId3 = "contrib_pipeline_003";
    const mergedAt3 = new Date();
    await db.insert(schema.contributions).values({
      id: contribId3,
      userId,
      projectId,
      githubPrNumber: 3,
      prTitle: "perf: cache test runner artifacts",
      prUrl: `https://github.com/${repoFullName}/pull/3`,
      state: "merged",
      isFirstPr: false,
      mergedAt: mergedAt3,
      verifiedAt: new Date(),
    });

    // Run progression on 3rd contribution
    const result = await processProgressionOnContribution(db, {
      userId,
      contributionId: contribId3,
      githubUsername: "pipeline_explorer",
      repoFullName,
      prNumber: 3,
      prUrl: `https://github.com/${repoFullName}/pull/3`,
      prTitle: "perf: cache test runner artifacts",
      mergedAt: mergedAt3,
      isFirstPr: false,
    });

    expect(result.promoted).toBe(true);
    expect(result.previousLevel).toBe("contributor");
    expect(result.newLevel).toBe("active_contributor");

    // Verify verified_contributor credential exists
    const verifiedCreds = await db
      .select()
      .from(schema.credentials)
      .where(
        and(
          eq(schema.credentials.userId, userId),
          eq(schema.credentials.type, "verified_contributor")
        )
      );
    expect(verifiedCreds.length).toBe(1);
    expect(verifiedCreds[0].status).toBe("active");
  });
});
