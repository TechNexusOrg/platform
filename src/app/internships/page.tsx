import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { listInternshipPrograms, getInternshipPortalData } from "@/lib/internships/service";
import { Navbar } from "@/components/Navbar";
import { ApplyModal } from "./ApplyModal";

export const metadata = {
  title: "Engineering Fellowships & Internships — TechNexusOrg",
  description:
    "Supervised, project-based engineering internships backed by verified deliverables, maintainer mentorship, and cryptographically verifiable credentials.",
};

export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const programs = await listInternshipPrograms();
  const portalData = user ? await getInternshipPortalData(user.id) : null;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Banner if enrolled */}
        {portalData?.enrollment && (
          <div className="mb-8 rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 sm:p-6 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Active Fellowship Enrollment: {portalData.program.title}</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Access your milestones, submit weekly work logs, and track mentor evaluations in your Contributor Portal.
              </p>
            </div>
            <Link
              href="/internships/portal"
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-mono font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              Open Contributor Portal →
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Supervised Open-Source Apprenticeships
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
            Engineering Fellowships
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-400 leading-relaxed">
            Move beyond certificates and tutorial clones. Work as an apprentice software engineer
            under experienced open-source maintainers. Ship real pull requests, defend your architectural choices,
            and build undeniable proof of work.
          </p>
          <div className="mt-6">
            <ApplyModal programs={programs} isLoggedIn={!!user} />
          </div>
        </div>

        {/* Invariant Highlights */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="font-mono text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
              01. Real Repositories
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every deliverable is an actual pull request merged into official TechNexusOrg repositories. Zero fake metrics or toy projects.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              02. 1-on-1 Mentorship
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Assigned engineering maintainers review your PRs, provide weekly code critique, and unblock architectural bottlenecks.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="font-mono text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
              03. Cryptographic Proof
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Offers and graduation credentials contain tamper-evident SHA-256 verification hashes verifiable by employers and universities.
            </p>
          </div>
        </div>

        {/* Programs Catalog */}
        <div className="mt-16 space-y-10">
          <h2 className="text-2xl font-bold font-mono text-white">
            Available Fellowship Programs
          </h2>

          <div className="grid grid-cols-1 gap-8">
            {programs.map((program) => (
              <div
                key={program.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      Track: {program.track.replace("_", " ")}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                      ⏱ {program.durationWeeks} Weeks Duration
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                      🎯 {program.milestones.length} Structured Milestones
                    </span>
                  </div>

                  {program.cohorts[0] && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      Next Cohort: {program.cohorts[0].name}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                  {program.title}
                </h3>

                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
                  {program.description}
                </p>

                {/* Outcomes & Prerequisites */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/80">
                  <div>
                    <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                      Target Learning Outcomes
                    </h4>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5">
                      {program.learningOutcomes.map((outcome: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 mb-2">
                      Eligibility & Prerequisites
                    </h4>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5">
                      {program.prerequisites.map((prereq: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Milestone Progression Timeline */}
                <div className="mt-6 pt-6 border-t border-slate-800/80">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Fellowship Milestones
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {program.milestones.map((ms: any) => (
                      <div
                        key={ms.id}
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5"
                      >
                        <div className="text-[11px] font-mono text-sky-400 mb-1">
                          Week {ms.weekNumber}
                        </div>
                        <div className="text-xs font-semibold text-white mb-1.5 line-clamp-1">
                          {ms.title}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {ms.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
