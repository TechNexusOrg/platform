import { schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  generateCredentialId,
  buildCredentialMetadata,
  formatVerificationUrl,
  type CredentialEvidence,
} from "@/lib/credentials/engine";
import { evaluateProgression, type ContributorLevel } from "@/lib/progression/rules";
import { claimFoundingMembership } from "@/lib/founding";
import { getContributorMetrics } from "@/lib/metrics";

export interface ProcessContributionParams {
  userId: string;
  contributionId: string;
  githubUsername: string;
  repoFullName: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  mergedAt: Date;
  isFirstPr: boolean;
}

export interface ProcessProgressionResult {
  promoted: boolean;
  previousLevel: ContributorLevel;
  newLevel: ContributorLevel;
  credentialsIssued: string[];
  foundingMemberNumber?: number;
}

/**
 * Automates contributor level evaluation, credential minting, and founding cohort enrollment
 * following verified pull request merge events.
 */
export async function processProgressionOnContribution(
  db: any,
  params: ProcessContributionParams
): Promise<ProcessProgressionResult> {
  const credentialsIssued: string[] = [];
  let foundingMemberNumber: number | undefined;

  // 1. Fetch user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, params.userId))
    .limit(1);

  if (!user) {
    throw new Error(`User not found: ${params.userId}`);
  }

  const previousLevel = user.level as ContributorLevel;

  // 2. First PR Credential & Founding 1,000 claim
  if (params.isFirstPr) {
    // Check if first_pr_merged credential already exists
    const existingFirstPrCred = await db
      .select()
      .from(schema.credentials)
      .where(
        and(
          eq(schema.credentials.userId, params.userId),
          eq(schema.credentials.type, "first_pr_merged")
        )
      )
      .limit(1);

    if (existingFirstPrCred.length === 0) {
      const credId = generateCredentialId("first_pr_merged", params.userId);
      const evidence: CredentialEvidence = {
        githubUsername: params.githubUsername,
        repository: params.repoFullName,
        prNumber: params.prNumber,
        prUrl: params.prUrl,
        prTitle: params.prTitle,
        mergedAt: params.mergedAt.toISOString(),
        verifiedAt: new Date().toISOString(),
      };
      const meta = buildCredentialMetadata("first_pr_merged", evidence);

      await db.insert(schema.credentials).values({
        id: credId,
        userId: params.userId,
        type: "first_pr_merged",
        title: meta.title,
        description: meta.description,
        status: "active",
        issuer: "TechNexusOrg",
        issuedAt: new Date(),
        evidenceData: evidence,
        verificationUrl: formatVerificationUrl(credId),
      });

      credentialsIssued.push(credId);

      await db.insert(schema.auditLogs).values({
        id: `audit_${crypto.randomUUID()}`,
        actorId: params.userId,
        action: "credential.issued",
        targetType: "credential",
        targetId: credId,
        metadata: {
          type: "first_pr_merged",
          prNumber: params.prNumber,
          repository: params.repoFullName,
        },
      });
    }

    // Claim Founding 1,000 membership
    const foundingResult = await claimFoundingMembership(db, {
      userId: params.userId,
      contributionId: params.contributionId,
      githubUsername: params.githubUsername,
      repo: params.repoFullName,
      prNumber: params.prNumber,
      prUrl: params.prUrl,
      prTitle: params.prTitle,
      mergedAt: params.mergedAt,
    });

    if (foundingResult.claimed && foundingResult.memberNumber) {
      foundingMemberNumber = foundingResult.memberNumber;
      if (foundingResult.credentialId) {
        credentialsIssued.push(foundingResult.credentialId);
      }
    }
  }

  // 3. Gather authoritative live user metrics to evaluate promotion
  const metrics = await getContributorMetrics(params.userId, db);
  const progression = evaluateProgression(previousLevel, metrics);

  let newLevel = previousLevel;

  // 4. Perform promotion if criteria met
  if (progression.canPromote) {
    newLevel = progression.eligibleLevel;

    await db
      .update(schema.users)
      .set({
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, params.userId));

    // Log promotion audit entry
    await db.insert(schema.auditLogs).values({
      id: `audit_${crypto.randomUUID()}`,
      actorId: params.userId,
      action: "user.promoted",
      targetType: "user",
      targetId: params.userId,
      metadata: {
        previousLevel,
        newLevel,
        totalPrsMerged: metrics.prsMerged,
        projectsCount: metrics.projectsContributedCount,
        reason: "Met objective criteria for contributor advancement",
      },
    });

    // 5. Issue milestone credentials associated with new level
    if (newLevel === "active_contributor") {
      const existingVerifiedCred = await db
        .select()
        .from(schema.credentials)
        .where(
          and(
            eq(schema.credentials.userId, params.userId),
            eq(schema.credentials.type, "verified_contributor")
          )
        )
        .limit(1);

      if (existingVerifiedCred.length === 0) {
        const credId = generateCredentialId("verified_contributor", params.userId);
        const evidence: CredentialEvidence = {
          githubUsername: params.githubUsername,
          repository: params.repoFullName,
          prNumber: params.prNumber,
          prUrl: params.prUrl,
          prTitle: params.prTitle,
          mergedAt: params.mergedAt.toISOString(),
          verifiedAt: new Date().toISOString(),
          additionalNotes: `Promoted to Active Contributor with ${metrics.prsMerged} merged pull requests`,
        };
        const meta = buildCredentialMetadata("verified_contributor", evidence);

        await db.insert(schema.credentials).values({
          id: credId,
          userId: params.userId,
          type: "verified_contributor",
          title: meta.title,
          description: meta.description,
          status: "active",
          issuer: "TechNexusOrg",
          issuedAt: new Date(),
          evidenceData: evidence,
          verificationUrl: formatVerificationUrl(credId),
        });

        credentialsIssued.push(credId);

        await db.insert(schema.auditLogs).values({
          id: `audit_${crypto.randomUUID()}`,
          actorId: params.userId,
          action: "credential.issued",
          targetType: "credential",
          targetId: credId,
          metadata: {
            type: "verified_contributor",
            level: newLevel,
          },
        });
      }
    } else if (newLevel === "core_contributor") {
      const existingCoreCred = await db
        .select()
        .from(schema.credentials)
        .where(
          and(
            eq(schema.credentials.userId, params.userId),
            eq(schema.credentials.type, "core_contributor")
          )
        )
        .limit(1);

      if (existingCoreCred.length === 0) {
        const credId = generateCredentialId("core_contributor", params.userId);
        const evidence: CredentialEvidence = {
          githubUsername: params.githubUsername,
          repository: params.repoFullName,
          prNumber: params.prNumber,
          prUrl: params.prUrl,
          prTitle: params.prTitle,
          mergedAt: params.mergedAt.toISOString(),
          verifiedAt: new Date().toISOString(),
          additionalNotes: `Elevated to Core Contributor with verified sustained contributions`,
        };
        const meta = buildCredentialMetadata("core_contributor", evidence);

        await db.insert(schema.credentials).values({
          id: credId,
          userId: params.userId,
          type: "core_contributor",
          title: meta.title,
          description: meta.description,
          status: "active",
          issuer: "TechNexusOrg",
          issuedAt: new Date(),
          evidenceData: evidence,
          verificationUrl: formatVerificationUrl(credId),
        });

        credentialsIssued.push(credId);

        await db.insert(schema.auditLogs).values({
          id: `audit_${crypto.randomUUID()}`,
          actorId: params.userId,
          action: "credential.issued",
          targetType: "credential",
          targetId: credId,
          metadata: {
            type: "core_contributor",
            level: newLevel,
          },
        });
      }
    }
  }

  return {
    promoted: progression.canPromote,
    previousLevel,
    newLevel,
    credentialsIssued,
    foundingMemberNumber,
  };
}
