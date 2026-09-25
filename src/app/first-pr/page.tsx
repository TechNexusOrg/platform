import Link from "next/link";
import { getLivePlatformMetrics } from "@/lib/metrics";
import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "#FirstPR Program — TechNexusOrg",
  description:
    "Make your first legitimate open-source contribution to official TechNexusOrg repositories. Verified proof of work.",
};

export default async function FirstPRPage() {
  const metrics = await getLivePlatformMetrics();
  const db = await getDb();

  const recentFirstPrs = await db
    .select({
      id: schema.contributions.id,
      prNumber: schema.contributions.githubPrNumber,
      prTitle: schema.contributions.prTitle,
      prUrl: schema.contributions.prUrl,
      mergedAt: schema.contributions.mergedAt,
      username: schema.users.githubUsername,
      displayName: schema.users.displayName,
      avatarUrl: schema.users.avatarUrl,
      repo: schema.projects.githubRepo,
    })
    .from(schema.contributions)
    .innerJoin(schema.users, eq(schema.contributions.userId, schema.users.id))
    .innerJoin(schema.projects, eq(schema.contributions.projectId, schema.projects.id))
    .where(and(eq(schema.contributions.isFirstPr, true), eq(schema.contributions.state, "merged")))
    .orderBy(desc(schema.contributions.mergedAt))
    .limit(10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/40 px-3.5 py-1 text-xs font-mono text-sky-300">
          Flagship Initiative: #FirstPR
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
          Your First Legitimate Contribution
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Open-source can feel intimidating. The #FirstPR initiative provides curated beginner issues, active review feedback, and verifiable GitHub-backed proof of work upon merge.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-white">
            {metrics.totalFirstPrsMerged}
          </div>
          <div className="text-xs text-slate-400 mt-1">First PRs Merged to Date</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-emerald-400">
            {metrics.totalOfficialProjects}
          </div>
          <div className="text-xs text-slate-400 mt-1">Active Official Projects</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-sky-400">100%</div>
          <div className="text-xs text-slate-400 mt-1">GitHub Verified Evidence</div>
        </div>
      </div>

      {/* Step by Step Execution Path */}
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider text-center">
          How to Complete #FirstPR
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
            <span className="font-mono text-xs text-sky-400 font-bold">STEP 01</span>
            <h3 className="font-bold text-white text-sm">Authenticate</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect with your GitHub account so our platform can track and verify your pull request.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
            <span className="font-mono text-xs text-sky-400 font-bold">STEP 02</span>
            <h3 className="font-bold text-white text-sm">Pick an Issue</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browse issues marked <code className="text-sky-300 font-mono">good first issue</code> in the TechNexusOrg marketplace.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
            <span className="font-mono text-xs text-sky-400 font-bold">STEP 03</span>
            <h3 className="font-bold text-white text-sm">Submit PR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fork the repo, branch, write clean code with tests, and submit your pull request on GitHub.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
            <span className="font-mono text-xs text-emerald-400 font-bold">STEP 04</span>
            <h3 className="font-bold text-white text-sm">Review & Proof</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon maintainer review and merge, your First PR Merged Credential and Contributor Level are minted automatically.
            </p>
          </div>
        </div>

        <div className="text-center pt-6">
          <Link
            href="/issues"
            className="rounded-lg bg-sky-500 px-6 py-3 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 transition-colors"
          >
            Browse Good First Issues →
          </Link>
        </div>
      </div>

      {/* Live Recent Graduates */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Recent #FirstPR Graduates
        </h2>

        {recentFirstPrs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">
              No #FirstPR completions recorded yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Be the first contributor to merge a pull request and claim permanent proof of work!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentFirstPrs.map((grad: any) => (
              <div
                key={grad.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3"
              >
                <div className="flex items-center gap-3">
                  {grad.avatarUrl && (
                    <img
                      src={grad.avatarUrl}
                      alt={grad.username}
                      className="h-8 w-8 rounded-full border border-slate-700"
                    />
                  )}
                  <div>
                    <Link
                      href={`/people/${grad.username}`}
                      className="text-xs font-bold text-white hover:text-sky-300 transition-colors"
                    >
                      {grad.displayName || grad.username}
                    </Link>
                    <div className="text-[10px] font-mono text-slate-400">
                      PR #{grad.prNumber} in {grad.repo}
                    </div>
                  </div>
                </div>

                <a
                  href={grad.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-sky-400 hover:text-sky-300"
                >
                  GitHub PR ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
