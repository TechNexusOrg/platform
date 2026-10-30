import Link from "next/link";
import { getLivePlatformMetrics } from "@/lib/metrics";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { listTracks } from "@/lib/learning/service";
import {
  Terminal,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  Building2,
  Code2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const metrics = await getLivePlatformMetrics();

  // Fetch official projects and published learning tracks
  let officialProjects: any[] = [];
  try {
    const db = await getDb();
    officialProjects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.isOfficial, true))
      .limit(3);
  } catch {
    officialProjects = [];
  }

  const tracks = await listTracks({ publishedOnly: true }).catch(() => []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#07090e]">
      {/* Subtle background radial & grid */}
      <div className="absolute inset-0 subtle-radial pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Milestone Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-500/30 bg-sky-950/40 px-4 py-1.5 text-xs font-mono text-sky-300 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Milestone: Founding 1,000 Cohort Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold">
              {metrics.foundingMembersCount} / 1,000 Enrolled
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-mono uppercase leading-tight">
            Build Real Software. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
              Build Public Proof.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            India&apos;s student-led engineering &amp; open-source ecosystem.
            Move past tutorial hell and certificate mills to real GitHub pull
            requests, rigorous maintainer reviews, and cryptographically
            verifiable credentials.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/join"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-white/10 hover:bg-slate-200 transition-all font-mono"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Join with GitHub</span>
            </Link>
            <Link
              href="/issues"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-all font-mono"
            >
              <Terminal className="h-4 w-4 text-sky-400" />
              <span>Explore Issues</span>
            </Link>
            <Link
              href="/learn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-5 py-3.5 text-sm font-medium text-slate-400 hover:text-white hover:border-slate-700 transition-all font-mono"
            >
              <span>Curriculum</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="text-xs text-slate-500 font-mono pt-1">
            Zero certificate selling. GitHub evidence is the immutable source of
            truth.
          </p>
        </div>

        {/* Live Metrics Bento Grid (100% Real DB Data) */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bento-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white">
              {metrics.totalContributors}
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">
              Contributors Joined
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              Live verified accounts
            </div>
          </div>
          <div className="bento-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-emerald-400">
              {metrics.totalFirstPrsMerged}
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">
              #FirstPRs Merged
            </div>
            <div className="mt-2 text-[10px] font-mono text-emerald-500/80">
              Canonical git commits
            </div>
          </div>
          <div className="bento-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-sky-400">
              {metrics.totalMergedPrs}
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">
              Verified PRs Merged
            </div>
            <div className="mt-2 text-[10px] font-mono text-sky-500/80">
              Passing automated CI
            </div>
          </div>
          <div className="bento-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-amber-400">
              {metrics.foundingMembersCount} / 1,000
            </div>
            <div className="mt-1 text-xs text-slate-400 font-medium">
              Founding Members
            </div>
            <div className="mt-2 text-[10px] font-mono text-amber-500/80">
              Exclusive early registry
            </div>
          </div>
        </div>

        {/* Pipeline & Engineering Journey Visual */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-sky-400">
              <Sparkles className="h-4 w-4" />
              <span>Production Engineering Loop</span>
            </div>
            <h2 className="mt-2 text-3xl font-bold text-white tracking-tight font-mono">
              How TechNexus Works
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
              Every student follows the exact same workflow used by top
              distributed engineering teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-mono font-bold text-sky-400">
                  01
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  CLAIM
                </span>
              </div>
              <h3 className="font-semibold text-white font-mono text-sm">
                Discover &amp; Claim Issue
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse official repositories, claim an issue with an active
                reservation timer, and branch cleanly.
              </p>
            </div>

            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs font-mono font-bold text-teal-400">
                  02
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  BUILD
                </span>
              </div>
              <h3 className="font-semibold text-white font-mono text-sm">
                Pass Automated CI
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Write code, author Vitest tests, run TypeScript checks, and
                ensure GitHub Actions turn green.
              </p>
            </div>

            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
                  03
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  REVIEW
                </span>
              </div>
              <h3 className="font-semibold text-white font-mono text-sm">
                Maintainer Code Review
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive line-by-line feedback from core maintainers on
                architecture, safety, and efficiency.
              </p>
            </div>

            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold text-purple-400">
                  04
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  VERIFY
                </span>
              </div>
              <h3 className="font-semibold text-white font-mono text-sm">
                Ed25519 Cryptographic Proof
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Commit hashes are signed with Ed25519 asymmetric keys and
                verifiable worldwide via public JWKS.
              </p>
            </div>
          </div>
        </div>

        {/* Structured Progression Pipeline */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Contributor Progression Ladder
            </h2>
            <p className="mt-2 text-3xl font-bold text-white tracking-tight font-mono">
              Earn Rank Through Demonstrable Work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bento-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-mono font-bold text-sky-400">
                  Tier 1
                </span>
                <div>
                  <h3 className="font-semibold text-white font-mono">
                    #FirstPR Explorer
                  </h3>
                  <span className="text-[10px] font-mono text-sky-400 uppercase">
                    Requirement: 1 Merged PR
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your GitHub, pick a good-first-issue, and merge your
                first real open-source pull request. Validated by canonical
                merge commits.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                <span>Founding 1,000 badge eligible</span>
              </div>
            </div>

            <div className="bento-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
                  Tier 2
                </span>
                <div>
                  <h3 className="font-semibold text-white font-mono">
                    Verified Contributor
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">
                    Requirement: 3+ Merged PRs
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consistent contributions across multiple repositories.
                Demonstrates mastery of Git workflows, unit testing, and
                maintainer reviews.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Public Passport &amp; SVG Badge</span>
              </div>
            </div>

            <div className="bento-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold text-purple-400">
                  Tier 3
                </span>
                <div>
                  <h3 className="font-semibold text-white font-mono">
                    Core Maintainer / Fellow
                  </h3>
                  <span className="text-[10px] font-mono text-purple-400 uppercase">
                    Requirement: 10+ PRs &amp; Reviews
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Substantive architectural ownership, peer code reviews,
                community stewardship, and eligibility for supervised
                engineering fellowships.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                <span>Fellowship Offer &amp; Asymmetric Credential</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Curriculum Tracks */}
        {tracks.length > 0 && (
          <div className="mt-24 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider">
                  <BookOpen className="h-4 w-4" />
                  <span>Structured Learning Tracks</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1">
                  Master Production Engineering
                </h2>
              </div>
              <Link
                href="/learn"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300"
              >
                <span>View all tracks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tracks.slice(0, 2).map((track) => (
                <div
                  key={track.id}
                  className="bento-card p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {track.difficulty}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ⏱ {track.estimatedHours} hrs • {track.lessonCount}{" "}
                        lessons
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      <Link
                        href={`/learn/${track.slug}`}
                        className="hover:text-sky-400 transition-colors"
                      >
                        {track.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {track.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Capstone Included</span>
                    <Link
                      href={`/learn/${track.slug}`}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>Start Module</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Projects from Database */}
        {officialProjects.length > 0 && (
          <div className="mt-24 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  <Code2 className="h-4 w-4" />
                  <span>Official Repositories</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1">
                  Active Codebases
                </h2>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300"
              >
                <span>Browse all repositories</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {officialProjects.map((p) => (
                <div key={p.id} className="bento-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-sky-400 font-bold truncate">
                      {p.name}
                    </span>
                    {p.primaryLanguage && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {p.primaryLanguage}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {p.description ||
                      "Official TechNexusOrg core codebase and infrastructure tool."}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{p.githubRepo}</span>
                    <a
                      href={`https://github.com/${p.githubRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white"
                    >
                      GitHub →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cryptographic Trust & Verification Banner */}
        <div className="mt-24 max-w-5xl mx-auto bento-card p-8 sm:p-10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-sky-950/20 border border-slate-800/80">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Asymmetric Cryptographic Trust Model</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-mono">
                Immutable GitHub Commits. Not JPEG Certificates.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                TechNexusOrg credentials cannot be purchased, traded, or faked.
                Every credential carries an Ed25519 digital signature verified
                against our public JWKS endpoint at{" "}
                <span className="font-mono text-sky-400">/api/verify/keys</span>
                .
              </p>
            </div>
            <Link
              href="/verify/check"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-5 py-3 text-xs font-mono text-sky-300 hover:bg-sky-500/20 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Verify a Credential</span>
            </Link>
          </div>
        </div>

        {/* Institutional & University Collaboration CTA */}
        <div className="mt-16 max-w-5xl mx-auto bento-card p-8 border border-emerald-500/20 bg-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Building2 className="h-4 w-4" />
              <span>For Universities &amp; Technology Companies</span>
            </div>
            <h4 className="text-lg font-bold text-white font-mono">
              Partner With TechNexusOrg for Real Student Outcomes
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              Launch sponsored open-source cohorts, incorporate real project
              capstones into university curriculum, or hire candidates with
              verified public code.
            </p>
          </div>
          <Link
            href="/partners"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-mono font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
          >
            <span>Partner With Us</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
