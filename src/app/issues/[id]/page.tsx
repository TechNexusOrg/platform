import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import {
  getActiveClaimForIssue,
  getUserActiveClaims,
  getMaxActiveClaimsForLevel,
} from "@/lib/issues/claims";
import { IssueWorkspaceClient } from "./IssueWorkspaceClient";

export const dynamic = "force-dynamic";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IssueDetailPageProps) {
  const { id } = await params;
  const db = await getDb();

  const [issue] = await db
    .select({
      title: schema.issues.title,
      projectName: schema.projects.name,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.id, id))
    .limit(1);

  if (!issue) {
    return {
      title: "Issue Not Found — TechNexusOrg",
    };
  }

  return {
    title: `${issue.title} — ${issue.projectName} — TechNexusOrg`,
    description: `Claim and contribute to ${issue.title} on TechNexusOrg. Real issues, maintainer reviews, and verifiable credentials.`,
  };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = await params;
  const db = await getDb();

  const [issueRecord] = await db
    .select({
      id: schema.issues.id,
      title: schema.issues.title,
      body: schema.issues.body,
      bodySnippet: schema.issues.bodySnippet,
      state: schema.issues.state,
      htmlUrl: schema.issues.htmlUrl,
      labels: schema.issues.labels,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      skillsRequired: schema.issues.skillsRequired,
      isGoodFirstIssue: schema.issues.isGoodFirstIssue,
      isHelpWanted: schema.issues.isHelpWanted,
      githubIssueNumber: schema.issues.githubIssueNumber,
      projectId: schema.projects.id,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      projectDescription: schema.projects.description,
      primaryLanguage: schema.projects.primaryLanguage,
      contributionEnabled: schema.projects.contributionEnabled,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.id, id))
    .limit(1);

  if (!issueRecord) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const sessionUser = token ? await verifySessionToken(token) : null;

  const activeClaim = await getActiveClaimForIssue(id);
  const userClaims = sessionUser ? await getUserActiveClaims(sessionUser.id) : [];
  const maxClaims = sessionUser ? getMaxActiveClaimsForLevel(sessionUser.level) : 1;

  return (
    <IssueWorkspaceClient
      issue={{
        id: issueRecord.id,
        title: issueRecord.title,
        body: issueRecord.body,
        bodySnippet: issueRecord.bodySnippet,
        state: issueRecord.state as "open" | "closed",
        htmlUrl: issueRecord.htmlUrl,
        labels: (issueRecord.labels as string[]) || [],
        difficulty: issueRecord.difficulty as "beginner" | "intermediate" | "advanced",
        estimatedEffort: issueRecord.estimatedEffort,
        skillsRequired: (issueRecord.skillsRequired as string[]) || [],
        isGoodFirstIssue: issueRecord.isGoodFirstIssue,
        isHelpWanted: issueRecord.isHelpWanted,
        githubIssueNumber: issueRecord.githubIssueNumber,
      }}
      project={{
        id: issueRecord.projectId,
        name: issueRecord.projectName,
        githubRepo: issueRecord.githubRepo,
        description: issueRecord.projectDescription,
        primaryLanguage: issueRecord.primaryLanguage || "TypeScript",
        contributionEnabled: issueRecord.contributionEnabled,
      }}
      currentUser={
        sessionUser
          ? {
              id: sessionUser.id,
              githubUsername: sessionUser.githubUsername,
              displayName: sessionUser.displayName,
              avatarUrl: sessionUser.avatarUrl,
              level: sessionUser.level,
            }
          : null
      }
      initialActiveClaim={activeClaim}
      userActiveClaimsCount={userClaims.length}
      userMaxClaims={maxClaims}
    />
  );
}
