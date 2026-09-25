import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { getContributorPassport } from "./index";

describe("Contributor Passport Engine", () => {
  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();

    const db = await getDb();

    // Seed public contributor
    await db.insert(schema.users).values({
      id: "usr_passport_public_01",
      githubId: 88776655,
      githubUsername: "sarahdev",
      displayName: "Sarah Engineer",
      email: "sarah@example.com",
      avatarUrl: "https://avatars.githubusercontent.com/u/88776655",
      role: "contributor",
      level: "contributor",
      foundingNumber: 7,
      isPublic: true,
      isOnboarded: true,
    });

    // Seed private contributor
    await db.insert(schema.users).values({
      id: "usr_passport_private_02",
      githubId: 44332211,
      githubUsername: "alexstealth",
      displayName: "Alex Stealth",
      email: "alex@example.com",
      role: "contributor",
      level: "explorer",
      isPublic: false,
      isOnboarded: true,
    });

    // Seed official project
    await db.insert(schema.projects).values({
      id: "proj_passport_test_01",
      name: "Platform Core",
      slug: "platform-core",
      githubRepo: "TechNexusOrg/platform",
      description: "Core platform repo",
      primaryLanguage: "TypeScript",
      languages: ["TypeScript"],
      isOfficial: true,
    });

    // Seed contribution for sarahdev
    await db.insert(schema.contributions).values({
      id: "contrib_sarah_01",
      userId: "usr_passport_public_01",
      projectId: "proj_passport_test_01",
      githubPrNumber: 101,
      prTitle: "feat: add contributor passport module",
      prUrl: "https://github.com/TechNexusOrg/platform/pull/101",
      state: "merged",
      isFirstPr: true,
      mergedAt: new Date("2026-09-25T10:00:00Z"),
      verifiedAt: new Date("2026-09-25T10:05:00Z"),
    });

    // Seed credential for sarahdev
    await db.insert(schema.credentials).values({
      id: "cred_tn_first-pr-merged_sarah01",
      userId: "usr_passport_public_01",
      type: "first_pr_merged",
      title: "First PR Merged — Open Source Contributor",
      description: "Verified merge of PR #101",
      status: "active",
      issuer: "TechNexusOrg",
      evidenceData: { prNumber: 101, repo: "TechNexusOrg/platform" },
      verificationUrl: "http://localhost:3000/verify/cred_tn_first-pr-merged_sarah01",
    });
  });

  it("returns notFound for unknown username", async () => {
    const res = await getContributorPassport("non_existent_user_9999");
    expect("notFound" in res && res.notFound).toBe(true);
  });

  it("returns isPrivate for private user when viewer is unauthenticated or different", async () => {
    const res = await getContributorPassport("alexstealth");
    expect("isPrivate" in res && res.isPrivate).toBe(true);

    const resDiffViewer = await getContributorPassport("alexstealth", "other_user_id");
    expect("isPrivate" in resDiffViewer && resDiffViewer.isPrivate).toBe(true);
  });

  it("returns full profile for private user when viewer is the owner", async () => {
    const res = await getContributorPassport("alexstealth", "usr_passport_private_02");
    expect("user" in res).toBe(true);
    if ("user" in res) {
      expect(res.user.githubUsername).toBe("alexstealth");
    }
  });

  it("returns verified statistics, credentials, and timeline for public contributor", async () => {
    const res = await getContributorPassport("sarahdev");
    expect("user" in res).toBe(true);
    if ("user" in res) {
      expect(res.user.githubUsername).toBe("sarahdev");
      expect(res.user.foundingNumber).toBe(7);
      expect(res.statistics.mergedPrs).toBe(1);
      expect(res.statistics.projectsContributed).toBe(1);
      expect(res.statistics.credentialsEarned).toBe(1);
      expect(res.credentials).toHaveLength(1);
      expect(res.timeline.length).toBeGreaterThanOrEqual(2); // joined + pr_merged + cred
    }
  });
});
