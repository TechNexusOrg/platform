export interface IssueCandidate {
  id: string;
  projectId: string;
  projectName: string;
  githubRepo: string;
  title: string;
  bodySnippet: string | null;
  htmlUrl: string;
  labels: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedEffort: string | null;
  skillsRequired: string[];
  isGoodFirstIssue: boolean;
  isHelpWanted: boolean;
  primaryLanguage: string;
}

export interface UserPreferences {
  skills: string[];
  interests: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredLanguages: string[];
  contributionPreferences: string[];
}

export interface RecommendedIssue {
  issue: IssueCandidate;
  score: number;
  matchReasons: string[];
}

export function recommendIssues(
  issues: IssueCandidate[],
  preferences: UserPreferences,
  limit = 10
): RecommendedIssue[] {
  const userSkillsLower = new Set(preferences.skills.map((s) => s.toLowerCase()));
  const userInterestsLower = new Set(preferences.interests.map((i) => i.toLowerCase()));
  const userLangsLower = new Set(preferences.preferredLanguages.map((l) => l.toLowerCase()));

  const scored: RecommendedIssue[] = [];

  for (const issue of issues) {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Difficulty & Experience Level Alignment (Max 25 pts)
    if (issue.difficulty === preferences.experienceLevel) {
      score += 25;
      matchReasons.push(`Targeted for ${preferences.experienceLevel} level`);
    } else if (
      preferences.experienceLevel === "intermediate" &&
      issue.difficulty === "beginner"
    ) {
      score += 15;
      matchReasons.push("Quick win for intermediate level");
    }

    // 2. Beginner Good-First-Issue Bonus (20 pts)
    if (preferences.experienceLevel === "beginner" && issue.isGoodFirstIssue) {
      score += 20;
      matchReasons.push("Tagged as 'good first issue'");
    }

    // 3. Primary Language Match (20 pts)
    if (
      userLangsLower.has(issue.primaryLanguage.toLowerCase()) ||
      userSkillsLower.has(issue.primaryLanguage.toLowerCase())
    ) {
      score += 20;
      matchReasons.push(`Primary repository language matches '${issue.primaryLanguage}'`);
    }

    // 4. Skills Match (10 pts per matching skill, max 30 pts)
    const matchingSkills: string[] = [];
    for (const skill of issue.skillsRequired) {
      if (userSkillsLower.has(skill.toLowerCase())) {
        matchingSkills.push(skill);
      }
    }
    if (matchingSkills.length > 0) {
      const skillScore = Math.min(30, matchingSkills.length * 10);
      score += skillScore;
      matchReasons.push(`Matches your skills: ${matchingSkills.join(", ")}`);
    }

    // 5. Help Wanted Flag (10 pts)
    if (issue.isHelpWanted) {
      score += 10;
      matchReasons.push("Actively seeking community maintainer help");
    }

    // 6. Interest Alignment (10 pts)
    for (const interest of userInterestsLower) {
      if (
        issue.projectName.toLowerCase().includes(interest) ||
        issue.title.toLowerCase().includes(interest) ||
        (issue.bodySnippet && issue.bodySnippet.toLowerCase().includes(interest))
      ) {
        score += 10;
        matchReasons.push(`Aligns with your interest in '${interest}'`);
        break;
      }
    }

    scored.push({
      issue,
      score,
      matchReasons: matchReasons.length > 0 ? matchReasons : ["Open for contribution"],
    });
  }

  // Sort descending by score, tiebreak by id
  scored.sort((a, b) => b.score - a.score || a.issue.id.localeCompare(b.issue.id));

  return scored.slice(0, limit);
}
