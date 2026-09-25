import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { evaluateProgression, type ContributorLevel } from "@/lib/progression/rules";
import { recommendIssues } from "@/lib/recommendations/engine";
import { expireOverdueClaims } from "@/lib/issues/claims";
import { SyncContributionsButton } from "./SyncContributionsButton";
import { ProgressionPath } from "./ProgressionPath";

export const metadata = {
  title: "Contributor Dashboard — TechNexusOrg",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  // Fetch live contributions
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
      createdAt: schema.contributions.createdAt,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      projectId: schema.projects.id,
    })
    .from(schema.contributions)
    .innerJoin(schema.projects, eq(schema.contributions.projectId, schema.projects.id))
    .where(eq(schema.contributions.userId, sessionUser.id))
    .orderBy(desc(schema.contributions.createdAt));

  // Expire overdue claims across system
  await expireOverdueClaims(db);

  // Fetch active issue claims
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
      githubRepo: schema.projects.githubRepo,
      htmlUrl: schema.issues.htmlUrl,
    })
    .from(schema.issueClaims)
    .innerJoin(schema.issues, eq(schema.issueClaims.issueId, schema.issues.id))
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.issueClaims.userId, sessionUser.id),
        eq(schema.issueClaims.status, "active")
      )
    );

  // Fetch live credentials
  const userCredentials = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.userId, sessionUser.id))
    .orderBy(desc(schema.credentials.issuedAt));

  // Fetch user profile details
  const userProfiles = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, sessionUser.id))
    .limit(1);

  const profile = userProfiles[0];
  const mergedCount = userContributions.filter((c: any) => c.state === "merged").length;

  const progression = evaluateProgression(sessionUser.level as any, {
    prsOpened: userContributions.length,
    prsMerged: mergedCount,
    issuesResolved: 0,
    reviewsCompleted: 0,
    projectsContributedCount: new Set(userContributions.map((c: any) => c.projectId)).size,
    isOnboarded: sessionUser.isOnboarded,
  });

  // Fetch open issues for recommendations
  const openIssues = await db
    .select({
      id: schema.issues.id,
      projectId: schema.issues.projectId,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      title: schema.issues.title,
      bodySnippet: schema.issues.bodySnippet,
      htmlUrl: schema.issues.htmlUrl,
      labels: schema.issues.labels,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      skillsRequired: schema.issues.skillsRequired,
      isGoodFirstIssue: schema.issues.isGoodFirstIssue,
      isHelpWanted: schema.issues.isHelpWanted,
      primaryLanguage: schema.projects.primaryLanguage,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.state, "open"))
    .limit(50);

  const mappedExpLevel =
    profile?.experienceLevel === "complete_beginner"
      ? "beginner"
      : ((profile?.experienceLevel as any) || "beginner");

  const recommended = profile
    ? recommendIssues(
        openIssues.map((i: any) => ({
          ...i,
          difficulty: i.difficulty as "beginner" | "intermediate" | "advanced",
        })),
        {
          skills: profile.skills || [],
          interests: profile.interests || [],
          experienceLevel: mappedExpLevel,
          preferredLanguages: profile.preferredLanguages || [],
          contributionPreferences: profile.contributionPreferences || [],
        },
        5
      )
    : [];

  const topRecommendation = recommended[0];
  const remainingRecommendations = recommended.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Contributor Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {sessionUser.avatarUrl && (
            <img
              src={sessionUser.avatarUrl}
              alt={sessionUser.githubUsername}
              className="h-16 w-16 rounded-xl border border-slate-700 bg-slate-800"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                {sessionUser.displayName || sessionUser.githubUsername}
              </h1>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-mono text-sky-400 capitalize">
                {sessionUser.level.replace("_", " ")}
              </span>
              {sessionUser.foundingNumber && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                  Founding Member #{String(sessionUser.foundingNumber).padStart(4, "0")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              @{sessionUser.githubUsername} • GitHub Verified Identity
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SyncContributionsButton />
          <Link
            href={`/people/${sessionUser.githubUsername}`}
            className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 font-mono transition-colors"
          >
            Public Passport ↗
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Settings
          </Link>
          <a
            href={`https://github.com/${sessionUser.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* 1. YOUR NEXT CONTRIBUTION (Top Action Hero) */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/50 px-3 py-0.5 text-[11px] font-mono text-sky-300 uppercase tracking-wider">
              Primary Objective
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-mono uppercase tracking-tight mt-1.5">
              Your Next Contribution
            </h2>
          </div>
          <Link
            href="/issues"
            className="text-xs font-mono text-sky-400 hover:text-sky-300 underline underline-offset-4"
          >
            Browse All Issues Marketplace →
          </Link>
        </div>

        {topRecommendation ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>{topRecommendation.issue.githubRepo}</span>
                  <span>•</span>
                  <span className="capitalize">{topRecommendation.issue.difficulty}</span>
                  {topRecommendation.issue.estimatedEffort && (
                    <>
                      <span>•</span>
                      <span>{topRecommendation.issue.estimatedEffort}</span>
                    </>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white font-mono mt-1 hover:text-sky-300 transition-colors">
                  <Link href={`/issues/${topRecommendation.issue.id}`}>
                    {topRecommendation.issue.title}
                  </Link>
                </h3>

                {topRecommendation.issue.bodySnippet && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {topRecommendation.issue.bodySnippet}
                  </p>
                )}
              </div>

              {/* Skills Tags */}
              {topRecommendation.issue.skillsRequired.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {topRecommendation.issue.skillsRequired.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-[11px] font-mono text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Why Recommended & CTA */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Why this is recommended:
                </h4>
                <div className="mt-2.5 space-y-1.5">
                  {topRecommendation.matchReasons.map((reason: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                      <span>✓</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <Link
                  href={`/issues/${topRecommendation.issue.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-xs font-bold font-mono text-slate-950 hover:bg-sky-400 shadow-md shadow-sky-500/20 transition-all"
                >
                  <span>Start Contribution</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-3">
            <p className="text-xs font-mono text-slate-400">
              No matching open issues found in official repositories right now.
            </p>
            <p className="text-[11px] text-slate-500">
              Check back shortly or browse all active issues across official TechNexusOrg repositories.
            </p>
            <Link
              href="/issues"
              className="inline-block text-xs font-mono text-sky-400 hover:underline"
            >
              Explore Issues Marketplace →
            </Link>
          </div>
        )}
      </div>

      {/* 2. ACTIVE WORK (Claimed Issues Workspace) */}
      {activeClaims.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Active Contribution Workspaces ({activeClaims.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-amber-300">In Progress</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeClaims.map((claim: any) => (
              <div
                key={claim.claimId}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{claim.githubRepo}</span>
                  <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300">
                    Claimed Issue #{claim.issueNumber}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white font-mono">
                  <Link href={`/issues/${claim.issueId}`} className="hover:text-sky-300 transition-colors">
                    {claim.issueTitle}
                  </Link>
                </h3>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Expires: {new Date(claim.expiresAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/issues/${claim.issueId}`}
                    className="rounded bg-sky-500 px-3 py-1.5 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    Open Workspace →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CONTRIBUTION PROGRESS (Milestones & Requirements) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Contribution Progress & Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified proof of work drives automatic rank elevation. No fake counts or self-awarded titles.
            </p>
          </div>
        </div>

        <ProgressionPath
          currentLevel={sessionUser.level as ContributorLevel}
          progression={progression}
          mergedCount={mergedCount}
        />
      </div>

      {/* 4. ADDITIONAL RECOMMENDED ISSUES */}
      {remainingRecommendations.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                More Recommended Issues
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Matched to your languages, skills, and contribution preferences.
              </p>
            </div>
            <Link
              href="/issues"
              className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
            >
              View All Issues →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remainingRecommendations.map(({ issue, matchReasons }) => (
              <div
                key={issue.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{issue.githubRepo}</span>
                    <span className="capitalize">{issue.difficulty}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-mono">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="hover:text-sky-300 transition-colors"
                    >
                      {issue.title}
                    </Link>
                  </h3>

                  {matchReasons.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {matchReasons.slice(0, 2).map((reason: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono"
                        >
                          <span>✓</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    {issue.estimatedEffort || "1–3 hours"}
                  </span>
                  <Link
                    href={`/issues/${issue.id}`}
                    className="rounded bg-sky-500 px-3 py-1.5 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CONTRIBUTION HISTORY */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Contribution History ({userContributions.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {mergedCount} merged on official projects
          </span>
        </div>

        {userContributions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">
              No contributions recorded yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Claim an issue and submit your pull request on GitHub to see live contribution tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userContributions.map((contrib: any) => (
              <div
                key={contrib.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                        contrib.state === "merged"
                          ? "bg-purple-500/10 border border-purple-500/30 text-purple-300"
                          : "bg-sky-500/10 border border-sky-500/30 text-sky-300"
                      }`}
                    >
                      {contrib.state}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{contrib.githubRepo}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    <a
                      href={contrib.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-sky-300 transition-colors"
                    >
                      PR #{contrib.prNumber}: {contrib.prTitle}
                    </a>
                  </h4>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">
                    {contrib.mergedAt
                      ? `Merged ${new Date(contrib.mergedAt).toLocaleDateString()}`
                      : `Opened ${new Date(contrib.createdAt).toLocaleDateString()}`}
                  </div>
                  <a
                    href={contrib.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-sky-400 hover:underline"
                  >
                    View on GitHub ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. VERIFIED CREDENTIALS */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Verified Credentials ({userCredentials.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Cryptographic proof of work records
          </span>
        </div>

        {userCredentials.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">
              No credentials issued yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Merge your first pull request on an official project to earn the verified #FirstPR credential.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCredentials.map((cred: any) => (
              <div
                key={cred.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
                    {cred.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(cred.issuedAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white font-mono">{cred.title}</h4>
                <p className="text-xs text-slate-400">{cred.description}</p>
                <div className="pt-2">
                  <Link
                    href={`/verify/${cred.id}`}
                    className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
                  >
                    View Public Verification Record →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. SUPPORTING STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Total PRs Merged</div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">{mergedCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Official TechNexus repositories</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Verified Credentials</div>
          <div className="mt-2 font-mono text-3xl font-bold text-emerald-400">
            {userCredentials.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Verifiable records</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Experience Profile</div>
          <div className="mt-2 font-mono text-xl font-bold text-sky-400 capitalize">
            {profile?.experienceLevel?.replace("_", " ") || "Beginner"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {profile?.skills?.length || 0} registered skills
          </div>
        </div>
      </div>
    </div>
  );
}
