import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { IssueMarketplace, type MarketplaceIssue } from "./IssueMarketplace";

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
      bodySnippet: schema.issues.bodySnippet,
      htmlUrl: schema.issues.htmlUrl,
      labels: schema.issues.labels,
      difficulty: schema.issues.difficulty,
      estimatedEffort: schema.issues.estimatedEffort,
      skillsRequired: schema.issues.skillsRequired,
      isGoodFirstIssue: schema.issues.isGoodFirstIssue,
      isHelpWanted: schema.issues.isHelpWanted,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      primaryLanguage: schema.projects.primaryLanguage,
    })
    .from(schema.issues)
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(eq(schema.issues.state, "open"))
    .limit(100);

  const formattedIssues: MarketplaceIssue[] = openIssues.map((issue: any) => ({
    id: issue.id,
    title: issue.title,
    bodySnippet: issue.bodySnippet,
    htmlUrl: issue.htmlUrl,
    labels: issue.labels || [],
    difficulty: issue.difficulty as "beginner" | "intermediate" | "advanced",
    estimatedEffort: issue.estimatedEffort,
    skillsRequired: issue.skillsRequired || [],
    isGoodFirstIssue: issue.isGoodFirstIssue,
    isHelpWanted: issue.isHelpWanted,
    projectName: issue.projectName,
    githubRepo: issue.githubRepo,
    primaryLanguage: issue.primaryLanguage || "TypeScript",
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
          Contribution Marketplace
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Real issues from real repositories. Every task links directly to its GitHub source of truth.
        </p>
      </div>

      <IssueMarketplace initialIssues={formattedIssues} />
    </div>
  );
}
