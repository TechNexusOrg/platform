import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { eq } from "drizzle-orm";
import { getContributorMetrics } from "@/lib/metrics/contributor-metrics";

describe("Privacy by Default & Contributor Metric Integrity", () => {
  let db: any;
  const testUserId = "usr_privacy_test_student";
  const officialProjId = "proj_privacy_official";
  const unapprovedProjId = "proj_privacy_unapproved";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
  });

  beforeEach(async () => {
    db = await getDb();

    // Clean tables
    await db.delete(schema.issueClaims);
    await db.delete(schema.contributions);
    await db.delete(schema.issues);
    await db.delete(schema.projects);
    await db.delete(schema.profiles);
    await db.delete(schema.users);

    // Create official and unapproved projects
    await db.insert(schema.projects).values([
      {
        id: officialProjId,
        name: "sdk",
        slug: "sdk",
        githubRepo: "TechNexusOrg/sdk",
        githubRepoId: 101,
        githubOwnerId: 333899669,
        description: "Official SDK",
        primaryLanguage: "TypeScript",
        isOfficial: true,
        contributionEnabled: true,
        approvedAt: new Date(),
      },
      {
        id: unapprovedProjId,
        name: "sandbox",
        slug: "sandbox",
        githubRepo: "TechNexusOrg/sandbox",
        githubRepoId: 102,
        githubOwnerId: 333899669,
        description: "Unapproved sandbox",
        primaryLanguage: "TypeScript",
        isOfficial: false,
        contributionEnabled: false,
        approvedAt: null,
      },
    ]);
  });

  it("defaults new student registration to private (isPublic = false)", async () => {
    await db.insert(schema.users).values({
      id: testUserId,
      githubId: 1234567,
      githubUsername: "student_alex",
      role: "contributor",
      level: "explorer",
    });

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId));

    expect(user.isPublic).toBe(false);
    expect(user.publicConsentGivenAt).toBeNull();
  });

  it("tracks publicConsentGivenAt timestamp when user explicitly consents to public profile", async () => {
    await db.insert(schema.users).values({
      id: testUserId,
      githubId: 1234567,
      githubUsername: "student_alex",
      role: "contributor",
      level: "explorer",
      isPublic: false,
    });

    const consentDate = new Date();
    await db
      .update(schema.users)
      .set({
        isPublic: true,
        publicConsentGivenAt: consentDate,
      })
      .where(eq(schema.users.id, testUserId));

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId));

    expect(user.isPublic).toBe(true);
    expect(user.publicConsentGivenAt).toBeDefined();
  });

  it("strict metric integrity: does not grant issuesResolved credit for claims on unapproved projects", async () => {
    await db.insert(schema.users).values({
      id: testUserId,
      githubId: 1234567,
      githubUsername: "student_alex",
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
    });

    // Create 1 issue on official project, 1 on unapproved project
    const officialIssueId = "iss_official_1";
    const unapprovedIssueId = "iss_unapproved_1";

    await db.insert(schema.issues).values([
      {
        id: officialIssueId,
        projectId: officialProjId,
        githubIssueId: 501,
        githubIssueNumber: 1,
        title: "Official bug",
        htmlUrl: "https://github.com/TechNexusOrg/sdk/issues/1",
      },
      {
        id: unapprovedIssueId,
        projectId: unapprovedProjId,
        githubIssueId: 502,
        githubIssueNumber: 2,
        title: "Sandbox bug",
        htmlUrl: "https://github.com/TechNexusOrg/sandbox/issues/2",
      },
    ]);

    // Complete claims on both
    await db.insert(schema.issueClaims).values([
      {
        id: "claim_valid",
        issueId: officialIssueId,
        userId: testUserId,
        status: "completed",
        expiresAt: new Date(Date.now() + 86400000),
      },
      {
        id: "claim_invalid_unapproved",
        issueId: unapprovedIssueId,
        userId: testUserId,
        status: "completed",
        expiresAt: new Date(Date.now() + 86400000),
      },
    ]);

    const metrics = await getContributorMetrics(testUserId, db);
    // Only the official project completed claim must be counted!
    expect(metrics.issuesResolved).toBe(1);
  });
});
