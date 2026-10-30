import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { approveProject, rejectProject } from "./approval";
import { eq } from "drizzle-orm";

describe("Project Approval Trust Boundary", () => {
  let db: any;
  const adminId = "user_admin_test_1";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
  });

  beforeEach(async () => {
    db = await getDb();

    // Clean tables
    await db.delete(schema.auditLogs);
    await db.delete(schema.projects);
    await db.delete(schema.users);

    // Insert admin user
    await db.insert(schema.users).values({
      id: adminId,
      githubId: 999999,
      githubUsername: "testadmin",
      role: "admin",
      level: "project_lead",
    });
  });

  it("successfully approves a valid TechNexusOrg repository with matching owner ID", async () => {
    const projectId = "proj_official_platform";
    await db.insert(schema.projects).values({
      id: projectId,
      name: "platform",
      slug: "platform",
      githubRepo: "TechNexusOrg/platform",
      githubRepoId: 1387995449,
      githubOwnerId: 333899669,
      description: "Official platform repository",
      primaryLanguage: "TypeScript",
      isOfficial: false,
      contributionEnabled: false,
      firstPrEnabled: false,
    });

    const approved = await approveProject(projectId, adminId, {
      contributionEnabled: true,
      firstPrEnabled: true,
    }, db);

    expect(approved.isOfficial).toBe(true);
    expect(approved.contributionEnabled).toBe(true);
    expect(approved.approvedAt).toBeDefined();

    // Verify audit log
    const logs = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, "project.approve"));
    expect(logs).toHaveLength(1);
    expect(logs[0].targetId).toBe(projectId);
  });

  it("rejects approval of external repository outside TechNexusOrg trust boundary", async () => {
    const projectId = "proj_external_malicious";
    await db.insert(schema.projects).values({
      id: projectId,
      name: "hacked-repo",
      slug: "hacked-repo",
      githubRepo: "external-org/hacked-repo",
      githubRepoId: 9999,
      githubOwnerId: 8888,
      description: "External unauthorized repo",
      primaryLanguage: "JavaScript",
      isOfficial: false,
    });

    await expect(
      approveProject(projectId, adminId, {}, db)
    ).rejects.toThrow(/does not belong to the official TechNexusOrg organization/);

    const [unapproved] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    expect(unapproved.isOfficial).toBe(false);
  });

  it("rejects approval if repository owner ID does not match TechNexusOrg ID", async () => {
    const projectId = "proj_spoofed_org";
    await db.insert(schema.projects).values({
      id: projectId,
      name: "spoofed",
      slug: "spoofed",
      githubRepo: "TechNexusOrg/spoofed",
      githubRepoId: 12345,
      githubOwnerId: 999999999, // Mismatched ID
      description: "Spoofed repo name",
      primaryLanguage: "Python",
      isOfficial: false,
    });

    await expect(
      approveProject(projectId, adminId, {}, db)
    ).rejects.toThrow(/does not match verified organization ID/);
  });

  it("rejectProject sets isOfficial to false and logs audit trail", async () => {
    const projectId = "proj_to_reject";
    await db.insert(schema.projects).values({
      id: projectId,
      name: "old-repo",
      slug: "old-repo",
      githubRepo: "TechNexusOrg/old-repo",
      githubRepoId: 5555,
      githubOwnerId: 333899669,
      description: "Old project",
      primaryLanguage: "TypeScript",
      isOfficial: true,
      contributionEnabled: true,
    });

    const rejected = await rejectProject(projectId, adminId, db);
    expect(rejected.isOfficial).toBe(false);
    expect(rejected.contributionEnabled).toBe(false);
    expect(rejected.approvedAt).toBeNull();

    const logs = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, "project.reject"));
    expect(logs).toHaveLength(1);
  });
});
