import crypto from "crypto";
import { env } from "@/lib/env";
import { getDb, schema } from "@/lib/db";
import { signCredentialPayload } from "./crypto";

export type CredentialType =
  | "first_pr_merged"
  | "verified_contributor"
  | "core_contributor"
  | "founding_1000"
  | "maintainer"
  | "mentor"
  | "learning_track_completion"
  | "internship_completion"
  | "cohort_completion";

export interface CredentialEvidence {
  githubUsername: string;
  repository?: string;
  prNumber?: number;
  prUrl?: string;
  prTitle?: string;
  mergeCommitSha?: string;
  mergedAt?: string;
  verifiedAt: string;
  trackSlug?: string;
  trackTitle?: string;
  programSlug?: string;
  programTitle?: string;
  cohortName?: string;
  mentorUsername?: string;
  additionalNotes?: string;
}

export interface CredentialRecord {
  id: string;
  userId: string;
  type: CredentialType;
  title: string;
  description: string;
  issuer: string;
  issuedAt: Date;
  status: "active" | "revoked";
  evidenceData: CredentialEvidence;
  verificationUrl: string;
  signature?: string | null;
  signingKeyId?: string | null;
  canonicalHash?: string | null;
  revokedReason?: string | null;
}

export function generateCredentialId(
  type: CredentialType,
  userId: string,
  salt = ""
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${type}:${userId}:${salt}:${Date.now()}`)
    .digest("hex")
    .substring(0, 12);
  return `cred_tn_${type.replace(/_/g, "-")}_${hash}`;
}

export function buildCredentialMetadata(
  type: CredentialType,
  evidence: CredentialEvidence
): { title: string; description: string } {
  switch (type) {
    case "first_pr_merged":
      return {
        title: "First PR Merged — Open Source Contributor",
        description: `Verified completion and merge of first pull request #${evidence.prNumber} in ${evidence.repository}.`,
      };
    case "verified_contributor":
      return {
        title: "Verified Contributor — TechNexusOrg",
        description: `Awarded for multiple verified, reviewed, and merged contributions across official TechNexusOrg repositories.`,
      };
    case "core_contributor":
      return {
        title: "Core Contributor — TechNexusOrg",
        description: `Demonstrated sustained leadership, code quality, and peer code reviews in open-source engineering.`,
      };
    case "founding_1000":
      return {
        title: "Founding 1,000 Contributor",
        description: `Recognized as an inaugural member of the TechNexusOrg Founding 1,000 cohort with verified public proof of work.`,
      };
    case "maintainer":
      return {
        title: "Official Repository Maintainer",
        description: `Authorized maintainer responsible for code stewardship, pull request reviews, and project releases.`,
      };
    case "mentor":
      return {
        title: "Community Engineering Mentor",
        description: `Recognized for guiding new open-source contributors through technical onboarding and pull request reviews.`,
      };
    case "learning_track_completion":
      return {
        title: `Learning Track Graduate — ${evidence.trackTitle || "Technical Track"}`,
        description: `Verified completion of all sequential curriculum modules, terminal exercises, and capstone practical assignments in the ${evidence.trackTitle || "curriculum"} track.`,
      };
    case "internship_completion":
      return {
        title: `Fellowship Graduate — ${evidence.programTitle || "Engineering Fellowship"}`,
        description: `Successfully completed a rigorous supervised engineering fellowship with verified merged code contributions, weekly work logs, and positive mentor evaluation.`,
      };
    case "cohort_completion":
      return {
        title: `Cohort Graduate — ${evidence.cohortName || "Fellowship Cohort"}`,
        description: `Completed full cohort fellowship timeline with peer code reviews, milestone deliverables, and verifiable public proof of work.`,
      };
  }
}

export function formatVerificationUrl(credentialId: string): string {
  return `${env.APP_URL}/verify/${credentialId}`;
}

/**
 * Issues an Ed25519 cryptographically signed verifiable credential.
 */
export async function issueVerifiableCredential(
  params: {
    userId: string;
    type: CredentialType;
    evidence: CredentialEvidence;
  },
  database?: any
) {
  const db = database || (await getDb());
  const credentialId = generateCredentialId(params.type, params.userId);
  const metadata = buildCredentialMetadata(params.type, params.evidence);
  const now = new Date();
  const verificationUrl = formatVerificationUrl(credentialId);

  // Prepare claims payload for cryptographic signing
  const claims = {
    issuer: "TechNexusOrg",
    credentialId,
    recipientId: params.userId,
    recipientGithub: params.evidence.githubUsername,
    type: params.type,
    title: metadata.title,
    issuedAt: now.toISOString(),
    verificationUrl,
    evidence: params.evidence,
  };

  const { signature, signingKeyId, canonicalHash } = signCredentialPayload(claims);

  const [credential] = await db
    .insert(schema.credentials)
    .values({
      id: credentialId,
      userId: params.userId,
      type: params.type,
      title: metadata.title,
      description: metadata.description,
      issuer: "TechNexusOrg",
      issuedAt: now,
      status: "active",
      evidenceData: params.evidence,
      verificationUrl,
      signature,
      signingKeyId,
      canonicalHash,
    })
    .returning();

  return credential;
}
