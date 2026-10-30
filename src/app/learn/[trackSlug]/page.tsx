import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getTrackBySlug } from "@/lib/learning/service";

interface TrackPageProps {
  params: Promise<{
    trackSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TrackPageProps) {
  const { trackSlug } = await params;
  const track = await getTrackBySlug(trackSlug);
  if (!track) return { title: "Track Not Found — TechNexusOrg" };

  return {
    title: `${track.title} — TechNexusOrg Learning`,
    description: track.description,
  };
}

export default async function TrackDetailPage({ params }: TrackPageProps) {
  const { trackSlug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const track = await getTrackBySlug(trackSlug, user?.id);

  if (!track) {
    notFound();
  }

  // Find the first uncompleted lesson for "Continue" button
  let firstIncompleteLessonSlug = track.modules[0]?.lessons[0]?.slug;
  for (const mod of track.modules) {
    const uncompleted = mod.lessons.find((l) => !l.isCompleted);
    if (uncompleted) {
      firstIncompleteLessonSlug = uncompleted.slug;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link
            href="/learn"
            className="hover:text-emerald-400 transition-colors"
          >
            Tracks
          </Link>
          <span>/</span>
          <span className="text-slate-200">{track.title}</span>
        </nav>

        {/* Track Header Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2 mb-3">
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
              ⏱ {track.estimatedHours} Hours
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
              📚 {track.moduleCount} Modules • {track.lessonCount} Lessons
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {track.title}
          </h1>

          <p className="mt-3 text-base text-slate-300 leading-relaxed max-w-3xl">
            {track.description}
          </p>

          {/* User Progress Bar */}
          {user && (
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-slate-400">
                  {track.completedLessonsCount} of {track.lessonCount} lessons
                  completed
                </span>
                <span className="font-semibold text-emerald-400">
                  {track.progressPercentage}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${track.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Action CTA */}
          <div className="mt-6 flex flex-wrap gap-4">
            {firstIncompleteLessonSlug && (
              <Link
                href={`/learn/${track.slug}/${firstIncompleteLessonSlug}`}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all font-mono"
              >
                {track.progressPercentage && track.progressPercentage > 0
                  ? "Resume Track →"
                  : "Start Learning →"}
              </Link>
            )}
          </div>
        </div>

        {/* Learning Objectives & Prerequisites */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
            <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              Learning Objectives
            </h3>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-2">
              {track.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
            <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-sky-400 mb-3">
              Prerequisites
            </h3>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-2">
              {track.prerequisites.map((prereq, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold mt-0.5">•</span>
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modules & Syllabus */}
        <div className="mt-10">
          <h2 className="text-xl font-bold font-mono text-white mb-6">
            Curriculum Syllabus
          </h2>

          <div className="space-y-6">
            {track.modules.map((module, modIdx) => (
              <div
                key={module.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                      Module {modIdx + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-1">
                      {module.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      {module.description}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                    {module.lessons.length} lessons
                  </span>
                </div>

                <div className="divide-y divide-slate-800/50">
                  {module.lessons.map((lesson, lesIdx) => (
                    <Link
                      key={lesson.id}
                      href={`/learn/${track.slug}/${lesson.slug}`}
                      className="group flex items-center justify-between p-4 sm:px-6 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-mono font-medium ${
                            lesson.isCompleted
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {lesson.isCompleted ? "✓" : lesIdx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500">
                              ⏱ {lesson.estimatedMinutes} min
                            </span>
                            {lesson.hasAssignment && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                Practical Assignment
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-mono text-slate-500 group-hover:text-emerald-400 transition-colors">
                        Start →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
