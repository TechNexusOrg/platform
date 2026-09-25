import crypto from "crypto";
import { env } from "@/lib/env";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { processProgressionOnContribution } from "@/lib/progression/pipeline";

/**
 * Validates HMAC SHA256 webhook signature against configured secret using timingSafeEqual.
 */
export function verifyWebhookSignature(payloadBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payloadBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * Extracts referenced issue numbers from a pull request title and body using standard GitHub keywords.
 * Examples: "Fixes #12", "Closes https://github.com/TechNexusOrg/platform/issues/45", "Resolves #8"
 */
export function extractIssueNumbersFromPrBody(body: string | null | undefined): number[] {
  if (!body) return [];

  const issueNumbers = new Set<number>();

  // Match keyword closing syntax: Fixes #123, Closes #45, Resolves #89
  const keywordRegex =
    /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(?:#|https?:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/issues\/)(\d+)/gi;

  let match: RegExpExecArray | null;
  while ((match = keywordRegex.exec(body)) !== null) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) {
      issueNumbers.add(num);
    }
  }

  // Also match fallback "#<number>" when explicitly written
  const hashtagRegex = /#(\d+)/g;
  while ((match = hashtagRegex.exec(body)) !== null) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) {
      issueNumbers.add(num);
    }
  }

  return Array.from(issueNumbers);
}

export interface WebhookPullRequestEvent {
  action: "opened" | "closed" | "reopened" | "synchronize" | "edited";
  pull_request: {
    id: number;
    number: number;
    title: string;
    body?: string | null;
    html_url: string;
    state: "open" | "closed";
    draft?: boolean;
    merged: boolean;
    merged_at: string | null;
    closed_at?: string | null;
    merge_commit_sha?: string | null;
    user: {
      id: number;
      login: string;
      avatar_url: string;
    };
    base: {
      repo: {
        id: number;
        name: string;
        full_name: string;
        html_url: string;
      };
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    id: number;
    login: string;
  };
}

export interface WebhookPullRequestReviewEvent {
  action: "submitted" | "edited" | "dismissed";
  review: {
    id: number;
    state: string; // "approved" | "changes_requested" | "commented" | "dismissed"
    html_url: string;
    submitted_at: string;
    user: {
      id: number;
      login: string;
      avatar_url: string;
    };
  };
  pull_request: {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: "open" | "closed";
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
  sender: {
    id: number;
    login: string;
  };
}

/**
 * Checks if a GitHub webhook delivery ID has already been successfully processed.
 */
export async function isWebhookDeliveryProcessed(
  deliveryId: string,
  database?: any
): Promise<boolean> {
  const db = database || (await getDb());
  const existing = await db
    .select({ status: schema.githubWebhookDeliveries.status })
    .from(schema.githubWebhookDeliveries)
    .where(eq(schema.githubWebhookDeliveries.deliveryId, deliveryId))
    .limit(1);

  return existing.length > 0 && existing[0].status === "completed";
}

/**
 * Records an incoming webhook delivery with initial status.
 */
export async function recordWebhookDelivery(
  params: {
    deliveryId: string;
    eventType: string;
    repository?: string;
  },
  database?: any
) {
  const db = database || (await getDb());
  const now = new Date();

  const existing = await db
    .select({ id: schema.githubWebhookDeliveries.id })
    .from(schema.githubWebhookDeliveries)
    .where(eq(schema.githubWebhookDeliveries.deliveryId, params.deliveryId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(schema.githubWebhookDeliveries).values({
      id: `whdel_${crypto.randomUUID()}`,
      deliveryId: params.deliveryId,
      eventType: params.eventType,
      repository: params.repository || null,
      status: "processing",
      receivedAt: now,
    });
  }
}

/**
 * Marks a webhook delivery as completed.
 */
export async function markWebhookDeliveryCompleted(
  deliveryId: string,
  database?: any
) {
  const db = database || (await getDb());
  await db
    .update(schema.githubWebhookDeliveries)
    .set({
      status: "completed",
      processedAt: new Date(),
    })
    .where(eq(schema.githubWebhookDeliveries.deliveryId, deliveryId));
}

/**
 * Marks a webhook delivery as failed.
 */
export async function markWebhookDeliveryFailed(
  deliveryId: string,
  error: string,
  database?: any
) {
  const db = database || (await getDb());
  await db
    .update(schema.githubWebhookDeliveries)
    .set({
      status: "failed",
      error,
      processedAt: new Date(),
    })
    .where(eq(schema.githubWebhookDeliveries.deliveryId, deliveryId));
}

/**
 * Handles pull_request webhook events:
 * - Upserts PR record into `pull_requests`
 * - Links PR to referenced issues and active claims
 * - On merge: auto-completes claims, closes issues, records verified contribution, updates progression
 */
export async function handlePullRequestWebhook(
  payload: WebhookPullRequestEvent,
  database?: any
) {
  const db = database || (await getDb());
  const pr = payload.pull_request;
  const repoFullName = payload.repository.full_name;
  const now = new Date();

  // 1. Resolve or create project with repository trust boundary enforcement
  const matchingProjects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.githubRepo, repoFullName))
    .limit(1);

