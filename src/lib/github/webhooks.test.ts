import { describe, it, expect, beforeAll } from "vitest";
import {
  verifyWebhookSignature,
  extractIssueNumbersFromPrBody,
  handlePullRequestWebhook,
  handlePullRequestReviewWebhook,
  recordWebhookDelivery,
  isWebhookDeliveryProcessed,
  markWebhookDeliveryCompleted,
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
      level: "level_1",
      isOnboarded: true,
    });

    // 2. Seed project
    await db.insert(schema.projects).values({
      id: projectId,
      name: "awesome-sdk",
      slug: "awesome-sdk",
      githubRepo: "TechNexusOrg/awesome-sdk",
      description: "Official test repository for webhook lifecycle",
      primaryLanguage: "TypeScript",
      contributionEnabled: true,
    });

    // 3. Seed issue
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
      expect(extractIssueNumbersFromPrBody(body1)).toEqual([42]);

      const body2 = "Closes #15 and also resolves #89";
      expect(extractIssueNumbersFromPrBody(body2)).toEqual([15, 89]);

      const body3 = "Resolves https://github.com/TechNexusOrg/platform/issues/99";
      expect(extractIssueNumbersFromPrBody(body3)).toEqual([99]);
    });

    it("returns empty array for text without issue references", () => {
      expect(extractIssueNumbersFromPrBody("Just refactoring variable names")).toEqual([]);
      expect(extractIssueNumbersFromPrBody(null)).toEqual([]);
      expect(extractIssueNumbersFromPrBody(undefined)).toEqual([]);
    });
  });

  describe("Pull Request Lifecycle & Issue Claim Auto-Completion", () => {
    const prNumber = 105;
    const prUrl = "https://github.com/TechNexusOrg/awesome-sdk/pull/105";

    it("ingests opened PR, links to referenced issue and registered user", async () => {
      const db = await getDb();
      const openEvent: WebhookPullRequestEvent = {
        action: "opened",
        pull_request: {
          id: 55001,
          number: prNumber,
          title: "feat: add rate limiting retry",
          body: "Implements retry strategy. Fixes #42",
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

      // Verify record in pull_requests table
      const [storedPr] = await db
        .select()
        .from(schema.pullRequests)
        .where(eq(schema.pullRequests.url, prUrl))
        .limit(1);

      expect(storedPr).toBeDefined();
      expect(storedPr.userId).toBe(userId);
      expect(storedPr.issueId).toBe(issueId);
      expect(storedPr.state).toBe("open");
    });

    it("ingests merged PR, completes active claim, closes issue, and awards contribution", async () => {
      const db = await getDb();
      const mergeEvent: WebhookPullRequestEvent = {
        action: "closed",
        pull_request: {
          id: 55001,
          number: prNumber,
          title: "feat: add rate limiting retry",
          body: "Implements retry strategy. Fixes #42",
          html_url: prUrl,
          state: "closed",
          draft: false,
          merged: true,
          merged_at: new Date().toISOString(),
          merge_commit_sha: "abcd1234efgh5678",
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

      // 1. Verify PR state updated to 'merged'
      const [updatedPr] = await db
        .select()
        .from(schema.pullRequests)
        .where(eq(schema.pullRequests.url, prUrl))
        .limit(1);
      expect(updatedPr.state).toBe("merged");

      // 2. Verify issue state updated to 'closed'
      const [closedIssue] = await db
        .select()
        .from(schema.issues)
        .where(eq(schema.issues.id, issueId))
        .limit(1);
      expect(closedIssue.state).toBe("closed");

      // 3. Verify issue claim updated to 'completed'
      const [completedClaim] = await db
        .select()
        .from(schema.issueClaims)
        .where(eq(schema.issueClaims.id, claimId))
        .limit(1);
      expect(completedClaim.status).toBe("completed");

      // 4. Verify contribution recorded
      const [contrib] = await db
        .select()
        .from(schema.contributions)
        .where(eq(schema.contributions.prUrl, prUrl))
        .limit(1);
      expect(contrib).toBeDefined();
      expect(contrib.state).toBe("merged");
      expect(contrib.issueId).toBe(issueId);
    });
  });

  describe("Pull Request Code Reviews", () => {
    it("ingests approved review and updates PR state", async () => {
      const db = await getDb();
      const prUrl = "https://github.com/TechNexusOrg/awesome-sdk/pull/105";

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

  describe("Webhook Delivery Idempotency Tracking", () => {
    const testDeliveryId = "delivery_test_unique_guid_123";

    it("records delivery and marks it completed, detecting duplicates", async () => {
      const db = await getDb();

      // Check initial state
      const initialProcessed = await isWebhookDeliveryProcessed(testDeliveryId, db);
      expect(initialProcessed).toBe(false);

      // Record incoming delivery
      await recordWebhookDelivery(
        {
          deliveryId: testDeliveryId,
          eventType: "pull_request",
          repository: "TechNexusOrg/awesome-sdk",
        },
        db
      );

      // Mark completed
      await markWebhookDeliveryCompleted(testDeliveryId, db);

      // Now it should be detected as processed
      const isDone = await isWebhookDeliveryProcessed(testDeliveryId, db);
      expect(isDone).toBe(true);
    });
  });

  describe("Repository Trust Boundary", () => {
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
  });
});

