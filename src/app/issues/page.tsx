import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contribution Marketplace — TechNexusOrg",
  description:
    "Discover verified issues across official TechNexusOrg repositories. Filter by difficulty, skills, and effort.",
};

export default async function IssuesPage() {
  const db = await getDb();

  const openIssues = await db
    .select({
      id: schema.issues.id,
      title: schema.issues.title,
      htmlUrl: schema.issues.htmlUrl,
      labels: schema.issues.labels,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      skillsRequired: schema.issues.skillsRequired,
      isGoodFirstIssue: schema.issues.isGoodFirstIssue,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.state, "open"))
    .limit(30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
          Contribution Marketplace
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Real issues from real repositories. Every task links directly to its GitHub source of truth.
        </p>
      </div>

      {openIssues.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="font-mono text-xs text-emerald-400 uppercase tracking-wider">
            Issue Pipeline
          </div>
          <h2 className="text-xl font-bold text-white font-mono">
            No Open Issues Synced Yet
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            As official repositories are registered and issues tagged with <code className="text-sky-300 font-mono">good first issue</code> or <code className="text-sky-300 font-mono">help wanted</code> are created on GitHub, they will appear here automatically via webhooks.
          </p>
          <div className="pt-2">
            <a
              href="https://github.com/TechNexusOrg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 transition-colors"
            >
              View GitHub Organization Issues →
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {openIssues.map((issue: any) => (
            <div
              key={issue.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {issue.githubRepo}
                  </span>
                  {issue.isGoodFirstIssue && (
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                      good first issue
                    </span>
                  )}
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-mono text-sky-300 capitalize">
                    {issue.difficulty}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {issue.title}
                </h3>
                {issue.skillsRequired && issue.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {issue.skillsRequired.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <a
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                >
                  View on GitHub →
                </a>
                {issue.estimatedEffort && (
                  <span className="text-[10px] font-mono text-slate-500">
                    Est: {issue.estimatedEffort}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
