import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";

export async function approveProject(
  projectId: string,
  adminUserId: string,
  options?: {
    contributionEnabled?: boolean;
    firstPrEnabled?: boolean;
  },
  database?: any
) {
  const db = database || (await getDb());
  const now = new Date();

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new Error("Project not found.");
  }

  // Enforce repository trust boundary
  const isOfficialOrg = project.githubRepo
    .toLowerCase()
    .startsWith(`${env.TECH_NEXUS_ORG_NAME.toLowerCase()}/`);

  if (!isOfficialOrg) {
    throw new Error(
      `Security violation: Repository "${project.githubRepo}" does not belong to the official ${env.TECH_NEXUS_ORG_NAME} organization.`
    );
  }

  if (project.githubOwnerId && project.githubOwnerId !== env.TECH_NEXUS_ORG_ID) {
    throw new Error(
      `Security violation: Repository owner ID ${project.githubOwnerId} does not match verified organization ID ${env.TECH_NEXUS_ORG_ID}.`
    );
  }

  const [updated] = await db
    .update(schema.projects)
    .set({
      isOfficial: true,
      contributionEnabled: options?.contributionEnabled ?? true,
      firstPrEnabled: options?.firstPrEnabled ?? true,
      approvedAt: now,
      maintainerId: adminUserId,
      updatedAt: now,
    })
    .where(eq(schema.projects.id, projectId))
    .returning();

  // Audit log
  await db.insert(schema.auditLogs).values({
    id: `audit_${crypto.randomUUID()}`,
    actorId: adminUserId,
    action: "project.approve",
    targetType: "project",
    targetId: projectId,
    metadata: {
      githubRepo: project.githubRepo,
      githubRepoId: project.githubRepoId,
      githubOwnerId: project.githubOwnerId,
      contributionEnabled: updated.contributionEnabled,
      firstPrEnabled: updated.firstPrEnabled,
    },
    createdAt: now,
  });

  return updated;
}

export async function rejectProject(
  projectId: string,
  adminUserId: string,
  database?: any
) {
  const db = database || (await getDb());
  const now = new Date();

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new Error("Project not found.");
  }

  const [updated] = await db
    .update(schema.projects)
    .set({
      isOfficial: false,
      contributionEnabled: false,
      firstPrEnabled: false,
      approvedAt: null,
      updatedAt: now,
    })
    .where(eq(schema.projects.id, projectId))
    .returning();

  // Audit log
  await db.insert(schema.auditLogs).values({
    id: `audit_${crypto.randomUUID()}`,
    actorId: adminUserId,
    action: "project.reject",
    targetType: "project",
    targetId: projectId,
    metadata: {
      githubRepo: project.githubRepo,
      githubRepoId: project.githubRepoId,
    },
    createdAt: now,
  });

  return updated;
}
