import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/authorization";
import { getDb, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata = {
  title: "Maintainer & Admin Operations — TechNexusOrg",
  description: "Repository approvals, issue difficulty classification, and PR review triage.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/join");
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    redirect("/join");
  }

  // Fresh DB authorization check
  try {
    await requireRole(sessionUser.id, ["admin", "maintainer"]);
  } catch {
    redirect("/dashboard");
  }

  const db = await getDb();

  // 1. Fetch all projects
  const projects = await db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      isOfficial: schema.projects.isOfficial,
      contributionEnabled: schema.projects.contributionEnabled,
      firstPrEnabled: schema.projects.firstPrEnabled,
      approvedAt: schema.projects.approvedAt,
      openIssuesCount: schema.projects.openIssuesCount,
    })
    .from(schema.projects)
    .orderBy(desc(schema.projects.createdAt));

  // 2. Fetch issues for quality triage
  const issues = await db
    .select({
      id: schema.issues.id,
      title: schema.issues.title,
      githubIssueNumber: schema.issues.githubIssueNumber,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      isGoodFirstIssue: schema.issues.isGoodFirstIssue,
      isHelpWanted: schema.issues.isHelpWanted,
      githubRepo: schema.projects.githubRepo,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.state, "open"))
    .orderBy(desc(schema.issues.createdAt))
    .limit(100);

  // 3. Fetch open PRs
  const prs = await db
    .select({
      id: schema.pullRequests.id,
      githubPrNumber: schema.pullRequests.githubPrNumber,
      title: schema.pullRequests.title,
      url: schema.pullRequests.url,
      state: schema.pullRequests.state,
      associationStatus: schema.pullRequests.associationStatus,
      githubRepo: schema.projects.githubRepo,
      openedAt: schema.pullRequests.openedAt,
    })
    .from(schema.pullRequests)
    .innerJoin(schema.projects, eq(schema.pullRequests.projectId, schema.projects.id))
    .where(eq(schema.pullRequests.state, "open"))
    .orderBy(desc(schema.pullRequests.openedAt));

  // 4. Fetch open mentor requests
  const mentorRequests = await db
    .select({
      id: schema.mentorRequests.id,
      message: schema.mentorRequests.message,
      reply: schema.mentorRequests.reply,
      status: schema.mentorRequests.status,
      studentUsername: schema.users.githubUsername,
      issueTitle: schema.issues.title,
      issueNumber: schema.issues.githubIssueNumber,
    })
    .from(schema.mentorRequests)
    .innerJoin(schema.users, eq(schema.mentorRequests.studentId, schema.users.id))
    .innerJoin(schema.issues, eq(schema.mentorRequests.issueId, schema.issues.id))
    .orderBy(desc(schema.mentorRequests.createdAt))
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">
          Maintainer Operations Center
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Review official repository trust boundaries, classify issue difficulty, and monitor PR review queues.
        </p>
      </div>

      <AdminDashboardClient
        projects={projects.map((p: any) => ({
          ...p,
          approvedAt: p.approvedAt ? (p.approvedAt as Date).toISOString() : null,
        }))}
        issues={issues as any}
        prs={prs.map((pr: any) => ({
          ...pr,
          openedAt: (pr.openedAt as Date).toISOString(),
        }))}
        mentorRequests={mentorRequests as any}
      />
    </div>
  );
}
