import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { listTracks } from "@/lib/learning/service";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Learning Tracks — TechNexusOrg",
  description:
    "Structured, self-paced technical learning tracks designed to prepare students for real-world engineering and open-source contributions.",
};

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const tracks = await listTracks({ userId: user?.id, publishedOnly: true });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header section */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Curriculum Pilot
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
            Structured Learning Tracks
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-400 leading-relaxed">
            Bridge academic theory and production software engineering. Each track contains
            hands-on terminal exercises, internal architecture deep-dives, and verifiable capstone assignments.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {tracks.map((track) => {
            const isCompleted = track.enrollmentStatus === "completed";
            const isInProgress = track.enrollmentStatus === "in_progress";

            return (
              <div
                key={track.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-950/10"
              >
                <div>
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
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
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                      ⏱ {track.estimatedHours} hrs
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                      📚 {track.moduleCount} modules • {track.lessonCount} lessons
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    <Link
                      href={`/learn/${track.slug}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {track.title}
                    </Link>
                  </h2>

                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                    {track.description}
                  </p>

                  {/* Prerequisites Preview */}
                  {track.prerequisites.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800/60">
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
                        Prerequisites
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {track.prerequisites.map((prereq, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-600">•</span>
                            <span>{prereq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Progress & CTA */}
                <div className="mt-6 pt-6 border-t border-slate-800/80">
                  {user && track.enrollmentStatus ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-400">
                          {isCompleted
                            ? "Track Completed"
                            : `${track.completedLessonsCount || 0} of ${track.lessonCount} lessons completed`}
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {track.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-400" : "bg-sky-400"
                          }`}
                          style={{ width: `${track.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <Link
                    href={`/learn/${track.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 font-mono"
                  >
                    {isCompleted
                      ? "Review Track Syllabus →"
                      : isInProgress
                      ? "Continue Learning →"
                      : "Explore Syllabus →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
