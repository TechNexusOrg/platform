import Link from "next/link";
import { getLivePlatformMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const metrics = await getLivePlatformMetrics();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Milestone Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/40 px-3.5 py-1 text-xs font-mono text-sky-300">
            <span className="flex h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Milestone: Founding 1,000 Cohort Active</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-mono uppercase">
            Build Real Software. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              Build Real Proof.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            TechNexusOrg helps students and early developers move from learning to real open-source engineering experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/founding-1000"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 transition-all font-mono"
            >
              Join Founding 1,000
            </Link>
            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800/80 transition-all"
            >
              Explore Projects
            </Link>
          </div>

          <p className="text-xs text-slate-500 font-mono pt-2">
            No certificate selling. Every credential is built on verified GitHub evidence.
          </p>
        </div>

        {/* Live Metrics Grid (100% Real DB Data) */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
            <div className="font-mono text-3xl font-bold text-white">
              {metrics.totalContributors}
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">Contributors Joined</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
            <div className="font-mono text-3xl font-bold text-emerald-400">
              {metrics.totalFirstPrsMerged}
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">First PRs Merged</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
            <div className="font-mono text-3xl font-bold text-sky-400">
              {metrics.totalMergedPrs}
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">Verified PRs Merged</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
            <div className="font-mono text-3xl font-bold text-amber-400">
              {metrics.foundingMembersCount} / 1,000
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">Founding Members</div>
          </div>
        </div>

        {/* The Concrete Pathway */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-400">
              The Verified Progression Pipeline
            </h2>
            <p className="mt-2 text-2xl font-bold text-white tracking-tight">
              First PR → Verified Contributor → Core Contributor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 border border-sky-500/30 text-xs font-mono font-bold text-sky-400">
                  01
                </span>
                <h3 className="font-semibold text-white">#FirstPR</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your GitHub, discover curated good-first-issues in official TechNexusOrg repositories, and merge your first real open-source pull request.
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Evidence: Canonical GitHub PR merge commit
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
                  02
                </span>
                <h3 className="font-semibold text-white">Verified Contributor</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consistent contributions across projects. Multiple merged pull requests, passing automated CI checks, and rigorous maintainer reviews.
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Evidence: Multi-repo contribution history
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold text-purple-400">
                  03
                </span>
                <h3 className="font-semibold text-white">Core Contributor</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Demonstrated architecture ownership, active peer code reviews, mentoring new contributors, and community stewardship.
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Evidence: Code reviews & repo responsibility
              </div>
            </div>
          </div>
        </div>

        {/* Real Product Philosophy */}
        <div className="mt-20 max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 text-center space-y-4">
          <h3 className="text-lg font-bold text-white">
            GitHub Evidence is the Source of Truth
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            TechNexusOrg credentials cannot be purchased or awarded by referral loops. Every Contributor Passport and credential links directly to immutable GitHub commits, issues, and merged pull requests.
          </p>
          <div className="pt-2">
            <Link
              href="/first-pr"
              className="text-xs font-mono text-sky-400 hover:text-sky-300 underline underline-offset-4"
            >
              Learn about the #FirstPR program →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
