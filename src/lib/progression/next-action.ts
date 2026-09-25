export type ContributionStage =
  | "no_profile"
  | "recommended"
  | "claimed"
  | "pr_opened"
  | "review_pending"
  | "changes_requested"
  | "approved"
  | "merged"
  | "verified";

export interface NextActionInfo {
  stage: ContributionStage;
  stageLabel: string;
  stageIndex: number; // 0 to 7
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  badgeColor: string;
}

export interface DetermineNextActionParams {
  isOnboarded: boolean;
  username: string;
  activeClaim?: {
    id: string;
    issueId: string;
    issueTitle: string;
    repo: string;
    expiresAt: Date;
  } | null;
  activePr?: {
    id: string;
    title: string;
    url: string;
    state: "open" | "approved" | "changes_requested" | "merged" | "closed";
    draft: boolean;
  } | null;
  latestContribution?: {
    id: string;
    verifiedAt: Date | null;
    prUrl: string;
  } | null;
}

export function determineNextAction(params: DetermineNextActionParams): NextActionInfo {
  // 1. Incomplete onboarding profile
  if (!params.isOnboarded) {
    return {
      stage: "no_profile",
      stageLabel: "Profile Setup",
      stageIndex: 0,
      title: "Complete Your Contributor Profile",
      description: "Set your experience level, programming languages, and interests to receive targeted issue recommendations.",
      actionText: "Complete Onboarding",
      actionHref: "/onboarding",
      badgeColor: "sky",
    };
  }

  // 2. Active pull request in flight
  if (params.activePr) {
    const pr = params.activePr;

    if (pr.state === "changes_requested") {
      return {
        stage: "changes_requested",
        stageLabel: "Changes Requested",
        stageIndex: 4,
        title: "Address Reviewer Feedback",
        description: "Maintainers have reviewed your PR and requested adjustments. Read the review comments and push updated commits.",
        actionText: "View Review Comments",
        actionHref: pr.url,
        badgeColor: "amber",
      };
    }

    if (pr.state === "approved") {
      return {
        stage: "approved",
        stageLabel: "Approved",
        stageIndex: 5,
        title: "PR Approved — Ready for Merge",
        description: "Your code review passed! The project maintainers will merge your pull request into the main branch shortly.",
        actionText: "Check Pull Request",
        actionHref: pr.url,
        badgeColor: "emerald",
      };
    }

    if (pr.state === "merged") {
      return {
        stage: "merged",
        stageLabel: "Merged",
        stageIndex: 6,
        title: "PR Merged — Verifying Proof of Work",
        description: "Your pull request was merged into the official repository! GitHub webhook verification is recording your contribution.",
        actionText: "View Contributor Passport",
        actionHref: `/people/${params.username}`,
        badgeColor: "emerald",
      };
    }

    // Default open PR
    return {
      stage: "review_pending",
      stageLabel: "In Review",
      stageIndex: 3,
      title: "Maintainer Review in Progress",
      description: "Your pull request is open and awaiting review from repository maintainers. Be prepared to answer questions or address feedback.",
      actionText: "View PR on GitHub",
      actionHref: pr.url,
      badgeColor: "indigo",
    };
  }

  // 3. Issue claimed, working on implementation
  if (params.activeClaim) {
    const remainingDays = Math.max(
      0,
      Math.ceil(
        (new Date(params.activeClaim.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return {
      stage: "claimed",
      stageLabel: "Working on Issue",
      stageIndex: 2,
      title: `Working on: ${params.activeClaim.issueTitle}`,
      description: `You have reserved this issue for ${remainingDays} more day(s). Follow the step-by-step contribution guide to push your code and open a PR.`,
      actionText: "Open Contribution Workspace",
      actionHref: `/issues/${params.activeClaim.issueId}`,
      badgeColor: "amber",
    };
  }

  // 4. Latest contribution verified
  if (params.latestContribution?.verifiedAt) {
    return {
      stage: "verified",
      stageLabel: "Verified Proof of Work",
      stageIndex: 7,
      title: "Latest Contribution Verified",
      description: "Your merged pull request is permanently verified on your Contributor Passport. Ready for your next engineering challenge?",
      actionText: "Claim Your Next Issue",
      actionHref: "/issues",
      badgeColor: "emerald",
    };
  }

  // 5. Ready to claim first/next issue
  return {
    stage: "recommended",
    stageLabel: "Ready to Contribute",
    stageIndex: 1,
    title: "Start Your Contribution",
    description: "Explore recommended open issues matched to your skill profile and reserve your first task.",
    actionText: "Browse Matched Issues",
    actionHref: "/issues",
    badgeColor: "sky",
  };
}
