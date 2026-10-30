import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  Code2,
  GitPullRequest,
  ExternalLink,
  ShieldCheck,
  Terminal,
  ArrowRight,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Code2 className="h-4 w-4" />
            <span>High-Standard Open Source</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
            Official Projects
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Every official TechNexusOrg project adheres to rigorous open-source
            standards: comprehensive CI test suites, strict linting,
            architecture documentation, and responsive maintainership.
          </p>
        </div>

        {/* Quality Standard Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bento-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">
                Automated CI Gates
              </div>
              <div className="text-[11px] text-slate-400">
                Strict TypeScript &amp; test suites
              </div>
            </div>
          </div>

          <div className="bento-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">
                Curated Issues
              </div>
              <div className="text-[11px] text-slate-400">
                Scoped good-first-issues
              </div>
            </div>
          </div>

          <div className="bento-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <GitPullRequest className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">
                Maintainer Reviews
              </div>
              <div className="text-[11px] text-slate-400">
                Constructive feedback on PRs
              </div>
            </div>
          </div>
        </div>

        {officialProjects.length === 0 ? (
          <div className="bento-card p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="font-mono text-xs text-sky-400 uppercase tracking-wider">
              Repository Quality Gate
            </div>
            <h2 className="text-xl font-bold text-white font-mono">
              TechNexusOrg Core Projects
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The core platform repository (
              <code className="text-sky-300 font-mono">
                TechNexusOrg/platform
              </code>
              ) is the primary foundation project. Official starter templates
              and micro-tools are deployed through maintainer verification.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/TechNexusOrg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 transition-colors shadow-md shadow-sky-500/20"
              >
                <span>Explore TechNexusOrg on GitHub</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialProjects.map((project: any) => (
              <div
                key={project.id}
                className="bento-card p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                      {project.primaryLanguage || "TypeScript"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 capitalize">
                      {project.difficulty?.replace("_", " ") || "All levels"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {project.description ||
                      "Official TechNexusOrg repository and platform component."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    {project.openIssuesCount || 0} open issue(s)
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/issues"
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>Issues</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <a
                      href={`https://github.com/${project.githubRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
