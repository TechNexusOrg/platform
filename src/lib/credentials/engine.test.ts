import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import {
  generateCredentialId,
  buildCredentialMetadata,
  formatVerificationUrl,
  issueVerifiableCredential,
  type CredentialEvidence,
} from "./engine";
import { verifyCredentialSignature } from "./crypto";

describe("Verifiable Credential Engine", () => {
  let db: any;
  const testUserId = `usr_cred_test_${Date.now()}`;

  beforeAll(async () => {
    db = await getDb();
    await runMigrations();

    await db.insert(schema.users).values({
      id: testUserId,
      githubId: Math.floor(Math.random() * 1000000),
      githubUsername: "cred_student",
      email: "cred@technexus.org",
      role: "contributor",
    });
  });

  const dummyEvidence: CredentialEvidence = {
    githubUsername: "octocat",
    repository: "TechNexusOrg/platform",
    prNumber: 42,
    prUrl: "https://github.com/TechNexusOrg/platform/pull/42",
    prTitle: "fix: configure strict environment validation",
    mergedAt: "2026-09-25T12:00:00Z",
    verifiedAt: "2026-09-25T12:05:00Z",
  };

  it("generates deterministic canonical IDs with prefix", () => {
    const credId = generateCredentialId("first_pr_merged", "usr_123", "fixed_salt");
    expect(credId).toMatch(/^cred_tn_first-pr-merged_[a-f0-9]{12}$/);
  });

  it("builds correct metadata for First PR and new milestone credentials", () => {
    const prMeta = buildCredentialMetadata("first_pr_merged", dummyEvidence);
    expect(prMeta.title).toContain("First PR Merged");
    expect(prMeta.description).toContain("#42");

    const trackMeta = buildCredentialMetadata("learning_track_completion", {
      githubUsername: "octocat",
      trackSlug: "linux-fundamentals",
      trackTitle: "Linux Fundamentals and Administration",
      verifiedAt: "2026-10-30T00:00:00Z",
    });
    expect(trackMeta.title).toContain("Linux Fundamentals");
    expect(trackMeta.description).toContain("curriculum modules");

    const fellowshipMeta = buildCredentialMetadata("internship_completion", {
      githubUsername: "octocat",
      programSlug: "platform-engineering",
      programTitle: "Platform Engineering Fellowship",
      mentorUsername: "lead_mentor",
      verifiedAt: "2026-10-30T00:00:00Z",
    });
    expect(fellowshipMeta.title).toContain("Fellowship Graduate");
    expect(fellowshipMeta.description).toContain("supervised engineering fellowship");
  });

  it("formats canonical verification URL", () => {
    const credId = "cred_tn_first-pr-merged_abc123456789";
    const url = formatVerificationUrl(credId);
    expect(url).toContain(`/verify/${credId}`);
  });

  it("issues an Ed25519 cryptographically signed credential and validates signature", async () => {
    const credential = await issueVerifiableCredential(
      {
        userId: testUserId,
        type: "learning_track_completion",
        evidence: {
          githubUsername: "cred_student",
          trackSlug: "git-open-source",
          trackTitle: "Git and Professional Open-Source Development",
          verifiedAt: new Date().toISOString(),
        },
      },
      db
    );

    expect(credential).toBeDefined();
    expect(credential.id).toMatch(/^cred_tn_learning-track-completion_/);
    expect(credential.signature).toBeDefined();
    expect(credential.signingKeyId).toContain("tn-ed25519");
    expect(credential.canonicalHash).toBeDefined();

    // Verify signature using crypto verification
    const claims = {
      issuer: credential.issuer,
      credentialId: credential.id,
      recipientId: credential.userId,
      recipientGithub: (credential.evidenceData as any).githubUsername,
      type: credential.type,
      title: credential.title,
      issuedAt: new Date(credential.issuedAt).toISOString(),
      verificationUrl: credential.verificationUrl,
      evidence: credential.evidenceData,
    };

    const isValid = verifyCredentialSignature(
      claims,
      credential.signature!,
      credential.signingKeyId!
    );
    expect(isValid).toBe(true);
  });
});
