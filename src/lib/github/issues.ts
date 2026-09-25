import { getGitHubClient, checkRateLimit } from "./client";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface ParsedIssueMetadata {
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedEffort: string | null;
  skillsRequired: string[];
  isGoodFirstIssue: boolean;
  isHelpWanted: boolean;
}

const KNOWN_SKILLS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Docker",
  "Linux",
  "Git",
  "Tailwind",
  "CI/CD",
  "GraphQL",
  "REST",
];

export function parseIssueLabels(labels: Array<{ name?: string } | string>): ParsedIssueMetadata {
  const labelNames = labels
    .map((l) => (typeof l === "string" ? l : l.name || ""))
    .filter(Boolean);

  const lowerLabels = labelNames.map((l) => l.toLowerCase());

  let difficulty: "beginner" | "intermediate" | "advanced" = "beginner";
  if (lowerLabels.some((l) => l.includes("advanced") || l.includes("hard") || l.includes("complex"))) {
    difficulty = "advanced";
  } else if (lowerLabels.some((l) => l.includes("intermediate") || l.includes("medium"))) {
    difficulty = "intermediate";
  } else if (lowerLabels.some((l) => l.includes("beginner") || l.includes("easy") || l.includes("good first"))) {
    difficulty = "beginner";
  }

  const isGoodFirstIssue = lowerLabels.some(
    (l) => l.includes("good first issue") || l.includes("good-first-issue")
  );
  const isHelpWanted = lowerLabels.some(
    (l) => l.includes("help wanted") || l.includes("help-wanted")
  );

  // Extract estimated effort if labeled, e.g. "effort: 2-4 hours"
  let estimatedEffort: string | null = null;
  const effortLabel = labelNames.find((l) => l.toLowerCase().startsWith("effort:"));
  if (effortLabel) {
    estimatedEffort = effortLabel.split(":")[1]?.trim() || null;
  } else if (difficulty === "beginner") {
    estimatedEffort = "1–3 hours";
  } else if (difficulty === "intermediate") {
    estimatedEffort = "3–8 hours";
  } else {
    estimatedEffort = "1–2 days";
  }

  // Extract skills from labels
  const skillsRequired: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    if (lowerLabels.some((l) => l.includes(skill.toLowerCase()))) {
      skillsRequired.push(skill);
    }
  }

  return {
    difficulty,
    estimatedEffort,
    skillsRequired,
    isGoodFirstIssue,
    isHelpWanted,
  };
}

export async function syncRepositoryIssues(
  owner: string,
  repo: string,
  userToken?: string
): Promise<{ syncedCount: number; rateLimitRemaining?: number }> {
  const octokit = getGitHubClient(userToken);
  const rateLimit = await checkRateLimit(octokit);

  if (rateLimit && rateLimit.remaining < 5) {
    throw new Error(
      `GitHub API rate limit exhausted. Resets at ${rateLimit.resetDate.toISOString()}`
    );
  }

  // 1. Fetch repository metadata
  const { data: repoData } = await octokit.rest.repos.get({
    owner,
    repo,
  });

  const db = await getDb();
  const repoFullName = repoData.full_name;

  // Upsert project
  const existingProjects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.githubRepo, repoFullName))
    .limit(1);

  let projectId: string;
  if (existingProjects.length > 0) {
    projectId = existingProjects[0].id;
    await db
      .update(schema.projects)
      .set({
        name: repoData.name,
        description: repoData.description || "Official TechNexusOrg repository",
        primaryLanguage: repoData.language || "TypeScript",
        starsCount: repoData.stargazers_count,
        forksCount: repoData.forks_count,
        openIssuesCount: repoData.open_issues_count,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));
  } else {
    projectId = `proj_${crypto.randomUUID()}`;
    await db.insert(schema.projects).values({
      id: projectId,
      name: repoData.name,
      slug: repoData.name.toLowerCase(),
      githubRepo: repoFullName,
      description: repoData.description || "Official TechNexusOrg repository",
      primaryLanguage: repoData.language || "TypeScript",
      languages: repoData.language ? [repoData.language] : [],
      isOfficial: true,
      starsCount: repoData.stargazers_count,
      forksCount: repoData.forks_count,
      openIssuesCount: repoData.open_issues_count,
    });
  }

  // 2. Fetch issues (excluding pull requests)
  const { data: issuesData } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 50,
  });

  let syncedCount = 0;

  for (const ghIssue of issuesData) {
    // GitHub API includes pull requests in issues endpoint; filter them out
    if (ghIssue.pull_request) {
      continue;
    }

    const metadata = parseIssueLabels(ghIssue.labels);
    const labelStrings = ghIssue.labels
      .map((l) => (typeof l === "string" ? l : l.name || ""))
      .filter(Boolean);

    // If no explicit skills found in labels, add primary language
    const finalSkills =
      metadata.skillsRequired.length > 0
        ? metadata.skillsRequired
        : repoData.language
        ? [repoData.language]
        : [];

    const existingIssue = await db
      .select()
      .from(schema.issues)
      .where(eq(schema.issues.githubIssueId, ghIssue.id))
      .limit(1);

    if (existingIssue.length > 0) {
      await db
        .update(schema.issues)
        .set({
          title: ghIssue.title,
          bodySnippet: ghIssue.body ? ghIssue.body.substring(0, 300) : null,
          state: ghIssue.state === "closed" ? "closed" : "open",
          labels: labelStrings,
          difficulty: metadata.difficulty,
          estimatedEffort: metadata.estimatedEffort,
          skillsRequired: finalSkills,
          isGoodFirstIssue: metadata.isGoodFirstIssue,
          isHelpWanted: metadata.isHelpWanted,
          updatedAt: new Date(),
        })
        .where(eq(schema.issues.id, existingIssue[0].id));
    } else {
      await db.insert(schema.issues).values({
        id: `iss_${crypto.randomUUID()}`,
        projectId,
        githubIssueId: ghIssue.id,
        githubIssueNumber: ghIssue.number,
        title: ghIssue.title,
        bodySnippet: ghIssue.body ? ghIssue.body.substring(0, 300) : null,
        state: "open",
        htmlUrl: ghIssue.html_url,
        labels: labelStrings,
        difficulty: metadata.difficulty,
        estimatedEffort: metadata.estimatedEffort,
        skillsRequired: finalSkills,
        isGoodFirstIssue: metadata.isGoodFirstIssue,
        isHelpWanted: metadata.isHelpWanted,
      });
    }

    syncedCount++;
  }

  return { syncedCount, rateLimitRemaining: rateLimit?.remaining };
}
