import { describe, it, expect } from "vitest";
import {
  generateCredentialId,
  buildCredentialMetadata,
  formatVerificationUrl,
  type CredentialEvidence,
} from "./engine";

describe("Verifiable Credential Engine", () => {
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

  it("builds correct metadata for First PR credential", () => {
    const meta = buildCredentialMetadata("first_pr_merged", dummyEvidence);
    expect(meta.title).toContain("First PR Merged");
    expect(meta.description).toContain("#42");
    expect(meta.description).toContain("TechNexusOrg/platform");
  });

  it("formats canonical verification URL", () => {
    const credId = "cred_tn_first-pr-merged_abc123456789";
    const url = formatVerificationUrl(credId);
    expect(url).toContain(`/verify/${credId}`);
  });
});
