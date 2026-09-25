import { getGitHubClient, checkRateLimit } from "./client";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { processProgressionOnContribution } from "@/lib/progression/pipeline";

export interface SyncContributionsResult {
  syncedCount: number;
  newContributionsCount: number;
  credentialsIssued: string[];
  newLevel?: string;
  foundingMemberNumber?: number;
  rateLimitRemaining?: number;
}

export async function syncUserContributions(
  userId: string,
  userToken?: string
): Promise<SyncContributionsResult> {
  const db = await getDb();

  // 1. Fetch user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const octokit = getGitHubClient(userToken);
  const rateLimit = await checkRateLimit(octokit);

  if (rateLimit && rateLimit.remaining < 5) {
    throw new Error(
      `GitHub API rate limit exhausted. Resets at ${rateLimit.resetDate.toISOString()}`
    );
  }

  // 2. Fetch all official projects
  const officialProjects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.isOfficial, true));

  let syncedCount = 0;
  let newContributionsCount = 0;
  const allCredentialsIssued: string[] = [];
  let latestLevel: string = user.level;
  let foundingMemberNumber: number | undefined;

  for (const project of officialProjects) {
    const [owner, repo] = project.githubRepo.split("/");
    if (!owner || !repo) continue;

    try {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "closed",
        per_page: 50,
      });

      for (const pr of pulls) {
        // Must be authored by the target user and merged
        const authorMatch =
          pr.user?.id === user.githubId ||
          pr.user?.login.toLowerCase() === user.githubUsername.toLowerCase();

        if (!authorMatch || !pr.merged_at) {
          continue;
        }

        syncedCount++;

        // Check if contribution already recorded
        const existingContrib = await db
          .select()
          .from(schema.contributions)
          .where(
            and(
              eq(schema.contributions.userId, user.id),
              eq(schema.contributions.prUrl, pr.html_url)
            )
          )
          .limit(1);

        if (existingContrib.length > 0) {
          continue; // Already processed
        }

        // Count previous merged contributions to determine if this is the first PR
        const priorMerged = await db
          .select()
          .from(schema.contributions)
          .where(
            and(
              eq(schema.contributions.userId, user.id),
              eq(schema.contributions.state, "merged")
            )
          );

        const isFirstPr = priorMerged.length === 0;
        const contributionId = `contrib_${crypto.randomUUID()}`;
        const mergedDate = new Date(pr.merged_at);

        // Record contribution
        await db.insert(schema.contributions).values({
          id: contributionId,
          userId: user.id,
          projectId: project.id,
          githubPrNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          state: "merged",
          isFirstPr,
          mergedAt: mergedDate,
          verifiedAt: new Date(),
          verificationSource: "github_sync",
        });

        newContributionsCount++;

        // Process progression & credentials
        const progressionResult = await processProgressionOnContribution(db, {
          userId: user.id,
          contributionId,
          githubUsername: user.githubUsername,
          repoFullName: project.githubRepo,
          prNumber: pr.number,
          prUrl: pr.html_url,
          prTitle: pr.title,
          mergedAt: mergedDate,
          isFirstPr,
        });

        latestLevel = progressionResult.newLevel;
        if (progressionResult.credentialsIssued.length > 0) {
          allCredentialsIssued.push(...progressionResult.credentialsIssued);
        }
        if (progressionResult.foundingMemberNumber) {
          foundingMemberNumber = progressionResult.foundingMemberNumber;
        }
      }
    } catch (err: any) {
      console.warn(`Could not sync pulls for ${project.githubRepo}:`, err?.message);
    }
  }

  return {
    syncedCount,
    newContributionsCount,
    credentialsIssued: allCredentialsIssued,
    newLevel: latestLevel,
    foundingMemberNumber,
    rateLimitRemaining: rateLimit?.remaining,
  };
}
