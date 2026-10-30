import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { listTracks } from "@/lib/learning/service";
import { listInternshipPrograms } from "@/lib/internships/service";
import {
  BookOpen,
  Briefcase,
  GitPullRequest,
  ArrowRight,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Engineering Programmes & Tracks — TechNexusOrg",
  description:
    "Curated technical curriculum, 8-week engineering fellowships, and open-source contribution pathways.",
};

export const dynamic = "force-dynamic";

export default async function ProgrammesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const tracks = await listTracks({ userId: user?.id, publishedOnly: true });
  const fellowships = await listInternshipPrograms();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Engineering Pathways
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
            Structured Programmes &amp; <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              Technical Fellowships
            </span>
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Move from textbook theory to production software engineering. Choose
            between self-paced technical modules or supervised 8-week
            open-source fellowship cohorts.
          </p>
        </div>

        {/* Section 1: Supervised 8-Week Fellowships */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                <Briefcase className="h-4 w-4" />
                <span>Supervised Cohorts</span>
              </div>
              <h2 className="text-2xl font-bold text-white font-mono mt-1">
                8-Week Engineering Fellowships
              </h2>
            </div>
            <Link
              href="/internships"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300"
            >
              <span>View Cohort Details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fellowships.map((f) => (
              <div
                key={f.id}
                className="bento-card p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                      {f.cohorts[0]?.cohortIdentifier ||
                        f.track.replace("_", " ")}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {f.durationWeeks} Weeks
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight">
                    <Link
                      href="/internships"
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {f.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {f.description}
                  </p>

                  {f.prerequisites.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {f.prerequisites.map((prereq: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {prereq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">
                    Cohort Capacity: {f.cohorts[0]?.maxParticipants || 15}{" "}
                    Fellows
                  </span>
                  <Link
                    href="/internships"
                    className="inline-flex items-center gap-1 font-mono text-sky-400 hover:text-sky-300"
                  >
                    <span>Apply to Cohort</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Self-Paced Learning Tracks */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>Self-Paced Curriculum</span>
              </div>
              <h2 className="text-2xl font-bold text-white font-mono mt-1">
                Core Engineering Tracks
              </h2>
            </div>
            <Link
              href="/learn"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300"
            >
              <span>Explore Curriculum Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bento-card p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider ${
                        track.difficulty === "beginner"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : track.difficulty === "intermediate"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                      }`}
                    >
                      {track.difficulty}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ⏱ {track.estimatedHours} hrs • {track.lessonCount} lessons
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

                  {track.prerequisites.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Prerequisites: {track.prerequisites.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">
                    Capstone Verification Included
                  </span>
                  <Link
                    href={`/learn/${track.slug}`}
                    className="inline-flex items-center gap-1 font-mono text-sky-400 hover:text-sky-300"
                  >
                    <span>Start Track</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: #FirstPR Starter Track */}
        <div className="bento-card p-8 bg-gradient-to-r from-sky-950/30 via-slate-900/60 to-emerald-950/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
              <GitPullRequest className="h-4 w-4" />
              <span>Step 01 for Every Student</span>
            </div>
            <h3 className="text-2xl font-bold text-white font-mono">
              The #FirstPR Initiative
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Never submitted a pull request to a production repository? We
              maintain curated good-first-issues with active maintainer reviews.
              Merge your first pull request and claim your official Founding
              1,000 Contributor status.
            </p>
          </div>
          <Link
            href="/first-pr"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-all shadow-md shadow-sky-500/20"
          >
            <span>Start #FirstPR Path</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
