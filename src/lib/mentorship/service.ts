import { getDb, schema } from "@/lib/db";
import { eq, or, desc } from "drizzle-orm";
import { createNotification } from "@/lib/notifications/service";

export interface CreateMentorRequestParams {
  studentId: string;
  issueId: string;
  mentorId?: string;
  message: string;
}

export interface ReplyMentorRequestParams {
  requestId: string;
  mentorId: string;
  reply: string;
  status: "open" | "in_progress" | "resolved" | "closed";
}

/**
 * Creates a new mentor request for assistance on an issue.
 */
export async function createMentorRequest(
  params: CreateMentorRequestParams,
  database?: any
) {
  const db = database || (await getDb());
  const requestId = `mreq_${crypto.randomUUID()}`;
  const now = new Date();

  const [request] = await db
    .insert(schema.mentorRequests)
    .values({
      id: requestId,
      studentId: params.studentId,
      issueId: params.issueId,
      mentorId: params.mentorId || null,
      message: params.message,
      status: "open",
      createdAt: now,
    })
    .returning();

  return request;
}

/**
 * Fetches mentorship requests relevant to a user (as student or assigned mentor).
 */
export async function getMentorRequestsForUser(
  userId: string,
  isMaintainer: boolean,
  database?: any
) {
  const db = database || (await getDb());

  if (isMaintainer) {
    // Mentors/maintainers see open requests without mentor assigned, or assigned to them
    return db
      .select({
        id: schema.mentorRequests.id,
        studentId: schema.mentorRequests.studentId,
        mentorId: schema.mentorRequests.mentorId,
        issueId: schema.mentorRequests.issueId,
        message: schema.mentorRequests.message,
        reply: schema.mentorRequests.reply,
        status: schema.mentorRequests.status,
        createdAt: schema.mentorRequests.createdAt,
        studentUsername: schema.users.githubUsername,
        studentDisplayName: schema.users.displayName,
        studentAvatar: schema.users.avatarUrl,
        issueTitle: schema.issues.title,
        issueNumber: schema.issues.githubIssueNumber,
      })
      .from(schema.mentorRequests)
      .innerJoin(schema.users, eq(schema.mentorRequests.studentId, schema.users.id))
      .innerJoin(schema.issues, eq(schema.mentorRequests.issueId, schema.issues.id))
      .where(
        or(
          eq(schema.mentorRequests.mentorId, userId),
          eq(schema.mentorRequests.status, "open")
        )
      )
      .orderBy(desc(schema.mentorRequests.createdAt));
  }

  // Regular contributors see their own submitted requests
  return db
    .select({
      id: schema.mentorRequests.id,
      studentId: schema.mentorRequests.studentId,
      mentorId: schema.mentorRequests.mentorId,
      issueId: schema.mentorRequests.issueId,
      message: schema.mentorRequests.message,
      reply: schema.mentorRequests.reply,
      status: schema.mentorRequests.status,
      createdAt: schema.mentorRequests.createdAt,
      issueTitle: schema.issues.title,
      issueNumber: schema.issues.githubIssueNumber,
    })
    .from(schema.mentorRequests)
    .innerJoin(schema.issues, eq(schema.mentorRequests.issueId, schema.issues.id))
    .where(eq(schema.mentorRequests.studentId, userId))
    .orderBy(desc(schema.mentorRequests.createdAt));
}

/**
 * Responds to a mentorship request.
 */
export async function replyMentorRequest(
  params: ReplyMentorRequestParams,
  database?: any
) {
  const db = database || (await getDb());
  const now = new Date();

  const [existing] = await db
    .select()
    .from(schema.mentorRequests)
    .where(eq(schema.mentorRequests.id, params.requestId))
    .limit(1);

  if (!existing) {
    throw new Error("Mentorship request not found.");
  }

  const [updated] = await db
    .update(schema.mentorRequests)
    .set({
      mentorId: params.mentorId,
      reply: params.reply,
      status: params.status,
      resolvedAt: params.status === "resolved" ? now : existing.resolvedAt,
    })
    .where(eq(schema.mentorRequests.id, params.requestId))
    .returning();

  // Notify student of response
  await createNotification(
    {
      userId: existing.studentId,
      type: "system",
      title: "Mentor Responded",
      message: `A mentor responded to your assistance request: "${params.reply.substring(0, 100)}"`,
      linkUrl: `/issues/${existing.issueId}`,
    },
    db
  );

  return updated;
}
