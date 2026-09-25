import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import type { ContributorMetrics } from "@/lib/progression/rules";

/**
 * Calculates authoritative, server-verified contributor metrics for progression and dashboard display.
 * Strictly verifies approved projects, eliminates duplicate reviews, ignores dismissed reviews,
 * and excludes self-reviews.
 */
export async function getContributorMetrics(
  userId: string,
  customDb?: any
): Promise<ContributorMetrics> {
  const db = customDb || (await getDb());

  // 1. Fetch user record
  const [user] = await db
    .select({
      id: schema.users.id,
      githubId: schema.users.githubId,
      githubUsername: schema.users.githubUsername,
      role: schema.users.role,
      isOnboarded: schema.users.isOnboarded,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    return {
      prsOpened: 0,
      prsMerged: 0,
      issuesResolved: 0,
      reviewsCompleted: 0,
      projectsContributedCount: 0,
      isOnboarded: false,
    };
  }

  // 2. Fetch contributions on official, approved projects
  const contributions = await db
    .select({
      id: schema.contributions.id,
      projectId: schema.contributions.projectId,
      prNumber: schema.contributions.githubPrNumber,
      prUrl: schema.contributions.prUrl,
      state: schema.contributions.state,
      isOfficial: schema.projects.isOfficial,
      contributionEnabled: schema.projects.contributionEnabled,
      approvedAt: schema.projects.approvedAt,
    })
    .from(schema.contributions)
    .innerJoin(schema.projects, eq(schema.contributions.projectId, schema.projects.id))
    .where(eq(schema.contributions.userId, userId));

  // Filter contributions to approved official projects only
  const validContributions = contributions.filter(
    (c: any) => c.isOfficial && c.contributionEnabled && c.approvedAt
  );

  // Deduplicate contributions by canonical prUrl
  const seenPrUrls = new Set<string>();
  const deduplicatedContributions: typeof validContributions = [];
  for (const c of validContributions) {
    const key = c.prUrl ? c.prUrl.toLowerCase() : `proj_${c.projectId}_pr_${c.prNumber}`;
    if (!seenPrUrls.has(key)) {
      seenPrUrls.add(key);
      deduplicatedContributions.push(c);
    }
  }

  const mergedContributions = deduplicatedContributions.filter((c: any) => c.state === "merged");
  const uniqueOfficialProjects = new Set(mergedContributions.map((c: any) => c.projectId));

  // 3. Fetch completed issue claims
  const completedClaims = await db
    .select({ id: schema.issueClaims.id })
    .from(schema.issueClaims)
    .where(
      and(
        eq(schema.issueClaims.userId, userId),
        eq(schema.issueClaims.status, "completed")
      )
    );

  // 4. Fetch code reviews completed by this user
  // Avoid self-review, avoid dismissed reviews, avoid duplicate review events on the same PR
  const reviews = await db
    .select({
      id: schema.pullRequestReviews.id,
      pullRequestId: schema.pullRequestReviews.pullRequestId,
      reviewState: schema.pullRequestReviews.reviewState,
      reviewerGithubId: schema.pullRequestReviews.reviewerGithubId,
      reviewerUsername: schema.pullRequestReviews.reviewerUsername,
      prAuthorUserId: schema.pullRequests.userId,
      isOfficial: schema.projects.isOfficial,
      contributionEnabled: schema.projects.contributionEnabled,
    })
    .from(schema.pullRequestReviews)
    .innerJoin(
      schema.pullRequests,
      eq(schema.pullRequestReviews.pullRequestId, schema.pullRequests.id)
    )
    .innerJoin(
      schema.projects,
      eq(schema.pullRequests.projectId, schema.projects.id)
    )
    .where(
      eq(schema.pullRequestReviews.reviewerGithubId, user.githubId)
    );

  const eligibleReviewedPrIds = new Set<string>();
  for (const r of reviews as any[]) {
    // Only count reviews on official projects
    if (!r.isOfficial || !r.contributionEnabled) {
      continue;
    }

    // Ignore dismissed reviews
    if (r.reviewState === "dismissed") {
      continue;
    }

    // Only count legitimate review outcomes
    if (r.reviewState !== "approved" && r.reviewState !== "changes_requested") {
      continue;
    }

    // Exclude self-reviews
    if (r.prAuthorUserId && r.prAuthorUserId === userId) {
      continue;
    }

    // Add unique PR id
    eligibleReviewedPrIds.add(r.pullRequestId);
  }

  return {
    prsOpened: deduplicatedContributions.length,
    prsMerged: mergedContributions.length,
    issuesResolved: completedClaims.length,
    reviewsCompleted: eligibleReviewedPrIds.size,
    projectsContributedCount: uniqueOfficialProjects.size,
    isOnboarded: Boolean(user.isOnboarded),
    isMaintainerAssigned: user.role === "maintainer",
    isProjectLeadAssigned: user.role === "project_lead",
    isMentorAssigned: user.role === "mentor",
  };
}
