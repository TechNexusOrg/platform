import { getDb, schema } from "@/lib/db";
import { eq, and, lt } from "drizzle-orm";

export const CLAIM_EXPIRY_DAYS = 7;

export interface IssueClaimUser {
  id: string;
  githubUsername: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ActiveIssueClaim {
  id: string;
  issueId: string;
  userId: string;
  status: "active" | "completed" | "released" | "expired" | "cancelled";
  claimedAt: Date;
  expiresAt: Date;
  user: IssueClaimUser;
}

/**
 * Expires any active claims that have exceeded their 7-day lifespan.
 */
export async function expireOverdueClaims(database?: any) {
  const db = database || (await getDb());
  const now = new Date();

  await db
    .update(schema.issueClaims)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.issueClaims.status, "active"),
        lt(schema.issueClaims.expiresAt, now)
      )
    );
}

/**
 * Returns the maximum number of active issues a user can claim concurrently based on contributor level.
 * Level 1 (Observer) & Level 2 (Explorer): 1 active claim.
 * Level 3+ (Builder, Architect, Maintainer): 2 active claims.
 */
export function getMaxActiveClaimsForLevel(level?: string | null): number {
  if (level === "level_3" || level === "level_4" || level === "level_5") {
    return 2;
  }
  return 1;
}

/**
 * Claims an issue for a contributor.
 */
export async function claimIssue(
  params: {
    issueId: string;
    userId: string;
  },
  database?: any
) {
  const db = database || (await getDb());
  const now = new Date();

  // Expire overdue claims across system
  await expireOverdueClaims(db);

  // 1. Fetch user to verify level and status
  const [user] = await db
    .select({
      id: schema.users.id,
      githubUsername: schema.users.githubUsername,
      role: schema.users.role,
      level: schema.users.level,
    })
    .from(schema.users)
    .where(eq(schema.users.id, params.userId))
    .limit(1);

  if (!user) {
    throw new Error("Contributor account not found.");
  }

  // 2. Fetch issue and project
  const [issue] = await db
    .select({
      id: schema.issues.id,
      title: schema.issues.title,
      state: schema.issues.state,
      projectId: schema.issues.projectId,
      githubIssueNumber: schema.issues.githubIssueNumber,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      contributionEnabled: schema.projects.contributionEnabled,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.id, params.issueId))
    .limit(1);

  if (!issue) {
    throw new Error("Issue not found.");
  }

  if (issue.state !== "open") {
    throw new Error("This issue is closed and cannot be claimed.");
  }

  if (!issue.contributionEnabled) {
    throw new Error("Contributions are currently disabled for this repository.");
  }

  // 3. Check if issue is already claimed by someone
  const existingActiveClaims = await db
    .select({
      id: schema.issueClaims.id,
      userId: schema.issueClaims.userId,
      claimedAt: schema.issueClaims.claimedAt,
      expiresAt: schema.issueClaims.expiresAt,
      username: schema.users.githubUsername,
    })
    .from(schema.issueClaims)
    .innerJoin(schema.users, eq(schema.issueClaims.userId, schema.users.id))
    .where(
      and(
        eq(schema.issueClaims.issueId, params.issueId),
        eq(schema.issueClaims.status, "active")
      )
    )
    .limit(1);

  if (existingActiveClaims.length > 0) {
    const existing = existingActiveClaims[0];
    if (existing.userId === params.userId) {
      return {
        success: true,
        alreadyClaimedBySelf: true,
        claim: existing,
      };
    }
    throw new Error(
      `This issue is currently claimed by @${existing.username} until ${new Date(
        existing.expiresAt
      ).toLocaleDateString()}.`
    );
  }

  // 4. Check user's active claims count limit
  const userClaims = await db
    .select({ id: schema.issueClaims.id })
    .from(schema.issueClaims)
    .where(
      and(
        eq(schema.issueClaims.userId, params.userId),
        eq(schema.issueClaims.status, "active")
      )
    );

  const maxAllowed = getMaxActiveClaimsForLevel(user.level);
  if (userClaims.length >= maxAllowed) {
    throw new Error(
      `You have reached your limit of ${maxAllowed} active claim(s). Please complete or release your existing claim before claiming another issue.`
    );
  }

  // 5. Create claim
  const claimId = `claim_${crypto.randomUUID()}`;
  const expiresAt = new Date(now.getTime() + CLAIM_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const [newClaim] = await db
    .insert(schema.issueClaims)
    .values({
      id: claimId,
      issueId: params.issueId,
      userId: params.userId,
      status: "active",
      claimedAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    success: true,
    alreadyClaimedBySelf: false,
    claim: newClaim,
  };
}

/**
 * Releases an active claim on an issue.
 */
export async function releaseIssueClaim(
  params: {
    issueId: string;
    userId: string;
    isAdmin?: boolean;
  },
  database?: any
) {
  const db = database || (await getDb());
  const now = new Date();

  // Find active claim
  const [activeClaim] = await db
    .select()
    .from(schema.issueClaims)
    .where(
      and(
        eq(schema.issueClaims.issueId, params.issueId),
        eq(schema.issueClaims.status, "active")
      )
    )
    .limit(1);

  if (!activeClaim) {
    throw new Error("No active claim found for this issue.");
  }

  if (activeClaim.userId !== params.userId && !params.isAdmin) {
    throw new Error("You do not have permission to release this claim.");
  }

  const [updated] = await db
    .update(schema.issueClaims)
    .set({
      status: "released",
      releasedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.issueClaims.id, activeClaim.id))
    .returning();

  return {
    success: true,
    claim: updated,
  };
}

/**
 * Fetches the active claim for an issue, if any.
 */
export async function getActiveClaimForIssue(
  issueId: string,
  database?: any
): Promise<ActiveIssueClaim | null> {
  const db = database || (await getDb());
  await expireOverdueClaims(db);

  const claims = await db
    .select({
      id: schema.issueClaims.id,
      issueId: schema.issueClaims.issueId,
      userId: schema.issueClaims.userId,
      status: schema.issueClaims.status,
      claimedAt: schema.issueClaims.claimedAt,
      expiresAt: schema.issueClaims.expiresAt,
      user: {
        id: schema.users.id,
        githubUsername: schema.users.githubUsername,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
      },
    })
    .from(schema.issueClaims)
    .innerJoin(schema.users, eq(schema.issueClaims.userId, schema.users.id))
    .where(
      and(
        eq(schema.issueClaims.issueId, issueId),
        eq(schema.issueClaims.status, "active")
      )
    )
    .limit(1);

  if (claims.length === 0) {
    return null;
  }

  return claims[0] as ActiveIssueClaim;
}

/**
 * Fetches all active claims for a contributor.
 */
export async function getUserActiveClaims(userId: string, database?: any) {
  const db = database || (await getDb());
  await expireOverdueClaims(db);

  const claims = await db
    .select({
      id: schema.issueClaims.id,
      issueId: schema.issueClaims.issueId,
      status: schema.issueClaims.status,
      claimedAt: schema.issueClaims.claimedAt,
      expiresAt: schema.issueClaims.expiresAt,
      issueTitle: schema.issues.title,
      issueNumber: schema.issues.githubIssueNumber,
      issueHtmlUrl: schema.issues.htmlUrl,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      primaryLanguage: schema.projects.primaryLanguage,
    })
    .from(schema.issueClaims)
    .innerJoin(schema.issues, eq(schema.issueClaims.issueId, schema.issues.id))
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.issueClaims.userId, userId),
        eq(schema.issueClaims.status, "active")
      )
    );

  return claims;
}
