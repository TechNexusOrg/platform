import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Official Projects — TechNexusOrg",
  description:
    "Explore official TechNexusOrg open-source repositories designed for high-quality contributor onboarding.",
};

export default async function ProjectsPage() {
  const db = await getDb();

  const officialProjects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.isOfficial, true));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
          Official Projects
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Every official TechNexusOrg project adheres to rigorous open-source standards: comprehensive CI, strict test coverage, clear contributing guidelines, and responsive maintainership.
        </p>
      </div>

      {officialProjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="font-mono text-xs text-sky-400 uppercase tracking-wider">
            Repository Quality Gate
          </div>
          <h2 className="text-xl font-bold text-white font-mono">
            TechNexusOrg Core Projects
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The core platform repository (<code className="text-sky-300 font-mono">TechNexusOrg/platform</code>) is the primary foundation project. Official starter templates and micro-tools are deployed through maintainer verification.
          </p>
          <div className="pt-2">
            <a
              href="https://github.com/TechNexusOrg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 transition-colors"
            >
              Explore TechNexusOrg on GitHub →
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officialProjects.map((project: any) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                    {project.primaryLanguage}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 capitalize">
                    {project.difficulty.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-mono">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <a
                  href={`https://github.com/${project.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
                >
                  GitHub Repository →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
