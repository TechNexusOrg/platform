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
 * Extracts explicit closing keyword issue references from a pull request body.
 * Examples: "Fixes #12", "Closes https://github.com/TechNexusOrg/platform/issues/45", "Resolves #8"
 */
export function extractClosingKeywordIssueNumbers(body: string | null | undefined): number[] {
  if (!body) return [];

  const issueNumbers = new Set<number>();
  const keywordRegex =
    /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(?:#|https?:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/issues\/)(\d+)/gi;

  let match: RegExpExecArray | null;
  while ((match = keywordRegex.exec(body)) !== null) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) {
      issueNumbers.add(num);
    }
  }

  return Array.from(issueNumbers);
}

/**
 * Extracts referenced issue numbers from a pull request title and body using both closing keywords and hashtags.
 */
export function extractIssueNumbersFromPrBody(body: string | null | undefined): number[] {
  if (!body) return [];

  const issueNumbers = new Set<number>(extractClosingKeywordIssueNumbers(body));

  // Also match fallback "#<number>" when explicitly written
  const hashtagRegex = /#(\d+)/g;
  let match: RegExpExecArray | null;
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

  return existing.length > 0 && existing[0].status === "processed";
}

export interface RecordDeliveryResult {
  shouldProcess: boolean;
  status: "received" | "processing" | "processed" | "ignored" | "error";
  isRetry: boolean;
}

/**
 * Atomically records an incoming webhook delivery with idempotent state machine:
 * received -> processing -> processed
 * received -> ignored
 * processing -> error
 * Returns whether processing should continue.
 */
export async function recordWebhookDelivery(
  params: {
    deliveryId: string;
    eventType: string;
    repository?: string;
  },
  database?: any
): Promise<RecordDeliveryResult> {
  const db = database || (await getDb());
  const now = new Date();

  // Check existing delivery state
  const existing = await db
    .select({
      id: schema.githubWebhookDeliveries.id,
      status: schema.githubWebhookDeliveries.status,
    })
    .from(schema.githubWebhookDeliveries)
    .where(eq(schema.githubWebhookDeliveries.deliveryId, params.deliveryId))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    if (current.status === "processed" || current.status === "ignored" || current.status === "processing") {
      return {
        shouldProcess: false,
        status: current.status as any,
        isRetry: false,
      };
    }

    if (current.status === "error") {
      // Retry allowed for previous failure
      await db
        .update(schema.githubWebhookDeliveries)
        .set({
          status: "processing",
          error: null,
          processedAt: null,
        })
        .where(eq(schema.githubWebhookDeliveries.deliveryId, params.deliveryId));

      return {
        shouldProcess: true,
        status: "processing",
        isRetry: true,
      };
    }
  }

  // Atomic insert attempt
  try {
    await db.insert(schema.githubWebhookDeliveries).values({
      id: `whdel_${crypto.randomUUID()}`,
      deliveryId: params.deliveryId,
      eventType: params.eventType,
      repository: params.repository || "unknown",
      status: "processing",
      receivedAt: now,
    });

    return {
      shouldProcess: true,
      status: "processing",
      isRetry: false,
    };
  } catch (err: any) {
    // Concurrent insert collision on unique deliveryId
    if (err.message?.includes("delivery_id") || err.code === "23505") {
      return {
        shouldProcess: false,
        status: "processing",
        isRetry: false,
      };
    }
    throw err;
  }
}

/**
 * Marks a webhook delivery as successfully processed.
 */
export async function markWebhookDeliveryProcessed(
  deliveryId: string,
  database?: any
) {
  const db = database || (await getDb());
  await db
    .update(schema.githubWebhookDeliveries)
    .set({
      status: "processed",
      error: null,
      processedAt: new Date(),
    })
    .where(eq(schema.githubWebhookDeliveries.deliveryId, deliveryId));
}

// Backward-compatible alias
export const markWebhookDeliveryCompleted = markWebhookDeliveryProcessed;

/**
 * Marks a webhook delivery as ignored (e.g. ping, unsupported events, untrusted repos).
 */
export async function markWebhookDeliveryIgnored(
  deliveryId: string,
  reason?: string,
  database?: any
) {
  const db = database || (await getDb());
  await db
    .update(schema.githubWebhookDeliveries)
    .set({
      status: "ignored",
      error: reason || null,
      processedAt: new Date(),
    })
    .where(eq(schema.githubWebhookDeliveries.deliveryId, deliveryId));
}

/**
 * Marks a webhook delivery as error.
 */
export async function markWebhookDeliveryError(
  deliveryId: string,
  error: string,
  database?: any
) {
  const db = database || (await getDb());
  await db
    .update(schema.githubWebhookDeliveries)
    .set({
      status: "error",
      error: error.slice(0, 1000),
      processedAt: new Date(),
    })
    .where(eq(schema.githubWebhookDeliveries.deliveryId, deliveryId));
}

