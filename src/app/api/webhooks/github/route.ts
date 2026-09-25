import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, type WebhookPullRequestEvent } from "@/lib/github/webhooks";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { processProgressionOnContribution } from "@/lib/progression/pipeline";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const rawBody = await request.text();

  // Validate webhook secret signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event === "ping") {
    return NextResponse.json({ message: "PONG" });
  }

  if (event === "pull_request") {
    try {
      const payload = JSON.parse(rawBody) as WebhookPullRequestEvent;

      if (payload.action === "closed" && payload.pull_request.merged) {
        const db = await getDb();
        const pr = payload.pull_request;
        const repoFullName = payload.repository.full_name;

        // 1. Look up user in database
        const matchingUsers = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.githubId, pr.user.id))
          .limit(1);

        if (matchingUsers.length === 0) {
          return NextResponse.json({ message: "PR author not registered on platform, skipped" });
        }

        const user = matchingUsers[0];

        // 2. Find or create project entry
        const matchingProjects = await db
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.githubRepo, repoFullName))
          .limit(1);

        let projectId: string;
        if (matchingProjects.length === 0) {
          projectId = `proj_${crypto.randomUUID()}`;
          await db.insert(schema.projects).values({
            id: projectId,
            name: payload.repository.name,
            slug: payload.repository.name.toLowerCase(),
            githubRepo: repoFullName,
            description: `Official repository: ${repoFullName}`,
            primaryLanguage: "TypeScript",
            languages: [],
            isOfficial: true,
          });
        } else {
          projectId = matchingProjects[0].id;
        }

        // 3. Check existing merged contributions for this user
        const existingContributions = await db
          .select()
          .from(schema.contributions)
          .where(
            and(
              eq(schema.contributions.userId, user.id),
              eq(schema.contributions.state, "merged")
            )
          );

        const isFirstPr = existingContributions.length === 0;
        const contributionId = `contrib_${crypto.randomUUID()}`;
        const mergedDate = pr.merged_at ? new Date(pr.merged_at) : new Date();

        await db.insert(schema.contributions).values({
          id: contributionId,
          userId: user.id,
          projectId,
          githubPrNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          state: "merged",
          isFirstPr,
          mergedAt: mergedDate,
          verifiedAt: new Date(),
          verificationSource: "github_webhook",
        });

        // 4. Process contributor progression, credentials, and Founding 1,000 cohort
        const progressionResult = await processProgressionOnContribution(db, {
          userId: user.id,
          contributionId,
          githubUsername: user.githubUsername,
          repoFullName,
          prNumber: pr.number,
          prUrl: pr.html_url,
          prTitle: pr.title,
          mergedAt: mergedDate,
          isFirstPr,
        });

        return NextResponse.json({
          status: "success",
          contributionId,
          isFirstPr,
          promoted: progressionResult.promoted,
          level: progressionResult.newLevel,
          credentialsIssued: progressionResult.credentialsIssued,
          foundingMemberNumber: progressionResult.foundingMemberNumber,
        });
      }
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
