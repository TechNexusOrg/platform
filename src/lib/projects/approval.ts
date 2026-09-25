import { getDb, schema } from "@/lib/db";
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
    },
    createdAt: now,
  });

  return updated;
}