  let projectId: string;
  let isContributionEligible = false;

  if (matchingProjects.length === 0) {
    const isTechNexusOrg = repoFullName.toLowerCase().startsWith("technexusorg/");
    if (!isTechNexusOrg) {
      return {
        handled: false,
        reason: "Repository outside official organization trust boundary.",
        prId: null,
      };
    }

    projectId = `proj_${crypto.randomUUID()}`;
    await db.insert(schema.projects).values({
      id: projectId,
      name: payload.repository.name,
      slug: payload.repository.name.toLowerCase(),
      githubRepo: repoFullName,
      description: `Official repository: ${repoFullName}`,
      primaryLanguage: "TypeScript",
      languages: [],
      isOfficial: true,
      contributionEnabled: true,
    });
    isContributionEligible = true;
  } else {
    const project = matchingProjects[0];
    projectId = project.id;
    isContributionEligible = project.isOfficial && project.contributionEnabled;
  }

  if (!isContributionEligible) {
    return {
      handled: false,
      reason: "Repository is outside official contribution scope or contributions are disabled.",
      prId: null,
    };
  }

  // 2. Resolve user if registered on platform
  const matchingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.githubId, pr.user.id))
    .limit(1);

  const registeredUser = matchingUsers.length > 0 ? matchingUsers[0] : null;

  // 3. Extract and match referenced issues
  const fullText = `${pr.title} ${pr.body || ""}`;
  const issueNumbers = extractIssueNumbersFromPrBody(fullText);

  let matchedIssueId: string | null = null;
  if (issueNumbers.length > 0) {
    // Check if any referenced issue exists for this project in our database
    for (const num of issueNumbers) {
      const issues = await db
        .select({ id: schema.issues.id })
        .from(schema.issues)
        .where(
          and(
            eq(schema.issues.projectId, projectId),
            eq(schema.issues.githubIssueNumber, num)
          )
        )
        .limit(1);

      if (issues.length > 0) {
        matchedIssueId = issues[0].id;
        break;
      }
    }
  }

  // 4. Map PR state
  let prState: "open" | "approved" | "changes_requested" | "merged" | "closed" = "open";
  if (pr.merged) {
    prState = "merged";
  } else if (pr.state === "closed") {
    prState = "closed";
  }

  // 5. Upsert into pull_requests table
  const existingPrs = await db
    .select()
    .from(schema.pullRequests)
    .where(eq(schema.pullRequests.url, pr.html_url))
    .limit(1);

  let prRecordId: string;
  if (existingPrs.length > 0) {
    prRecordId = existingPrs[0].id;
    await db
      .update(schema.pullRequests)
      .set({
        title: pr.title,
        state: prState,
        draft: pr.draft || false,
        mergeCommitSha: pr.merge_commit_sha || null,
        issueId: matchedIssueId || existingPrs[0].issueId,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        updatedAt: now,
      })
      .where(eq(schema.pullRequests.id, prRecordId));
  } else {
    prRecordId = `pr_${crypto.randomUUID()}`;
    await db.insert(schema.pullRequests).values({
      id: prRecordId,
      userId: registeredUser?.id || null,
      projectId,
      issueId: matchedIssueId,
      githubPrId: pr.id,
      githubPrNumber: pr.number,
      title: pr.title,
      url: pr.html_url,
      state: prState,
      draft: pr.draft || false,
      mergeCommitSha: pr.merge_commit_sha || null,
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 6. If PR is merged: close issue, complete active claims, and record verified contribution
  let contributionId: string | undefined;
  let progressionResult: any | undefined;

  if (payload.action === "closed" && pr.merged) {
    // A. If an issue was linked, complete the active claim and close the issue
    if (matchedIssueId) {
      // Mark issue closed
      await db
        .update(schema.issues)
        .set({
          state: "closed",
          updatedAt: now,
        })
        .where(eq(schema.issues.id, matchedIssueId));

      // Mark active claim completed
      await db
        .update(schema.issueClaims)
        .set({
          status: "completed",
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.issueClaims.issueId, matchedIssueId),
            eq(schema.issueClaims.status, "active")
          )
        );
    }

    // B. If the author is a registered contributor, record verified contribution & evaluate progression
    if (registeredUser) {
      const existingContribs = await db
        .select()
        .from(schema.contributions)
        .where(
          and(
            eq(schema.contributions.userId, registeredUser.id),
            eq(schema.contributions.state, "merged")
          )
        );

      const isFirstPr = existingContribs.length === 0;
      contributionId = `contrib_${crypto.randomUUID()}`;
      const mergedDate = pr.merged_at ? new Date(pr.merged_at) : now;

      // Upsert contribution by prUrl
      const existingByUrl = await db
        .select()
        .from(schema.contributions)
        .where(eq(schema.contributions.prUrl, pr.html_url))
        .limit(1);

      if (existingByUrl.length === 0) {
        await db.insert(schema.contributions).values({
          id: contributionId,
          userId: registeredUser.id,
          projectId,
          issueId: matchedIssueId,
          githubPrNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          state: "merged",
          isFirstPr,
          mergedAt: mergedDate,
          verifiedAt: now,
          verificationSource: "github_webhook",
        });

        progressionResult = await processProgressionOnContribution(db, {
          userId: registeredUser.id,
          contributionId,
          githubUsername: registeredUser.githubUsername,
          repoFullName,
          prNumber: pr.number,
          prUrl: pr.html_url,
          prTitle: pr.title,
          mergedAt: mergedDate,
          isFirstPr,
        });
      }
    }
  }

  return {
    handled: true,
    prId: prRecordId,
    linkedIssueId: matchedIssueId,
    registeredAuthor: Boolean(registeredUser),
    contributionId,
    progressionResult,
  };
}

/**
 * Handles pull_request_review webhook events:
 * - Upserts review into `pull_request_reviews`
 * - Updates PR state if approved / changes_requested
 */
export async function handlePullRequestReviewWebhook(
  payload: WebhookPullRequestReviewEvent,
  database?: any
) {
  const db = database || (await getDb());
  const review = payload.review;
  const now = new Date();

  // 1. Resolve PR record in database
  const matchingPrs = await db
    .select()
    .from(schema.pullRequests)
    .where(eq(schema.pullRequests.url, payload.pull_request.html_url))
    .limit(1);

  let prId: string;
  if (matchingPrs.length > 0) {
    prId = matchingPrs[0].id;
  } else {
    // If PR doesn't exist yet, resolve project and insert PR skeleton
    const repoFullName = payload.repository.full_name;
    const matchingProjects = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.githubRepo, repoFullName))
      .limit(1);

    const projectId =
      matchingProjects.length > 0 ? matchingProjects[0].id : `proj_${crypto.randomUUID()}`;

    prId = `pr_${crypto.randomUUID()}`;
    await db.insert(schema.pullRequests).values({
      id: prId,
      projectId,
      githubPrId: payload.pull_request.id,
      githubPrNumber: payload.pull_request.number,
      title: payload.pull_request.title,
      url: payload.pull_request.html_url,
      state: "open",
    });
  }

  // 2. Map review state
  const rawState = review.state.toLowerCase();
  let reviewState: "approved" | "changes_requested" | "commented" | "dismissed" = "commented";
  if (rawState === "approved") {
    reviewState = "approved";
  } else if (rawState === "changes_requested") {
    reviewState = "changes_requested";
  } else if (rawState === "dismissed") {
    reviewState = "dismissed";
  }

  // 3. Upsert into pull_request_reviews
  const reviewId = `rev_${crypto.randomUUID()}`;
  await db.insert(schema.pullRequestReviews).values({
    id: reviewId,
    pullRequestId: prId,
    reviewerGithubId: review.user.id,
    reviewerUsername: review.user.login,
    reviewState,
    submittedAt: review.submitted_at ? new Date(review.submitted_at) : now,
    githubReviewId: review.id,
    htmlUrl: review.html_url,
    createdAt: now,
  });

  // 4. Update PR state if approved / changes_requested
  if (reviewState === "approved" || reviewState === "changes_requested") {
    await db
      .update(schema.pullRequests)
      .set({
        state: reviewState,
        updatedAt: now,
      })
      .where(eq(schema.pullRequests.id, prId));
  }

  return {
    handled: true,
    reviewId,
    prId,
    reviewState,
  };
}
