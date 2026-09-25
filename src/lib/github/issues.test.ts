import { describe, it, expect } from "vitest";
import { parseIssueLabels } from "./issues";

describe("GitHub Issue Label Parser", () => {
  it("parses beginner good-first-issue correctly", () => {
    const meta = parseIssueLabels([
      "good first issue",
      "help wanted",
      "python",
      "docker",
      "effort: 1-2 hours",
    ]);

    expect(meta.difficulty).toBe("beginner");
    expect(meta.isGoodFirstIssue).toBe(true);
    expect(meta.isHelpWanted).toBe(true);
    expect(meta.estimatedEffort).toBe("1-2 hours");
    expect(meta.skillsRequired).toContain("Python");
    expect(meta.skillsRequired).toContain("Docker");
  });

  it("parses advanced issue and assigns default effort", () => {
    const meta = parseIssueLabels([
      { name: "advanced" },
      { name: "rust" },
      { name: "linux" },
    ]);

    expect(meta.difficulty).toBe("advanced");
    expect(meta.isGoodFirstIssue).toBe(false);
    expect(meta.skillsRequired).toContain("Rust");
    expect(meta.skillsRequired).toContain("Linux");
    expect(meta.estimatedEffort).toBe("1–2 days");
  });

  it("parses intermediate difficulty with medium tag", () => {
    const meta = parseIssueLabels(["medium", "typescript", "react"]);
    expect(meta.difficulty).toBe("intermediate");
    expect(meta.skillsRequired).toContain("TypeScript");
    expect(meta.skillsRequired).toContain("React");
  });
});
