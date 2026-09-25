import { getDb, schema } from "@/lib/db";
import { count, eq } from "drizzle-orm";

export interface PlatformMetrics {
  totalContributors: number;
  totalFirstPrsMerged: number;
  totalMergedPrs: number;
  totalOfficialProjects: number;
  foundingMembersCount: number;
}

export async function getLivePlatformMetrics(): Promise<PlatformMetrics> {
  try {
    const db = await getDb();

    const [userRes] = await db.select({ value: count() }).from(schema.users);
    const [mergedPrsRes] = await db
      .select({ value: count() })
      .from(schema.contributions)
      .where(eq(schema.contributions.state, "merged"));
    const [firstPrRes] = await db
      .select({ value: count() })
      .from(schema.contributions)
      .where(eq(schema.contributions.isFirstPr, true));
    const [projectsRes] = await db
      .select({ value: count() })
      .from(schema.projects)
      .where(eq(schema.projects.isOfficial, true));
    const [foundingRes] = await db
      .select({ value: count() })
      .from(schema.foundingMembers);

    return {
      totalContributors: Number(userRes?.value || 0),
      totalFirstPrsMerged: Number(firstPrRes?.value || 0),
      totalMergedPrs: Number(mergedPrsRes?.value || 0),
      totalOfficialProjects: Number(projectsRes?.value || 0),
      foundingMembersCount: Number(foundingRes?.value || 0),
    };
  } catch {
    // If DB is uninitialized or empty, return exact zero counts (never fake numbers)
    return {
      totalContributors: 0,
      totalFirstPrsMerged: 0,
      totalMergedPrs: 0,
      totalOfficialProjects: 0,
      foundingMembersCount: 0,
    };
  }
}
