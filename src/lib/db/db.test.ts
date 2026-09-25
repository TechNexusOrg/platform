import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "./index";
import { runMigrations } from "./migrate";
import { eq } from "drizzle-orm";
import { getLivePlatformMetrics } from "@/lib/metrics";

describe("Database & Metrics Integration", () => {
  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
  });

  it("inserts and retrieves a user cleanly", async () => {
    const db = await getDb();
    const userId = "usr_integration_test_01";

    await db.insert(schema.users).values({
      id: userId,
      githubId: 99887766,
      githubUsername: "testcontributor",
      displayName: "Test Contributor",
      email: "test@technexus.org",
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
    });

    const results = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    expect(results).toHaveLength(1);
    expect(results[0].githubUsername).toBe("testcontributor");
    expect(results[0].isOnboarded).toBe(true);
  });

  it("calculates live metrics from actual database records", async () => {
    const metrics = await getLivePlatformMetrics();
    expect(metrics.totalContributors).toBeGreaterThanOrEqual(1);
    expect(typeof metrics.totalFirstPrsMerged).toBe("number");
    expect(typeof metrics.foundingMembersCount).toBe("number");
  });
});
