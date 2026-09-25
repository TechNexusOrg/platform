import { getDb, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";

export interface CreateNotificationParams {
  userId: string;
  type: "credential_issued" | "claim_expiring" | "pr_review" | "system";
  title: string;
  message: string;
  linkUrl?: string;
}

/**
 * Creates an in-app notification for a contributor.
 */
export async function createNotification(
  params: CreateNotificationParams,
  database?: any
) {
  const db = database || (await getDb());
  const notificationId = `notif_${crypto.randomUUID()}`;
  const now = new Date();

  const [notification] = await db
    .insert(schema.notifications)
    .values({
      id: notificationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      linkUrl: params.linkUrl || null,
      isRead: false,
      createdAt: now,
    })
    .returning();

  return notification;
}

/**
 * Fetches recent notifications for a user.
 */
export async function getUserNotifications(
  userId: string,
  limit = 20,
  database?: any
) {
  const db = database || (await getDb());
  return db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  database?: any
) {
  const db = database || (await getDb());
  const [updated] = await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId)
      )
    )
    .returning();

  return updated;
}