// Backward-compatible alias
export const markWebhookDeliveryFailed = markWebhookDeliveryError;

/**
 * Handles pull_request webhook events:
 * - Upserts PR record into `pull_requests`
 * - Links PR to referenced issues and active claims using priority association
 * - Enforces repository approval trust boundary
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

  // 1. Resolve project and enforce approval trust boundary
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

    // New organization repository discovered: default to unapproved and contribution-disabled
    projectId = `proj_${crypto.randomUUID()}`;
    await db.insert(schema.projects).values({
      id: projectId,
      name: payload.repository.name,
      slug: payload.repository.name.toLowerCase(),
      githubRepo: repoFullName,
      description: `Discovered repository: ${repoFullName}`,
      primaryLanguage: "TypeScript",
      languages: [],
      isOfficial: false,
      contributionEnabled: false,
      firstPrEnabled: false,
      approvedAt: null,
    });
    isContributionEligible = false;
  } else {
    const project = matchingProjects[0];
    projectId = project.id;
    // Strictly require official, approved, and contribution enabled
    isContributionEligible =
      project.isOfficial && project.contributionEnabled && !!project.approvedAt;
  }

  if (!isContributionEligible) {
    return {
      handled: false,
      reason: "Repository is unapproved or contributions are disabled.",
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

  // 3. Robust Issue ↔ PR Linking Priority:
  // Priority 1: Contributor has an existing active claim on an issue in this project
  // Priority 2: Explicit closing keywords (Fixes #123, Closes #123, Resolves #123)
  // Priority 3: Exact hashtag reference (#123)
  // If ambiguous (multiple conflicting references), do not silently link: mark "ambiguous"
  let matchedIssueId: string | null = null;
  let matchedClaimId: string | null = null;
  let associationStatus: "claimed" | "explicit_reference" | "inferred" | "ambiguous" | "unlinked" = "unlinked";
  let associationSource: string | null = null;

  const fullText = `${pr.title} ${pr.body || ""}`;
  const closingKeywordNumbers = extractClosingKeywordIssueNumbers(fullText);
  const allReferencedNumbers = extractIssueNumbersFromPrBody(fullText);

  // Check Priority 1: Active claim by registered PR author
  if (registeredUser) {
    const activeClaims = await db
      .select({
        claimId: schema.issueClaims.id,
        issueId: schema.issueClaims.issueId,
        githubIssueNumber: schema.issues.githubIssueNumber,
      })
      .from(schema.issueClaims)
      .innerJoin(schema.issues, eq(schema.issueClaims.issueId, schema.issues.id))
      .where(
        and(
          eq(schema.issueClaims.userId, registeredUser.id),
          eq(schema.issueClaims.status, "active"),
          eq(schema.issues.projectId, projectId)
        )
      );

    if (activeClaims.length === 1) {
      matchedIssueId = activeClaims[0].issueId;
      matchedClaimId = activeClaims[0].claimId;
      associationStatus = "claimed";
      associationSource = `Active claim by contributor on issue #${activeClaims[0].githubIssueNumber}`;
    }
  }

  // Check Priority 2: Explicit closing keyword (Fixes #123)
  if (!matchedIssueId && closingKeywordNumbers.length > 0) {
    if (closingKeywordNumbers.length === 1) {
      const issues = await db
        .select({ id: schema.issues.id, number: schema.issues.githubIssueNumber })
        .from(schema.issues)
        .where(
          and(
            eq(schema.issues.projectId, projectId),
            eq(schema.issues.githubIssueNumber, closingKeywordNumbers[0])
          )
        )
        .limit(1);

      if (issues.length > 0) {
        matchedIssueId = issues[0].id;
        associationStatus = "explicit_reference";
        associationSource = `Explicit closing keyword Fixes/Closes #${issues[0].number}`;
      }
    } else {
      // Multiple conflicting closing keywords
      associationStatus = "ambiguous";
      associationSource = `Multiple explicit closing keywords: #${closingKeywordNumbers.join(", #")}`;
    }
  }

  // Check Priority 3: Fallback hashtag reference
  if (!matchedIssueId && associationStatus !== "ambiguous" && allReferencedNumbers.length > 0) {
    if (allReferencedNumbers.length === 1) {
      const issues = await db
        .select({ id: schema.issues.id, number: schema.issues.githubIssueNumber })
        .from(schema.issues)
        .where(
          and(
            eq(schema.issues.projectId, projectId),
            eq(schema.issues.githubIssueNumber, allReferencedNumbers[0])
          )
        )
        .limit(1);

      if (issues.length > 0) {
        matchedIssueId = issues[0].id;
        associationStatus = "inferred";
        associationSource = `Inferred hashtag reference #${issues[0].number}`;
      }
    } else {
      associationStatus = "ambiguous";
      associationSource = `Multiple ambiguous issue references: #${allReferencedNumbers.join(", #")}`;
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
        claimId: matchedClaimId || existingPrs[0].claimId,
        associationStatus: matchedIssueId ? associationStatus : existingPrs[0].associationStatus,
        associationSource: associationSource || existingPrs[0].associationSource,
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
      claimId: matchedClaimId,
      associationStatus,
      associationSource,
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
    // A. If an issue was linked, complete active claim and close issue
    if (matchedIssueId) {
      // Complete active claim on this issue
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

      // Mark issue closed
      await db
        .update(schema.issues)
        .set({
          state: "closed",
          updatedAt: now,
        })
        .where(eq(schema.issues.id, matchedIssueId));
    }

    // B. If user is registered on the platform, record verified contribution
    if (registeredUser) {
      // Check existing contribution record
      const existingContribs = await db
        .select()
        .from(schema.contributions)
        .where(eq(schema.contributions.prUrl, pr.html_url))
        .limit(1);

      if (existingContribs.length === 0) {
        // Count previous merged PRs to identify first PR
        const priorMerged = await db
          .select({ id: schema.contributions.id })
          .from(schema.contributions)
          .where(
            and(
              eq(schema.contributions.userId, registeredUser.id),
              eq(schema.contributions.state, "merged")
            )
          );

        const isFirstPr = priorMerged.length === 0;
        contributionId = `contrib_${crypto.randomUUID()}`;

        await db.insert(schema.contributions).values({
          id: contributionId,
          userId: registeredUser.id,
          projectId,
          issueId: matchedIssueId,
          claimId: matchedClaimId,
          githubPrNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          state: "merged",
          isFirstPr,
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : now,
          verifiedAt: now,
          verificationSource: "github_webhook_merge",
          createdAt: now,
          updatedAt: now,
        });

        // Trigger progression evaluation and verifiable credential minting
        progressionResult = await processProgressionOnContribution(
          db,
          {
            userId: registeredUser.id,
            contributionId,
            githubUsername: registeredUser.githubUsername,
            repoFullName,
            prNumber: pr.number,
            prUrl: pr.html_url,
            prTitle: pr.title,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : now,
            isFirstPr,
          }
        );
      } else {
        contributionId = existingContribs[0].id;
      }
    }
  }

  return {
    handled: true,
    prId: prRecordId,
    linkedIssueId: matchedIssueId,
    associationStatus,
    associationSource,
    contributionId,
    progression: progressionResult,
  };
}

/**
 * Handles pull_request_review webhook events:
 * Ingests reviews submitted by reviewers and updates PR state.
 */
