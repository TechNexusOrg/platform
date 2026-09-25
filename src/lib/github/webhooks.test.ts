import { describe, it, expect, beforeAll } from "vitest";
import {
  verifyWebhookSignature,
  extractIssueNumbersFromPrBody,
  extractClosingKeywordIssueNumbers,
  handlePullRequestWebhook,
  handlePullRequestReviewWebhook,
  recordWebhookDelivery,
  isWebhookDeliveryProcessed,
  markWebhookDeliveryProcessed,
  markWebhookDeliveryIgnored,
  markWebhookDeliveryError,
  type WebhookPullRequestEvent,
  type WebhookPullRequestReviewEvent,
} from "./webhooks";
import crypto from "crypto";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { eq } from "drizzle-orm";

describe("GitHub Webhooks & PR Lifecycle Engine", () => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "dev_webhook_secret_key";
  const userId = "usr_wh_test_contributor";
  const projectId = "proj_wh_test_repo";
  const unapprovedProjectId = "proj_wh_test_unapproved";
  const issueId = "iss_wh_test_issue";
  const claimId = "claim_wh_test_claim";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
    const db = await getDb();

    // 1. Seed user
    await db.insert(schema.users).values({
      id: userId,
      githubId: 998877,
      githubUsername: "contributor_cathy",
      displayName: "Cathy Contributor",
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
    });

    // 2. Seed approved official project
    await db.insert(schema.projects).values({
      id: projectId,
      name: "awesome-sdk",
      slug: "awesome-sdk",
      githubRepo: "TechNexusOrg/awesome-sdk",
      description: "Official test repository for webhook lifecycle",
      primaryLanguage: "TypeScript",
      isOfficial: true,
      contributionEnabled: true,
      firstPrEnabled: true,
      approvedAt: new Date(),
    });

    // Seed unapproved project
    await db.insert(schema.projects).values({
      id: unapprovedProjectId,
      name: "unapproved-sandbox",
      slug: "unapproved-sandbox",
      githubRepo: "TechNexusOrg/unapproved-sandbox",
      description: "Unapproved repository sandbox",
      primaryLanguage: "TypeScript",
      isOfficial: false,
      contributionEnabled: false,
      firstPrEnabled: false,
      approvedAt: null,
    });

    // 3. Seed issue in approved project
    await db.insert(schema.issues).values({
      id: issueId,
      projectId,
      githubIssueId: 7771,
      githubIssueNumber: 42,
      title: "Add rate limiting retry strategy",
      state: "open",
      htmlUrl: "https://github.com/TechNexusOrg/awesome-sdk/issues/42",
      difficulty: "beginner",
    });

    // 4. Seed active issue claim by user
    await db.insert(schema.issueClaims).values({
      id: claimId,
      issueId,
      userId,
      status: "active",
      claimedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  });

  describe("HMAC SHA256 Signature Verification", () => {
    const payload = JSON.stringify({ action: "closed", pull_request: { merged: true } });

    it("verifies valid HMAC SHA256 signature", () => {
      const signature = `sha256=${crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex")}`;

      const isValid = verifyWebhookSignature(payload, signature);
      expect(isValid).toBe(true);
    });

    it("rejects forged or modified payload", () => {
      const signature = `sha256=${crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex")}`;

      const modifiedPayload = JSON.stringify({ action: "closed", pull_request: { merged: false } });
      const isValid = verifyWebhookSignature(modifiedPayload, signature);
      expect(isValid).toBe(false);
    });

    it("rejects missing or malformed signature header", () => {
      expect(verifyWebhookSignature(payload, null)).toBe(false);
      expect(verifyWebhookSignature(payload, "invalid_sig")).toBe(false);
    });
  });

  describe("Issue Number Extraction from PR Body", () => {
    it("extracts issue numbers from standard closing keywords", () => {
      const body1 = "This PR implements exponential backoff. Fixes #42 cleanly.";
      expect(extractClosingKeywordIssueNumbers(body1)).toEqual([42]);

      const body2 = "Closes #15 and also resolves #89";
      expect(extractClosingKeywordIssueNumbers(body2)).toEqual([15, 89]);

      const body3 = "Resolves https://github.com/TechNexusOrg/platform/issues/99";
      expect(extractClosingKeywordIssueNumbers(body3)).toEqual([99]);
    });

    it("returns empty array for text without issue references", () => {
      expect(extractIssueNumbersFromPrBody("Just refactoring variable names")).toEqual([]);
      expect(extractIssueNumbersFromPrBody(null)).toEqual([]);
      expect(extractIssueNumbersFromPrBody(undefined)).toEqual([]);
    });
  });

  describe("Pull Request Lifecycle & Issue Claim Auto-Completion", () => {
    const prUrl = "https://github.com/TechNexusOrg/awesome-sdk/pull/105";

    it("ingests opened PR, links to referenced issue and registered user", async () => {
      const db = await getDb();
      const openEvent: WebhookPullRequestEvent = {
        action: "opened",
        pull_request: {
          id: 55001,
          number: 105,
          title: "feat: add rate limiting retry",
          body: "Implemented retry loop with jitter. Fixes #42",
          html_url: prUrl,
          state: "open",
          draft: false,
          merged: false,
          merged_at: null,
          user: {
            id: 998877,
            login: "contributor_cathy",
            avatar_url: "https://avatars.githubusercontent.com/u/998877",
          },
          base: {
            repo: {
              id: 33001,
              name: "awesome-sdk",
              full_name: "TechNexusOrg/awesome-sdk",
              html_url: "https://github.com/TechNexusOrg/awesome-sdk",
            },
          },
        },
        repository: {
          id: 33001,
          name: "awesome-sdk",
          full_name: "TechNexusOrg/awesome-sdk",
          owner: {
            login: "TechNexusOrg",
          },
        },
        sender: {
          id: 998877,
          login: "contributor_cathy",
        },
      };

      const result = await handlePullRequestWebhook(openEvent, db);
      expect(result.handled).toBe(true);
      expect(result.linkedIssueId).toBe(issueId);
      expect(result.associationStatus).toBe("claimed");

      // Verify PR stored in pull_requests table with claimId
      const [storedPr] = await db
        .select()
        .from(schema.pullRequests)
        .where(eq(schema.pullRequests.url, prUrl))
        .limit(1);

      expect(storedPr).toBeDefined();
      expect(storedPr.userId).toBe(userId);
      expect(storedPr.state).toBe("open");
      expect(storedPr.claimId).toBe(claimId);
    });

    it("ingests merged PR, completes active claim, closes issue, and awards contribution", async () => {
      const db = await getDb();
      const mergeEvent: WebhookPullRequestEvent = {
        action: "closed",
        pull_request: {
          id: 55001,
          number: 105,
          title: "feat: add rate limiting retry",
          body: "Implemented retry loop with jitter. Fixes #42",
          html_url: prUrl,
          state: "closed",
          draft: false,
          merged: true,
          merged_at: new Date().toISOString(),
          merge_commit_sha: "c0ffee1234567890abcdef",
          user: {
            id: 998877,
            login: "contributor_cathy",
            avatar_url: "https://avatars.githubusercontent.com/u/998877",
          },
          base: {
            repo: {
              id: 33001,
              name: "awesome-sdk",
              full_name: "TechNexusOrg/awesome-sdk",
              html_url: "https://github.com/TechNexusOrg/awesome-sdk",
            },
          },
        },
        repository: {
          id: 33001,
          name: "awesome-sdk",
          full_name: "TechNexusOrg/awesome-sdk",
          owner: {
            login: "TechNexusOrg",
          },
        },
        sender: {
          id: 998877,
          login: "contributor_cathy",
        },
      };

      const result = await handlePullRequestWebhook(mergeEvent, db);
      expect(result.handled).toBe(true);
      expect(result.contributionId).toBeDefined();

      // Check active claim status transitioned to completed
      const [updatedClaim] = await db
        .select()
        .from(schema.issueClaims)
        .where(eq(schema.issueClaims.id, claimId))
        .limit(1);

      expect(updatedClaim.status).toBe("completed");

      // Check issue marked closed
      const [updatedIssue] = await db
        .select()
        .from(schema.issues)
        .where(eq(schema.issues.id, issueId))
        .limit(1);

      expect(updatedIssue.state).toBe("closed");

      // Check verified contribution created
      const [contribution] = await db
        .select()
        .from(schema.contributions)
        .where(eq(schema.contributions.prUrl, prUrl))
        .limit(1);

      expect(contribution).toBeDefined();
      expect(contribution.state).toBe("merged");
      expect(contribution.isFirstPr).toBe(true);
      expect(contribution.verifiedAt).not.toBeNull();
    });
  });

  describe("Pull Request Code Reviews", () => {
    const prUrl = "https://github.com/TechNexusOrg/awesome-sdk/pull/105";

    it("ingests approved review and updates PR state", async () => {
      const db = await getDb();
      const reviewEvent: WebhookPullRequestReviewEvent = {
        action: "submitted",
        review: {
          id: 881122,
          state: "approved",
          html_url: `${prUrl}#pullrequestreview-881122`,
          submitted_at: new Date().toISOString(),
          user: {
            id: 112233,
            login: "maintainer_dan",
            avatar_url: "https://avatars.githubusercontent.com/u/112233",
          },
        },
        pull_request: {
          id: 55001,
          number: 105,
          title: "feat: add rate limiting retry",
          html_url: prUrl,
          state: "open",
        },
        repository: {
          id: 33001,
          name: "awesome-sdk",
          full_name: "TechNexusOrg/awesome-sdk",
        },
        sender: {
          id: 112233,
          login: "maintainer_dan",
        },
      };

      const result = await handlePullRequestReviewWebhook(reviewEvent, db);
      expect(result.handled).toBe(true);
      expect(result.reviewState).toBe("approved");

      // Verify review recorded in pull_request_reviews table
      const [storedReview] = await db
        .select()
        .from(schema.pullRequestReviews)
        .where(eq(schema.pullRequestReviews.githubReviewId, 881122))
        .limit(1);

      expect(storedReview).toBeDefined();
      expect(storedReview.reviewerUsername).toBe("maintainer_dan");
      expect(storedReview.reviewState).toBe("approved");
    });
  });

  describe("Webhook Delivery Idempotency State Machine", () => {
    const testDeliveryId = "delivery_test_state_machine_01";
    const retryDeliveryId = "delivery_test_retry_02";

    it("transitions received -> processing -> processed, ignoring duplicate deliveries", async () => {
      const db = await getDb();

      // Check initial state
      expect(await isWebhookDeliveryProcessed(testDeliveryId, db)).toBe(false);

      // First delivery: shouldProcess is true
      const first = await recordWebhookDelivery(
        {
          deliveryId: testDeliveryId,
          eventType: "pull_request",
          repository: "TechNexusOrg/awesome-sdk",
        },
        db
      );
      expect(first.shouldProcess).toBe(true);
      expect(first.status).toBe("processing");

      // Mark processed
      await markWebhookDeliveryProcessed(testDeliveryId, db);
      expect(await isWebhookDeliveryProcessed(testDeliveryId, db)).toBe(true);

      // Duplicate delivery attempt: shouldProcess is false
      const duplicate = await recordWebhookDelivery(
        {
          deliveryId: testDeliveryId,
          eventType: "pull_request",
          repository: "TechNexusOrg/awesome-sdk",
        },
        db
      );
      expect(duplicate.shouldProcess).toBe(false);
      expect(duplicate.status).toBe("processed");
    });

    it("supports retry on failed delivery", async () => {
      const db = await getDb();

      // Initial delivery fails
      await recordWebhookDelivery(
        {
          deliveryId: retryDeliveryId,
          eventType: "pull_request",
          repository: "TechNexusOrg/awesome-sdk",
        },
        db
      );
      await markWebhookDeliveryError(retryDeliveryId, "Database timeout error", db);

      // Verify error state
      const [failedRecord] = await db
        .select()
        .from(schema.githubWebhookDeliveries)
        .where(eq(schema.githubWebhookDeliveries.deliveryId, retryDeliveryId));
      expect(failedRecord.status).toBe("error");
      expect(failedRecord.error).toBe("Database timeout error");

      // Retry delivery: shouldProcess is true, isRetry is true
      const retry = await recordWebhookDelivery(
        {
          deliveryId: retryDeliveryId,
          eventType: "pull_request",
          repository: "TechNexusOrg/awesome-sdk",
        },
        db
      );
      expect(retry.shouldProcess).toBe(true);
      expect(retry.isRetry).toBe(true);
      expect(retry.status).toBe("processing");
    });

    it("marks unsupported events as ignored", async () => {
      const db = await getDb();
      const ignoredDeliveryId = "delivery_unsupported_03";

      await recordWebhookDelivery(
        {
          deliveryId: ignoredDeliveryId,
          eventType: "star",
          repository: "TechNexusOrg/awesome-sdk",
        },
        db
      );

      await markWebhookDeliveryIgnored(ignoredDeliveryId, "Unsupported event: star", db);

      const [record] = await db
        .select()
        .from(schema.githubWebhookDeliveries)
        .where(eq(schema.githubWebhookDeliveries.deliveryId, ignoredDeliveryId));

      expect(record.status).toBe("ignored");
      expect(record.error).toBe("Unsupported event: star");
    });

    it("handles concurrent duplicate deliveries safely", async () => {
      const db = await getDb();
      const concurrentDeliveryId = `delivery_concurrent_${Date.now()}`;

      const [res1, res2] = await Promise.all([
        recordWebhookDelivery(
          {
            deliveryId: concurrentDeliveryId,
            eventType: "pull_request",
            repository: "TechNexusOrg/awesome-sdk",
          },
          db
        ),
        recordWebhookDelivery(
          {
            deliveryId: concurrentDeliveryId,
            eventType: "pull_request",
            repository: "TechNexusOrg/awesome-sdk",
          },
          db
        ),
      ]);

      // Exactly one should process, the other should be rejected
      const shouldProcessCount = [res1.shouldProcess, res2.shouldProcess].filter(Boolean).length;
      expect(shouldProcessCount).toBe(1);
    });
  });

  describe("Repository Trust Boundary & Approval", () => {
    it("rejects PR events originating from unauthorized third-party repositories", async () => {
      const db = await getDb();
      const maliciousEvent: WebhookPullRequestEvent = {
        action: "opened",
        pull_request: {
          id: 99999,
          number: 1,
          title: "Malicious external PR",
          body: "Trying to claim contribution outside org",
          html_url: "https://github.com/RandomSpammer/fake-repo/pull/1",
          state: "open",
          draft: false,
          merged: false,
          merged_at: null,
          user: {
            id: 998877,
            login: "contributor_cathy",
            avatar_url: "https://avatars.githubusercontent.com/u/998877",
          },
          base: {
            repo: {
              id: 88888,
              name: "fake-repo",
              full_name: "RandomSpammer/fake-repo",
              html_url: "https://github.com/RandomSpammer/fake-repo",
            },
          },
        },
        repository: {
          id: 88888,
          name: "fake-repo",
          full_name: "RandomSpammer/fake-repo",
          owner: {
            login: "RandomSpammer",
          },
        },
        sender: {
          id: 998877,
          login: "contributor_cathy",
        },
      };

      const result = await handlePullRequestWebhook(maliciousEvent, db);
      expect(result.handled).toBe(false);
      expect(result.reason).toMatch(/outside official organization trust boundary/i);
    });

    it("rejects contribution processing on unapproved TechNexusOrg repositories", async () => {
      const db = await getDb();
      const unapprovedEvent: WebhookPullRequestEvent = {
        action: "closed",
        pull_request: {
          id: 77001,
          number: 2,
          title: "PR in unapproved repository",
          body: "Merged PR in unapproved repo",
          html_url: "https://github.com/TechNexusOrg/unapproved-sandbox/pull/2",
          state: "closed",
          draft: false,
          merged: true,
          merged_at: new Date().toISOString(),
          user: {
            id: 998877,
            login: "contributor_cathy",
            avatar_url: "https://avatars.githubusercontent.com/u/998877",
          },
          base: {
            repo: {
              id: 44001,
              name: "unapproved-sandbox",
              full_name: "TechNexusOrg/unapproved-sandbox",
              html_url: "https://github.com/TechNexusOrg/unapproved-sandbox",
            },
          },
        },
        repository: {
          id: 44001,
          name: "unapproved-sandbox",
          full_name: "TechNexusOrg/unapproved-sandbox",
          owner: {
            login: "TechNexusOrg",
          },
        },
        sender: {
          id: 998877,
          login: "contributor_cathy",
        },
      };

      const result = await handlePullRequestWebhook(unapprovedEvent, db);
      expect(result.handled).toBe(false);
      expect(result.reason).toMatch(/unapproved or contributions are disabled/i);
      expect(result.contributionId).toBeUndefined();
    });
  });
});
