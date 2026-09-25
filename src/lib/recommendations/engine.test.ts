import { describe, it, expect } from "vitest";
import { recommendIssues, type IssueCandidate, type UserPreferences } from "./engine";

describe("Deterministic Issue Recommendation Engine", () => {
  const mockIssues: IssueCandidate[] = [
    {
      id: "iss_python_easy",
      projectId: "proj_1",
      projectName: "Python CLI Tools",
      githubRepo: "TechNexusOrg/python-tools",
      title: "Add unit tests for argument parser",
      bodySnippet: "Write pytest cases for cli args",
      htmlUrl: "https://github.com/TechNexusOrg/python-tools/issues/1",
      labels: ["good first issue", "python", "beginner"],
      difficulty: "beginner",
      estimatedEffort: "1–3 hours",
      skillsRequired: ["Python", "Git"],
      isGoodFirstIssue: true,
      isHelpWanted: true,
      primaryLanguage: "Python",
    },
    {
      id: "iss_rust_hard",
      projectId: "proj_2",
      projectName: "Core Engine",
      githubRepo: "TechNexusOrg/engine",
      title: "Optimize SIMD vector operations",
      bodySnippet: "SIMD instruction dispatch",
      htmlUrl: "https://github.com/TechNexusOrg/engine/issues/99",
      labels: ["advanced", "rust", "simd"],
      difficulty: "advanced",
      estimatedEffort: "2–4 days",
      skillsRequired: ["Rust"],
      isGoodFirstIssue: false,
      isHelpWanted: false,
      primaryLanguage: "Rust",
    },
    {
      id: "iss_ts_web",
      projectId: "proj_3",
      projectName: "Web Platform",
      githubRepo: "TechNexusOrg/platform",
      title: "Implement issue filtering controls",
      bodySnippet: "Add dropdown filters for language and effort",
      htmlUrl: "https://github.com/TechNexusOrg/platform/issues/25",
      labels: ["typescript", "react", "intermediate"],
      difficulty: "intermediate",
      estimatedEffort: "3–5 hours",
      skillsRequired: ["TypeScript", "React"],
      isGoodFirstIssue: false,
      isHelpWanted: true,
      primaryLanguage: "TypeScript",
    },
    {
      id: "iss_go_easy",
      projectId: "proj_4",
      projectName: "Go CLI Tools",
      githubRepo: "TechNexusOrg/go-tools",
      title: "Add error logging to CLI",
      bodySnippet: "Improve error formatting",
      htmlUrl: "https://github.com/TechNexusOrg/go-tools/issues/5",
      labels: ["beginner"],
      difficulty: "beginner",
      estimatedEffort: "2 hours",
      skillsRequired: ["Go"],
      isGoodFirstIssue: false,
      isHelpWanted: false,
      primaryLanguage: "Go",
    },
  ];

  it("prioritizes beginner Python good-first-issue for a beginner Python learner", () => {
    const preferences: UserPreferences = {
      skills: ["Python"],
      interests: ["CLI Tools"],
      experienceLevel: "beginner",
      preferredLanguages: ["Python"],
      contributionPreferences: ["good first issue"],
    };

    const recommended = recommendIssues(mockIssues, preferences);

    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended[0].issue.id).toBe("iss_python_easy");
    expect(recommended[0].score).toBeGreaterThan(recommended[1].score);
    expect(recommended[0].matchReasons).toContain("Targeted for beginner level");
    expect(recommended[0].matchReasons).toContain("Tagged as 'good first issue'");
    expect(recommended[0].matchReasons.some((r) => r.includes("Python"))).toBe(true);
  });

  it("prioritizes intermediate TypeScript issue for an intermediate frontend engineer", () => {
    const preferences: UserPreferences = {
      skills: ["TypeScript", "React"],
      interests: ["Web Platform"],
      experienceLevel: "intermediate",
      preferredLanguages: ["TypeScript"],
      contributionPreferences: ["features"],
    };

    const recommended = recommendIssues(mockIssues, preferences);

    expect(recommended[0].issue.id).toBe("iss_ts_web");
    expect(recommended[0].matchReasons.some((r) => r.includes("TypeScript"))).toBe(true);
    expect(recommended[0].matchReasons).toContain("Targeted for intermediate level");
  });

  it("ranks advanced Rust issue top for an advanced systems developer", () => {
    const preferences: UserPreferences = {
      skills: ["Rust"],
      interests: ["Engine"],
      experienceLevel: "advanced",
      preferredLanguages: ["Rust"],
      contributionPreferences: ["performance"],
    };

    const recommended = recommendIssues(mockIssues, preferences);

    expect(recommended[0].issue.id).toBe("iss_rust_hard");
    expect(recommended[0].matchReasons).toContain("Targeted for advanced level");
  });
});
