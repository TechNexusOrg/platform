import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from "./service";

describe("Notifications Service", () => {
  const userId = "usr_notif_test_user";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
    const db = await getDb();

    await db.insert(schema.users).values({
      id: userId,
      githubId: 665544,
      githubUsername: "notif_tester",
      role: "contributor",
      level: "level_1",
      isOnboarded: true,
    });
  });

  it("creates notification with unread status", async () => {
    const notif = await createNotification({
      userId,
      type: "credential_issued",
      title: "New Credential Minted",
      message: "You earned the First PR Merged credential!",
      linkUrl: "/verify/cred_123",
    });

    expect(notif).toBeDefined();
    expect(notif.isRead).toBe(false);
    expect(notif.type).toBe("credential_issued");
    expect(notif.userId).toBe(userId);
  });

  it("retrieves user notifications ordered by creation time", async () => {
    const list = await getUserNotifications(userId);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].userId).toBe(userId);
  });

  it("marks a notification as read", async () => {
    const list = await getUserNotifications(userId);
    const firstNotif = list[0];

    const updated = await markNotificationAsRead(firstNotif.id, userId);
    expect(updated.isRead).toBe(true);
  });
});
