import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { determineNextAction } from "@/lib/progression/next-action";
import { evaluateProgression, type ContributorLevel } from "@/lib/progression/rules";
import { expireOverdueClaims } from "@/lib/issues/claims";
import { getContributorMetrics } from "@/lib/metrics";

export const metadata = {
  title: "My Work & Contributions — TechNexusOrg",
  description: "Track your active claims, pull requests, verified proof of work, and next contribution steps.",
};

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/join");
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    redirect("/join");
  }

  if (!sessionUser.isOnboarded) {
    redirect("/onboarding");
  }

  const db = await getDb();
  await expireOverdueClaims(db);

  // 1. Fetch active issue claims with project and issue info
  const activeClaims = await db
    .select({
      claimId: schema.issueClaims.id,
      status: schema.issueClaims.status,
      claimedAt: schema.issueClaims.claimedAt,
      expiresAt: schema.issueClaims.expiresAt,
      issueId: schema.issues.id,
      issueTitle: schema.issues.title,
      issueNumber: schema.issues.githubIssueNumber,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      skillsRequired: schema.issues.skillsRequired,
      htmlUrl: schema.issues.htmlUrl,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
    })
    .from(schema.issueClaims)
    .innerJoin(schema.issues, eq(schema.issueClaims.issueId, schema.issues.id))
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.issueClaims.userId, sessionUser.id),
        eq(schema.issueClaims.status, "active")
      )
    )
    .orderBy(desc(schema.issueClaims.claimedAt));

  // 2. Fetch all user pull requests
  const userPrs = await db
    .select({
      id: schema.pullRequests.id,
      prNumber: schema.pullRequests.githubPrNumber,
      title: schema.pullRequests.title,
      url: schema.pullRequests.url,
      state: schema.pullRequests.state,
      draft: schema.pullRequests.draft,
      mergeCommitSha: schema.pullRequests.mergeCommitSha,
      openedAt: schema.pullRequests.openedAt,
      mergedAt: schema.pullRequests.mergedAt,
      associationStatus: schema.pullRequests.associationStatus,
      issueId: schema.pullRequests.issueId,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
    })
    .from(schema.pullRequests)
    .innerJoin(schema.projects, eq(schema.pullRequests.projectId, schema.projects.id))
    .where(eq(schema.pullRequests.userId, sessionUser.id))
    .orderBy(desc(schema.pullRequests.openedAt));

  // 3. Fetch completed verified contributions
  const userContributions = await db
    .select({
      id: schema.contributions.id,
      prNumber: schema.contributions.githubPrNumber,
      prTitle: schema.contributions.prTitle,
      prUrl: schema.contributions.prUrl,
      state: schema.contributions.state,
      isFirstPr: schema.contributions.isFirstPr,
      mergedAt: schema.contributions.mergedAt,
      verifiedAt: schema.contributions.verifiedAt,
      verificationSource: schema.contributions.verificationSource,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
    })
    .from(schema.contributions)
    .innerJoin(schema.projects, eq(schema.contributions.projectId, schema.projects.id))
    .where(eq(schema.contributions.userId, sessionUser.id))
    .orderBy(desc(schema.contributions.mergedAt));

  // 4. Fetch credentials
  const userCredentials = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.userId, sessionUser.id))
    .orderBy(desc(schema.credentials.issuedAt));

  // 5. Gather authoritative progression metrics
  const metrics = await getContributorMetrics(sessionUser.id, db);
  const progression = evaluateProgression(sessionUser.level as ContributorLevel, metrics);

  // 6. Calculate Next Action
  const activeClaim = activeClaims[0] || null;
  const activePr = userPrs.find((pr: any) => pr.state !== "closed" && pr.state !== "merged") || null;
  const latestContribution = userContributions[0] || null;

  const nextAction = determineNextAction({
    isOnboarded: true,
    username: sessionUser.githubUsername,
    activeClaim: activeClaim
      ? {
          id: activeClaim.claimId,
          issueId: activeClaim.issueId,
          issueTitle: activeClaim.issueTitle,
          repo: activeClaim.githubRepo,
          expiresAt: activeClaim.expiresAt,
        }
      : null,
    activePr,
    latestContribution,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">
              My Work Center
            </h1>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-xs font-mono text-sky-400 capitalize">
              {sessionUser.level.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Track your reserved issues, pull request review stages, verified merged proof of work, and progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/issues"
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-mono font-semibold text-white hover:bg-sky-500 transition-colors shadow-sm"
          >
            + Claim New Issue
          </Link>
          <Link
            href={`/people/${sessionUser.githubUsername}`}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Public Passport ↗
          </Link>
        </div>
      </div>

      {/* Next Action Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-mono font-semibold text-sky-300">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            Current Focus • {nextAction.stageLabel}
          </span>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Step {nextAction.stageIndex + 1} of 8 in Contributor Lifecycle
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">
            {nextAction.title}
          </h2>
          <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
            {nextAction.description}
          </p>
        </div>

        <div className="pt-2">
          {nextAction.actionHref.startsWith("http") ? (
            <a
              href={nextAction.actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-colors shadow-lg"
            >
              {nextAction.actionText} ↗
            </a>
          ) : (
            <Link
              href={nextAction.actionHref}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-colors shadow-lg"
            >
              {nextAction.actionText} →
            </Link>
          )}
        </div>
      </div>

      {/* Section 1: Current Contributions (Active Claims) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white font-mono flex items-center gap-2">
            <span>Active Issue Claims</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {activeClaims.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            7-day expiration lease
          </span>
        </div>

        {activeClaims.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center space-y-3">
            <p className="text-xs text-slate-400 font-mono">
              You do not have any active issue claims right now.
            </p>
            <Link
              href="/issues"
              className="inline-block rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-mono text-sky-400 hover:bg-sky-500/20"
            >
              Browse Recommended Issues →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeClaims.map((claim: any) => {
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(claim.expiresAt).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              );

              return (
                <div
                  key={claim.claimId}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs text-sky-400">
                      {claim.githubRepo} #{claim.issueNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                        daysLeft <= 2
                          ? "bg-red-500/10 border border-red-500/30 text-red-400"
                          : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {daysLeft} day(s) left
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono line-clamp-2">
                      {claim.issueTitle}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                        {claim.difficulty}
                      </span>
                      {claim.estimatedEffort && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {claim.estimatedEffort}
                        </span>
                      )}
                      {claim.skillsRequired?.slice(0, 3).map((skill: string) => (
                        <span
                          key={skill}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                    <Link
                      href={`/issues/${claim.issueId}`}
                      className="text-sky-400 hover:text-sky-300 underline font-semibold"
                    >
                      Open Workspace →
                    </Link>
                    <a
                      href={claim.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-400"
                    >
                      GitHub Issue ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Pull Requests in Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white font-mono flex items-center gap-2">
            <span>My Pull Requests</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {userPrs.length}
            </span>
          </h2>
        </div>

        {userPrs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center space-y-2">
            <p className="text-xs text-slate-400 font-mono">
              No pull requests tracked yet. When you open a PR on GitHub referencing your claimed issue, it will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60 bg-slate-900/40">
            {userPrs.map((pr: any) => (
              <div
                key={pr.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {pr.githubRepo} #{pr.prNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-medium ${
                        pr.state === "merged"
                          ? "bg-purple-500/10 border border-purple-500/30 text-purple-300"
                          : pr.state === "approved"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : pr.state === "changes_requested"
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                          : "bg-sky-500/10 border border-sky-500/30 text-sky-400"
                      }`}
                    >
                      {pr.state.replace("_", " ")}
                    </span>
                    {pr.associationStatus && pr.associationStatus !== "unlinked" && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {pr.associationStatus}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {pr.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    View on GitHub ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Completed Verified Contributions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white font-mono flex items-center gap-2">
            <span>Verified Contributions</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {userContributions.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Official GitHub Event Proof
          </span>
        </div>

        {userContributions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center space-y-2">
            <p className="text-xs text-slate-400 font-mono">
              No merged contributions yet. Complete and merge your first PR on an official repository to build your verified record.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-900/40">
            {userContributions.map((contrib: any) => (
              <div
                key={contrib.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-emerald-400 font-medium">
                      Verified Merged PR
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      • {contrib.githubRepo} #{contrib.prNumber}
                    </span>
                    {contrib.isFirstPr && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        First PR
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {contrib.prTitle}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500">
                    Merged: {contrib.mergedAt ? new Date(contrib.mergedAt).toLocaleDateString() : "Recorded"}
                    {contrib.verifiedAt && ` • Verified: ${new Date(contrib.verifiedAt).toLocaleDateString()}`}
                  </div>
                </div>

                <a
                  href={contrib.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
                >
                  GitHub PR ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Verifiable Credentials & Progression */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credentials */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white font-mono">
            Verifiable Credentials ({userCredentials.length})
          </h2>

          {userCredentials.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-500 font-mono">
              Credentials are issued automatically upon verified PR merges.
            </div>
          ) : (
            <div className="space-y-3">
              {userCredentials.map((cred: any) => (
                <div
                  key={cred.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {cred.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(cred.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cred.description}
                  </p>
                  <div className="pt-1">
                    <Link
                      href={`/verify/${cred.id}`}
                      className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
                    >
                      Verify Record ({cred.id}) →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progression Requirements */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white font-mono">
            Progression: Next Level
          </h2>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-500 block">
                  Current Level
                </span>
                <span className="text-base font-bold text-white font-mono capitalize">
                  {progression.currentLevel.replace("_", " ")}
                </span>
              </div>
              {progression.nextLevel && (
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-500 block">
                    Next Level
                  </span>
                  <span className="text-base font-bold text-sky-400 font-mono capitalize">
                    {progression.nextLevel.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400 font-semibold block">
                Requirements for advancement:
              </span>
              <ul className="space-y-1.5">
                {progression.requirementsForNextLevel.map((req, i) => (
                  <li
                    key={i}
                    className="text-xs font-mono text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-sky-400">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
