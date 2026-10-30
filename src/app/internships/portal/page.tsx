import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getInternshipPortalData } from "@/lib/internships/service";
import { WorkLogForm } from "./WorkLogForm";

export const metadata = {
  title: "Fellowship Contributor Portal — TechNexusOrg",
  description:
    "Track milestones, submit weekly work logs, and review mentor evaluations.",
};

export const dynamic = "force-dynamic";

export default async function InternshipPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/join");
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    redirect("/join");
  }

  const portalData = await getInternshipPortalData(sessionUser.id);

  if (!portalData) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100">
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-400 text-2xl mb-4 border border-slate-700">
            📋
          </div>
          <h1 className="text-2xl font-bold font-mono text-white">
            No Active Fellowship Enrollment
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            You do not currently have an active fellowship enrollment. Explore
            our supervised engineering tracks and apply to an upcoming cohort.
          </p>
          <div className="mt-6">
            <Link
              href="/internships"
              className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 font-mono"
            >
              Explore Fellowships →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { enrollment, program, mentor, milestones, workLogs, evaluation } =
    portalData;

  const isCompleted = enrollment.status === "completed";

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link
            href="/internships"
            className="hover:text-sky-400 transition-colors"
          >
            Fellowships
          </Link>
          <span>/</span>
          <span className="text-slate-200">Contributor Portal</span>
        </nav>

        {/* Portal Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                }`}
              >
                Status: {enrollment.status}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                Track: {program.track.replace("_", " ")}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                ⏱ {program.durationWeeks} Weeks
              </span>
            </div>

            {enrollment.offerHash && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/50">
                <span className="text-emerald-400">Offer Verified:</span>
                <span className="text-slate-300">
                  {enrollment.offerHash.slice(0, 12)}...
                </span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {program.title}
          </h1>

          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-3xl">
            {program.description}
          </p>

          {/* Assigned Mentor Card */}
          {mentor && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-3">
              {mentor.avatarUrl && (
                <img
                  src={mentor.avatarUrl}
                  alt={mentor.githubUsername}
                  className="h-10 w-10 rounded-full border border-slate-700"
                />
              )}
              <div>
                <div className="text-xs font-mono text-slate-400">
                  Assigned Engineering Mentor
                </div>
                <div className="text-sm font-semibold text-white">
                  {mentor.displayName || mentor.githubUsername} (@
                  {mentor.githubUsername})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mentor Evaluation Report (if evaluated) */}
        {evaluation && (
          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Graduation Evaluation
              </span>
              <span className="text-xs font-mono text-slate-400">
                Evaluated on{" "}
                {new Date(evaluation.evaluatedAt).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-xl font-bold font-mono text-white mb-4">
              Fellowship Performance Rubric
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Code Quality
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {evaluation.codeQualityScore} / 5
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Collaboration
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {evaluation.collaborationScore} / 5
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Punctuality
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {evaluation.punctualityScore} / 5
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Documentation
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {evaluation.documentationScore} / 5
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Initiative
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {evaluation.technicalInitiativeScore} / 5
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                Mentor Commendation & Feedback
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                &ldquo;{evaluation.overallFeedback}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Milestones Progress */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
          <h2 className="text-lg font-bold font-mono text-white mb-4">
            Fellowship Milestones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {milestones.map((ms: any) => (
              <div
                key={ms.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="text-xs font-mono text-sky-400 font-semibold mb-1">
                  Week {ms.weekNumber}
                </div>
                <div className="text-sm font-semibold text-white mb-2">
                  {ms.title}
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {ms.description}
                </p>
                <div className="border-t border-slate-800 pt-2">
                  <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                    Deliverables:
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    {((ms.requiredDeliverables as string[]) || []).map(
                      (d, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-sky-400">•</span>
                          <span>{d}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Logs Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submit Work Log */}
          {!isCompleted && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-bold font-mono text-white mb-1">
                Submit Weekly Work Log
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Record your hours and link merged or active GitHub PRs for
                maintainer review.
              </p>
              <WorkLogForm enrollmentId={enrollment.id} />
            </div>
          )}

          {/* Past Work Logs List */}
          <div
            className={`rounded-xl border border-slate-800 bg-slate-900/40 p-6 ${
              isCompleted ? "lg:col-span-2" : ""
            }`}
          >
            <h2 className="text-lg font-bold font-mono text-white mb-4">
              Submitted Work Logs ({workLogs.length})
            </h2>

            {workLogs.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-8">
                No work logs submitted yet. Submit your first weekly log using
                the form.
              </p>
            ) : (
              <div className="space-y-4">
                {workLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="font-semibold text-sky-400">
                        Week {log.weekNumber}
                      </span>
                      <span className="text-slate-500">
                        ⏱ {log.hoursSpent} hours logged
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {log.summary}
                    </p>

                    {((log.pullRequestUrls as string[]) || []).length > 0 && (
                      <div className="space-y-1 mb-2">
                        <div className="text-[10px] font-mono text-slate-500 uppercase">
                          Linked Pull Requests:
                        </div>
                        {((log.pullRequestUrls as string[]) || []).map(
                          (pr, i) => (
                            <div key={i}>
                              <a
                                href={pr}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-emerald-400 underline hover:text-emerald-300"
                              >
                                {pr}
                              </a>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {log.blockers && (
                      <div className="mt-2 text-xs text-amber-300 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                        <span className="font-semibold font-mono">
                          Blockers:{" "}
                        </span>
                        {log.blockers}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
