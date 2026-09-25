import { schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import {
  generateCredentialId,
  buildCredentialMetadata,
  formatVerificationUrl,
  type CredentialEvidence,
} from "@/lib/credentials/engine";

export interface ClaimFoundingParams {
  userId: string;
  contributionId: string;
  githubUsername: string;
  repo: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  mergedAt: Date;
}

export interface ClaimFoundingResult {
  claimed: boolean;
  memberNumber?: number;
  credentialId?: string;
  reason?: string;
}

/**
 * Claims a founding membership slot sequentially (1 to 1000).
 * Rule: Registration alone NEVER awards a founding member slot.
 * Only verified completion of a first legitimate merged pull request can claim it.
 */
export async function claimFoundingMembership(
  db: any,
  params: ClaimFoundingParams
): Promise<ClaimFoundingResult> {
  // 1. Check if user is already a founding member
  const existing = await db
    .select()
    .from(schema.foundingMembers)
    .where(eq(schema.foundingMembers.userId, params.userId))
    .limit(1);

  if (existing.length > 0) {
    return {
      claimed: true,
      memberNumber: existing[0].memberNumber,
      reason: "already_claimed",
    };
  }

  // 2. Determine the next sequential member number atomically with retry loop
  const foundingId = `founding_${crypto.randomUUID()}`;
  const now = new Date();
  let nextNumber = 0;
  let attempts = 0;

  while (attempts < 5) {
    attempts++;
    const maxResult = await db
      .select({
        maxNumber: sql<number>`COALESCE(MAX(${schema.foundingMembers.memberNumber}), 0)`,
      })
      .from(schema.foundingMembers);

    nextNumber = Number(maxResult[0]?.maxNumber || 0) + 1;

    if (nextNumber > 1000) {
      return {
        claimed: false,
        reason: "cohort_full",
      };
    }

    try {
      await db.insert(schema.foundingMembers).values({
        id: foundingId,
        userId: params.userId,
        memberNumber: nextNumber,
        status: "active",
        firstPrId: params.contributionId,
        verifiedAt: now,
        createdAt: now,
      });
      break; // Successfully reserved sequential number
    } catch (err: any) {
      // If concurrent collision on unique memberNumber, re-attempt
      if (err.message?.includes("member_number") || err.code === "23505") {
        continue;
      }
      // If user was claimed in parallel
      if (err.message?.includes("user_id") || err.message?.includes("already exists")) {
        const parallel = await db
          .select()
          .from(schema.foundingMembers)
          .where(eq(schema.foundingMembers.userId, params.userId))
          .limit(1);
        if (parallel.length > 0) {
          return {
            claimed: true,
            memberNumber: parallel[0].memberNumber,
            reason: "already_claimed",
          };
        }
      }
      throw err;
    }
  }

  // 4. Mirror foundingNumber to users table
  await db
    .update(schema.users)
    .set({
      foundingNumber: nextNumber,
      updatedAt: now,
    })
    .where(eq(schema.users.id, params.userId));

  // 5. Mint Founding 1,000 Verifiable Credential
  const credId = generateCredentialId("founding_1000", params.userId);
  const evidence: CredentialEvidence = {
    githubUsername: params.githubUsername,
    repository: params.repo,
    prNumber: params.prNumber,
    prUrl: params.prUrl,
    prTitle: params.prTitle,
    mergedAt: params.mergedAt.toISOString(),
    verifiedAt: now.toISOString(),
    additionalNotes: `Permanent Founding Member #${String(nextNumber).padStart(4, "0")} of 1,000`,
  };

  const meta = buildCredentialMetadata("founding_1000", evidence);

  await db.insert(schema.credentials).values({
    id: credId,
    userId: params.userId,
    type: "founding_1000",
    title: meta.title,
    description: meta.description,
    status: "active",
    issuer: "TechNexusOrg",
    issuedAt: now,
    evidenceData: evidence,
    verificationUrl: formatVerificationUrl(credId),
  });

  // 6. Record audit log
  await db.insert(schema.auditLogs).values({
    id: `audit_${crypto.randomUUID()}`,
    actorId: params.userId,
    action: "founding_member.claimed",
    targetType: "founding_member",
    targetId: foundingId,
    metadata: {
      userId: params.userId,
      memberNumber: nextNumber,
      contributionId: params.contributionId,
      credentialId: credId,
    },
  });

  return {
    claimed: true,
    memberNumber: nextNumber,
    credentialId: credId,
  };
}
