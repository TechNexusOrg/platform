import crypto from "crypto";
import { env } from "@/lib/env";

export type CredentialType =
  | "first_pr_merged"
  | "verified_contributor"
  | "core_contributor"
  | "founding_1000"
  | "maintainer"
  | "mentor";

export interface CredentialEvidence {
  githubUsername: string;
  repository: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  mergeCommitSha?: string;
  mergedAt: string;
  verifiedAt: string;
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
  revokedReason?: string | null;
}

export function generateCredentialId(type: CredentialType, userId: string, salt = ""): string {
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
  }
}

export function formatVerificationUrl(credentialId: string): string {
  return `${env.APP_URL}/verify/${credentialId}`;
}
