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
 * Initializes the atomic founding allocation counter from current max memberNumber if needed.
 */
async function ensureFoundingCounter(db: any) {
  try {
    await db.execute(sql`
      INSERT INTO founding_allocation_counter (id, current_number)
      VALUES ('founding_1000', (SELECT COALESCE(MAX(member_number), 0) FROM founding_members))
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch {
    // table or row already prepared
  }
}

/**
 * Claims a founding membership slot sequentially (1 to 1000) using atomic sequence allocation.
 * Rule: Registration alone NEVER awards a founding member slot.
 * Only verified completion of a first legitimate merged pull request can claim it.
 * Atomic: Membership slot allocation and credential issuance occur in one transaction.
 */
export async function claimFoundingMembership(
  db: any,
  params: ClaimFoundingParams
): Promise<ClaimFoundingResult> {
  await ensureFoundingCounter(db);

  // 1. Quick pre-check if user is already a founding member
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

  // 2. Perform atomic slot reservation inside a transaction
  return await db.transaction(async (tx: any) => {
    // Double check user inside transaction
    const insideExisting = await tx
      .select()
      .from(schema.foundingMembers)
      .where(eq(schema.foundingMembers.userId, params.userId))
      .limit(1);

    if (insideExisting.length > 0) {
      return {
        claimed: true,
        memberNumber: insideExisting[0].memberNumber,
        reason: "already_claimed",
      };
    }

    // Atomic increment with hard cap at 1000
    const counterRes: any = await tx.execute(sql`
      UPDATE founding_allocation_counter
      SET current_number = current_number + 1
      WHERE id = 'founding_1000' AND current_number < 1000
      RETURNING current_number;
    `);

    const rows = counterRes.rows || counterRes;
    if (!rows || rows.length === 0) {
      return {
        claimed: false,
        reason: "cohort_full",
      };
    }

    const nextNumber = Number(rows[0].current_number);
    const foundingId = `founding_${crypto.randomUUID()}`;
    const now = new Date();

    // Insert founding member
    await tx.insert(schema.foundingMembers).values({
      id: foundingId,
      userId: params.userId,
      memberNumber: nextNumber,
      status: "active",
      firstPrId: params.contributionId,
      verifiedAt: now,
      createdAt: now,
    });

    // Mirror foundingNumber to users table
    await tx
      .update(schema.users)
      .set({
        foundingNumber: nextNumber,
        updatedAt: now,
      })
      .where(eq(schema.users.id, params.userId));

    // Mint Founding 1,000 Verifiable Credential in same transaction
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

    await tx.insert(schema.credentials).values({
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
      createdAt: now,
    });

    return {
      claimed: true,
      memberNumber: nextNumber,
      credentialId: credId,
    };
  });
}
