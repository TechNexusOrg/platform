import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { getContributorMetrics } from "./contributor-metrics";
import { evaluateProgression } from "@/lib/progression/rules";

describe("Authoritative Contributor Metrics Engine", () => {
  const userZeroId = "usr_metrics_zero";
  const userAliceId = "usr_metrics_alice";
  const projectOfficial1Id = "proj_metrics_off_1";
  const projectOfficial2Id = "proj_metrics_off_2";
  const projectUnapprovedId = "proj_metrics_unapproved";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
    const db = await getDb();

    // Seed test users
    await db.insert(schema.users).values([
      {
        id: userZeroId,
        githubId: 889901,
        githubUsername: "metrics_zero",
        displayName: "Zero Metrics User",
        role: "contributor",
        level: "explorer",
        isOnboarded: false,
      },
      {
        id: userAliceId,
        githubId: 889902,
        githubUsername: "metrics_alice",
        displayName: "Alice Contributor",
        role: "contributor",
        level: "explorer",
        isOnboarded: true,
      },
    ]);

    // Seed official approved projects
    await db.insert(schema.projects).values([
      {
        id: projectOfficial1Id,
        name: "Official Repo 1",
        slug: "off-repo-1",
        githubRepo: "TechNexusOrg/off-repo-1",
        description: "Official repository 1",
        primaryLanguage: "TypeScript",
        isOfficial: true,
        contributionEnabled: true,
        firstPrEnabled: true,
        approvedAt: new Date(),
      },
      {
        id: projectOfficial2Id,
        name: "Official Repo 2",
        slug: "off-repo-2",
        githubRepo: "TechNexusOrg/off-repo-2",
        description: "Official repository 2",
        primaryLanguage: "TypeScript",
        isOfficial: true,
        contributionEnabled: true,
        firstPrEnabled: true,
        approvedAt: new Date(),
      },
      {
        id: projectUnapprovedId,
        name: "Unapproved Repo",
        slug: "unapproved-repo",
        githubRepo: "TechNexusOrg/unapproved-repo",
        description: "Unapproved repository",
        primaryLanguage: "TypeScript",
        isOfficial: false,
        contributionEnabled: false,
        firstPrEnabled: false,
        approvedAt: null,
      },
    ]);
  });

  it("returns zero metrics for a newly registered, non-onboarded user", async () => {
    const db = await getDb();
    const metrics = await getContributorMetrics(userZeroId, db);

    expect(metrics.prsOpened).toBe(0);
    expect(metrics.prsMerged).toBe(0);
    expect(metrics.issuesResolved).toBe(0);
    expect(metrics.reviewsCompleted).toBe(0);
    expect(metrics.projectsContributedCount).toBe(0);
    expect(metrics.isOnboarded).toBe(false);

    const progression = evaluateProgression("explorer", metrics);
    expect(progression.eligibleLevel).toBe("explorer");
    expect(progression.canPromote).toBe(false);
  });

  it("excludes contributions and reviews from unapproved projects", async () => {
    const db = await getDb();

    // Add contribution on unapproved project
    await db.insert(schema.contributions).values({
      id: "contrib_unapproved_1",
      userId: userAliceId,
      projectId: projectUnapprovedId,
      githubPrNumber: 1,
      prTitle: "fix: unauthorized contribution",
      prUrl: "https://github.com/TechNexusOrg/unapproved-repo/pull/1",
      state: "merged",
      isFirstPr: true,
      mergedAt: new Date(),
    });

    const metrics = await getContributorMetrics(userAliceId, db);
    expect(metrics.prsMerged).toBe(0);
    expect(metrics.projectsContributedCount).toBe(0);
  });

  it("evaluates contributor threshold upon legitimate merged PR on approved project", async () => {
    const db = await getDb();

    // Add legitimate contribution on official project 1
    await db.insert(schema.contributions).values({
      id: "contrib_official_1",
      userId: userAliceId,
      projectId: projectOfficial1Id,
      githubPrNumber: 10,
      prTitle: "feat: add robust metric pipeline",
      prUrl: "https://github.com/TechNexusOrg/off-repo-1/pull/10",
      state: "merged",
      isFirstPr: true,
      mergedAt: new Date(),
    });

    const metrics = await getContributorMetrics(userAliceId, db);
    expect(metrics.prsMerged).toBe(1);
    expect(metrics.projectsContributedCount).toBe(1);
    expect(metrics.isOnboarded).toBe(true);

    const progression = evaluateProgression("explorer", metrics);
    expect(progression.eligibleLevel).toBe("contributor");
    expect(progression.canPromote).toBe(true);
  });

  it("excludes self-reviews and dismissed reviews from reviewsCompleted count", async () => {
    const db = await getDb();

    // Create a PR authored by Alice
    const alicePrId = "pr_authored_by_alice";
    await db.insert(schema.pullRequests).values({
      id: alicePrId,
      userId: userAliceId,
      projectId: projectOfficial1Id,
      githubPrId: 1010,
      githubPrNumber: 10,
      title: "feat: add robust metric pipeline",
      url: "https://github.com/TechNexusOrg/off-repo-1/pull/10",
      state: "merged",
      openedAt: new Date(),
    });

    // Alice reviews her own PR (self-review)
    await db.insert(schema.pullRequestReviews).values({
      id: "review_alice_self",
      pullRequestId: alicePrId,
      reviewerGithubId: 889902,
      reviewerUsername: "metrics_alice",
      reviewState: "approved",
      submittedAt: new Date(),
    });

    // Create a PR authored by someone else
    const bobPrId = "pr_authored_by_bob";
    await db.insert(schema.pullRequests).values({
      id: bobPrId,
      projectId: projectOfficial1Id,
      githubPrId: 1011,
      githubPrNumber: 11,
      title: "fix: memory leak",
      url: "https://github.com/TechNexusOrg/off-repo-1/pull/11",
      state: "open",
      openedAt: new Date(),
    });

    // Alice submits a review that is dismissed
    await db.insert(schema.pullRequestReviews).values({
      id: "review_alice_dismissed",
      pullRequestId: bobPrId,
      reviewerGithubId: 889902,
      reviewerUsername: "metrics_alice",
      reviewState: "dismissed",
      submittedAt: new Date(),
    });

    // Alice submits multiple legitimate reviews on the same PR (bobPrId)
    await db.insert(schema.pullRequestReviews).values([
      {
        id: "review_alice_valid_1",
        pullRequestId: bobPrId,
        reviewerGithubId: 889902,
        reviewerUsername: "metrics_alice",
        reviewState: "changes_requested",
        submittedAt: new Date(),
      },
      {
        id: "review_alice_valid_2",
        pullRequestId: bobPrId,
        reviewerGithubId: 889902,
        reviewerUsername: "metrics_alice",
        reviewState: "approved",
        submittedAt: new Date(),
      },
    ]);

    const metrics = await getContributorMetrics(userAliceId, db);
    // Even though there are 4 reviews in the table:
    // - 1 is self-review (excluded)
    // - 1 is dismissed (excluded)
    // - 2 are on the same PR (deduplicated to 1 PR review)
    expect(metrics.reviewsCompleted).toBe(1);
  });

  it("reaches core contributor threshold when all criteria (5 PRs, 2 reviews, 2 projects, 2 issues) are met", async () => {
    const db = await getDb();

    // 1. Add 4 more merged PRs across official repo 1 and official repo 2 (total 5 PRs, 2 projects)
    await db.insert(schema.contributions).values([
      {
        id: "contrib_official_2",
        userId: userAliceId,
        projectId: projectOfficial1Id,
        githubPrNumber: 12,
        prTitle: "feat: telemetry dashboard",
        prUrl: "https://github.com/TechNexusOrg/off-repo-1/pull/12",
        state: "merged",
        mergedAt: new Date(),
      },
      {
        id: "contrib_official_3",
        userId: userAliceId,
        projectId: projectOfficial1Id,
        githubPrNumber: 13,
        prTitle: "fix: flaky timeout",
        prUrl: "https://github.com/TechNexusOrg/off-repo-1/pull/13",
        state: "merged",
        mergedAt: new Date(),
      },
      {
        id: "contrib_official_4",
        userId: userAliceId,
        projectId: projectOfficial2Id,
        githubPrNumber: 21,
        prTitle: "feat: database connector",
        prUrl: "https://github.com/TechNexusOrg/off-repo-2/pull/21",
        state: "merged",
        mergedAt: new Date(),
      },
      {
        id: "contrib_official_5",
        userId: userAliceId,
        projectId: projectOfficial2Id,
        githubPrNumber: 22,
        prTitle: "refactor: optimize cache",
        prUrl: "https://github.com/TechNexusOrg/off-repo-2/pull/22",
        state: "merged",
        mergedAt: new Date(),
      },
    ]);

    // 2. Add a second distinct PR review on official repo 2
    const carolPrId = "pr_authored_by_carol";
    await db.insert(schema.pullRequests).values({
      id: carolPrId,
      projectId: projectOfficial2Id,
      githubPrId: 2030,
      githubPrNumber: 30,
      title: "docs: add architecture spec",
      url: "https://github.com/TechNexusOrg/off-repo-2/pull/30",
      state: "merged",
      openedAt: new Date(),
    });

    await db.insert(schema.pullRequestReviews).values({
      id: "review_alice_valid_3",
      pullRequestId: carolPrId,
      reviewerGithubId: 889902,
      reviewerUsername: "metrics_alice",
      reviewState: "approved",
      submittedAt: new Date(),
    });

    // 3. Add 2 completed issue claims
    // Seed issues first
    await db.insert(schema.issues).values([
      {
        id: "iss_metrics_1",
        projectId: projectOfficial1Id,
        githubIssueId: 771,
        githubIssueNumber: 101,
        title: "Test issue 1",
        state: "closed",
        htmlUrl: "https://github.com/TechNexusOrg/off-repo-1/issues/101",
      },
      {
        id: "iss_metrics_2",
        projectId: projectOfficial2Id,
        githubIssueId: 772,
        githubIssueNumber: 201,
        title: "Test issue 2",
        state: "closed",
        htmlUrl: "https://github.com/TechNexusOrg/off-repo-2/issues/201",
      },
    ]);

    await db.insert(schema.issueClaims).values([
      {
        id: "claim_alice_1",
        issueId: "iss_metrics_1",
        userId: userAliceId,
        status: "completed",
        claimedAt: new Date(),
        expiresAt: new Date(),
      },
      {
        id: "claim_alice_2",
        issueId: "iss_metrics_2",
        userId: userAliceId,
        status: "completed",
        claimedAt: new Date(),
        expiresAt: new Date(),
      },
    ]);

    const metrics = await getContributorMetrics(userAliceId, db);
    expect(metrics.prsMerged).toBe(5);
    expect(metrics.reviewsCompleted).toBe(2);
    expect(metrics.projectsContributedCount).toBe(2);
    expect(metrics.issuesResolved).toBe(2);

    const progression = evaluateProgression("active_contributor", metrics);
    expect(progression.eligibleLevel).toBe("core_contributor");
    expect(progression.canPromote).toBe(true);
  });
});
