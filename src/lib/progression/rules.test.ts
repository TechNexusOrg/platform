import { describe, it, expect } from "vitest";
import { evaluateProgression } from "./rules";

describe("Progression Rules Engine", () => {
  it("keeps a new non-onboarded user at explorer level", () => {
    const res = evaluateProgression("explorer", {
      prsOpened: 0,
      prsMerged: 0,
      issuesResolved: 0,
      reviewsCompleted: 0,
      projectsContributedCount: 0,
      isOnboarded: false,
    });

    expect(res.currentLevel).toBe("explorer");
    expect(res.eligibleLevel).toBe("explorer");
    expect(res.canPromote).toBe(false);
    expect(res.nextLevel).toBe("contributor");
    expect(res.requirementsForNextLevel).toContain("Complete profile onboarding");
    expect(res.requirementsForNextLevel).toContain(
      "Merge 1 legitimate pull request on an official project"
    );
  });

  it("promotes explorer to contributor once onboarded with 1 merged PR", () => {
    const res = evaluateProgression("explorer", {
      prsOpened: 1,
      prsMerged: 1,
      issuesResolved: 0,
      reviewsCompleted: 0,
      projectsContributedCount: 1,
      isOnboarded: true,
    });

    expect(res.eligibleLevel).toBe("contributor");
    expect(res.canPromote).toBe(true);
  });

  it("evaluates Active Contributor criteria strictly (>= 3 PRs)", () => {
    const notQuite = evaluateProgression("contributor", {
      prsOpened: 2,
      prsMerged: 2,
      issuesResolved: 0,
      reviewsCompleted: 0,
      projectsContributedCount: 1,
      isOnboarded: true,
    });
    expect(notQuite.eligibleLevel).toBe("contributor");
    expect(notQuite.canPromote).toBe(false);

    const qualified = evaluateProgression("contributor", {
      prsOpened: 3,
      prsMerged: 3,
      issuesResolved: 0,
      reviewsCompleted: 0,
      projectsContributedCount: 1,
      isOnboarded: true,
    });
    expect(qualified.eligibleLevel).toBe("active_contributor");
    expect(qualified.canPromote).toBe(true);
  });

  it("evaluates Core Contributor criteria (>= 10 PRs, >= 3 reviews, >= 2 projects)", () => {
    const res = evaluateProgression("active_contributor", {
      prsOpened: 12,
      prsMerged: 10,
      issuesResolved: 5,
      reviewsCompleted: 4,
      projectsContributedCount: 2,
      isOnboarded: true,
    });

    expect(res.eligibleLevel).toBe("core_contributor");
    expect(res.canPromote).toBe(true);
  });

  it("assigns maintainer level only when officially designated", () => {
    const res = evaluateProgression("core_contributor", {
      prsOpened: 50,
      prsMerged: 45,
      issuesResolved: 20,
      reviewsCompleted: 15,
      projectsContributedCount: 3,
      isOnboarded: true,
      isMaintainerAssigned: true,
    });

    expect(res.eligibleLevel).toBe("maintainer");
    expect(res.canPromote).toBe(true);
  });
});