export async function handlePullRequestReviewWebhook(
  payload: WebhookPullRequestReviewEvent,
  database?: any
) {
  const db = database || (await getDb());
  const review = payload.review;
  const pr = payload.pull_request;
  const now = new Date();

  // Find PR in our database
  const matchingPrs = await db
    .select()
    .from(schema.pullRequests)
    .where(eq(schema.pullRequests.url, pr.html_url))
    .limit(1);

  if (matchingPrs.length === 0) {
    return {
      handled: false,
      reason: "Pull request not tracked in platform database.",
    };
  }

  const prRecord = matchingPrs[0];

  // Map review state
  const state = review.state.toLowerCase();
  let reviewState: "approved" | "changes_requested" | "commented" | "dismissed" = "commented";

  if (state === "approved") {
    reviewState = "approved";
  } else if (state === "changes_requested") {
    reviewState = "changes_requested";
  } else if (state === "dismissed") {
    reviewState = "dismissed";
  }

  // Insert review record
  const reviewId = `prrev_${crypto.randomUUID()}`;
  await db.insert(schema.pullRequestReviews).values({
    id: reviewId,
    pullRequestId: prRecord.id,
    reviewerGithubId: review.user.id,
    reviewerUsername: review.user.login,
    reviewState,
    submittedAt: review.submitted_at ? new Date(review.submitted_at) : now,
    githubReviewId: review.id,
    htmlUrl: review.html_url,
    createdAt: now,
  });

  // Update PR overall state if open and non-draft
  if (prRecord.state !== "merged" && prRecord.state !== "closed") {
    if (reviewState === "approved") {
      await db
        .update(schema.pullRequests)
        .set({ state: "approved", updatedAt: now })
        .where(eq(schema.pullRequests.id, prRecord.id));
    } else if (reviewState === "changes_requested") {
      await db
        .update(schema.pullRequests)
        .set({ state: "changes_requested", updatedAt: now })
        .where(eq(schema.pullRequests.id, prRecord.id));
    }
  }

  return {
    handled: true,
    reviewId,
    pullRequestId: prRecord.id,
    reviewState,
  };
}
