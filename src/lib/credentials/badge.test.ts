import { describe, it, expect } from "vitest";
import { generateCredentialSvgBadge } from "./badge";

describe("Credential SVG Badge Generator", () => {
  it("generates active credential badge with correct colors and text", () => {
    const svg = generateCredentialSvgBadge("First PR Merged", "active");

    expect(svg).toContain("<svg");
    expect(svg).toContain("TechNexusOrg");
    expect(svg).toContain("First PR Merged ✓");
    expect(svg).toContain("#0284c7"); // sky-600
  });

  it("generates revoked credential badge with red warning color", () => {
    const svg = generateCredentialSvgBadge("Core Contributor", "revoked");

    expect(svg).toContain("Core Contributor (Revoked)");
    expect(svg).toContain("#b91c1c"); // red-700
  });

  it("calculates proportional width based on title length", () => {
    const shortSvg = generateCredentialSvgBadge("Short", "active");
    const longSvg = generateCredentialSvgBadge("Super Long Extended Title Credential", "active");

    const shortWidthMatch = shortSvg.match(/width="(\d+)"/);
    const longWidthMatch = longSvg.match(/width="(\d+)"/);

    expect(shortWidthMatch).not.toBeNull();
    expect(longWidthMatch).not.toBeNull();

    const shortWidth = parseInt(shortWidthMatch![1], 10);
    const longWidth = parseInt(longWidthMatch![1], 10);

    expect(longWidth).toBeGreaterThan(shortWidth);
  });
});
