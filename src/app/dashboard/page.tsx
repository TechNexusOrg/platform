import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { evaluateProgression, type ContributorLevel } from "@/lib/progression/rules";
import { recommendIssues } from "@/lib/recommendations/engine";
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
    redirect("/api/auth/github");
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    redirect("/api/auth/github");
  }

  if (!sessionUser.isOnboarded) {
    redirect("/onboarding");
  }

  const db = await getDb();

  // Fetch live contributions
  const userContributions = await db
    .select()
    .from(schema.contributions)
    .where(eq(schema.contributions.userId, sessionUser.id));

  // Fetch live credentials
  const userCredentials = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.userId, sessionUser.id));

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

  const recommended = profile
    ? recommendIssues(
        openIssues.map((i: any) => ({
          ...i,
          difficulty: i.difficulty as "beginner" | "intermediate" | "advanced",
        })),
        {
          skills: profile.skills || [],
          interests: profile.interests || [],
          experienceLevel: (profile.experienceLevel as any) || "beginner",
          preferredLanguages: profile.preferredLanguages || [],
          contributionPreferences: profile.contributionPreferences || [],
        },
        4
      )
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
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

      {/* Progression & Requirements */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Contributor Progression Pipeline
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="mt-1 text-[11px] text-slate-500">Cryptographically verifiable records</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Experience Profile</div>
          <div className="mt-2 font-mono text-xl font-bold text-sky-400 capitalize">
            {profile?.experienceLevel || "Beginner"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {profile?.skills?.length || 0} registered skills
          </div>
        </div>
      </div>

      {/* Recommended Issues Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Recommended Contributions For You
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic matching based on your skills, experience tier, and interests.
            </p>
          </div>
          <Link
            href="/issues"
            className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
          >
            Explore All Issues →
          </Link>
        </div>

        {recommended.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">
              No matching issues currently open.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Browse the contribution marketplace or check official TechNexusOrg repositories on GitHub.
            </p>
            <Link
              href="/issues"
              className="mt-4 inline-block text-xs font-mono text-sky-400 hover:text-sky-300 underline"
            >
              Browse Issues Marketplace →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommended.map(({ issue, score, matchReasons }) => (
              <div
                key={issue.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      {issue.githubRepo}
                    </span>
                    <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                      Match Score: {score}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-mono">
                    <a
                      href={issue.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-sky-300 transition-colors"
                    >
                      {issue.title}
                    </a>
                  </h3>

                  {matchReasons.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {matchReasons.map((reason, idx) => (
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
                    Difficulty: {issue.difficulty}
                  </span>
                  <a
                    href={issue.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-sky-500 px-3 py-1.5 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Credentials Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Verified Credentials
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {userCredentials.length} issued
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
            <Link
              href="/first-pr"
              className="mt-4 inline-block text-xs font-mono text-sky-400 hover:text-sky-300 underline"
            >
              Start #FirstPR Program →
            </Link>
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
                <h4 className="text-sm font-bold text-white">{cred.title}</h4>
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
    </div>
  );
}
