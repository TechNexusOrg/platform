export type ContributorLevel =
  | "explorer"
  | "contributor"
  | "active_contributor"
  | "core_contributor"
  | "maintainer"
  | "project_lead"
  | "mentor";

export interface ContributorMetrics {
  prsOpened: number;
  prsMerged: number;
  issuesResolved: number;
  reviewsCompleted: number;
  projectsContributedCount: number;
  isOnboarded: boolean;
  isMaintainerAssigned?: boolean;
}

export interface ProgressionResult {
  currentLevel: ContributorLevel;
  eligibleLevel: ContributorLevel;
  canPromote: boolean;
  nextLevel: ContributorLevel | null;
  requirementsForNextLevel: string[];
}

export function evaluateProgression(
  currentLevel: ContributorLevel,
  metrics: ContributorMetrics
): ProgressionResult {
  let eligibleLevel: ContributorLevel = "explorer";

  if (metrics.isMaintainerAssigned) {
    eligibleLevel = "maintainer";
  } else if (
    metrics.prsMerged >= 10 &&
    metrics.reviewsCompleted >= 3 &&
    metrics.projectsContributedCount >= 2
  ) {
    eligibleLevel = "core_contributor";
  } else if (
    metrics.prsMerged >= 3 &&
    metrics.projectsContributedCount >= 1
  ) {
    eligibleLevel = "active_contributor";
  } else if (metrics.prsMerged >= 1 && metrics.isOnboarded) {
    eligibleLevel = "contributor";
  } else {
    eligibleLevel = "explorer";
  }

  // Determine next level requirements
  let nextLevel: ContributorLevel | null = null;
  const requirements: string[] = [];

  switch (currentLevel) {
    case "explorer":
      nextLevel = "contributor";
      if (!metrics.isOnboarded) requirements.push("Complete profile onboarding");
      if (metrics.prsMerged < 1) requirements.push("Merge 1 legitimate pull request on an official project");
      break;
    case "contributor":
      nextLevel = "active_contributor";
      if (metrics.prsMerged < 3) requirements.push(`Merge ${3 - metrics.prsMerged} more pull request(s) (total 3)`);
      if (metrics.projectsContributedCount < 1) requirements.push("Contribute to at least 1 official project");
      break;
    case "active_contributor":
      nextLevel = "core_contributor";
      if (metrics.prsMerged < 10) requirements.push(`Merge ${10 - metrics.prsMerged} more pull request(s) (total 10)`);
      if (metrics.reviewsCompleted < 3) requirements.push(`Complete ${3 - metrics.reviewsCompleted} peer code review(s)`);
      if (metrics.projectsContributedCount < 2) requirements.push("Contribute to at least 2 distinct projects");
      break;
    case "core_contributor":
      nextLevel = "maintainer";
      requirements.push("Demonstrated repository stewardship and official maintainer invitation");
      break;
    default:
      nextLevel = null;
  }

  const levelRank: Record<ContributorLevel, number> = {
    explorer: 0,
    contributor: 1,
    active_contributor: 2,
    core_contributor: 3,
    maintainer: 4,
    project_lead: 5,
    mentor: 4,
  };

  const canPromote = levelRank[eligibleLevel] > levelRank[currentLevel];

  return {
    currentLevel,
    eligibleLevel,
    canPromote,
    nextLevel,
    requirementsForNextLevel: requirements,
  };
}
