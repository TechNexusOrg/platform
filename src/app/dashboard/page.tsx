import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { evaluateProgression } from "@/lib/progression/rules";

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
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                {sessionUser.displayName || sessionUser.githubUsername}
              </h1>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-mono text-sky-400 capitalize">
                {sessionUser.level.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              @{sessionUser.githubUsername} • GitHub Verified Identity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/issues"
            className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 font-mono transition-colors"
          >
            Find Issues →
          </Link>
          <a
            href={`https://github.com/${sessionUser.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            GitHub Profile
          </a>
        </div>
      </div>

      {/* Progression & Requirements */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Progression Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Next milestone:{" "}
              <span className="text-sky-400 font-mono capitalize">
                {progression.nextLevel ? progression.nextLevel.replace("_", " ") : "Max Rank Reached"}
              </span>
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            {mergedCount} merged PR(s) verified
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase">
            Requirements for Next Level:
          </h3>
          {progression.requirementsForNextLevel.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {progression.requirementsForNextLevel.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-emerald-400 font-mono">
              All criteria satisfied. Outstanding contribution history!
            </p>
          )}
        </div>
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
