"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActiveIssueClaim } from "@/lib/issues/claims";

interface IssueWorkspaceClientProps {
  issue: {
    id: string;
    title: string;
    body: string | null;
    bodySnippet: string | null;
    state: "open" | "closed";
    htmlUrl: string;
    labels: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedEffort: string | null;
    skillsRequired: string[];
    isGoodFirstIssue: boolean;
    isHelpWanted: boolean;
    githubIssueNumber: number;
  };
  project: {
    id: string;
    name: string;
    githubRepo: string;
    description: string;
    primaryLanguage: string;
    contributionEnabled: boolean;
  };
  currentUser: {
    id: string;
    githubUsername: string;
    displayName: string | null;
    avatarUrl: string | null;
    level: string;
  } | null;
  initialActiveClaim: ActiveIssueClaim | null;
  userActiveClaimsCount: number;
  userMaxClaims: number;
}

export function IssueWorkspaceClient({
  issue,
  project,
  currentUser,
  initialActiveClaim,
  userActiveClaimsCount,
  userMaxClaims,
}: IssueWorkspaceClientProps) {
  const router = useRouter();
  const [activeClaim, setActiveClaim] = useState<ActiveIssueClaim | null>(initialActiveClaim);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const isClaimedByMe = Boolean(currentUser && activeClaim && activeClaim.userId === currentUser.id);
  const isClaimedByOther = Boolean(activeClaim && (!currentUser || activeClaim.userId !== currentUser.id));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClaim = async () => {
    if (!currentUser) {
      window.location.href = "/api/auth/github";
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/claim`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim issue.");
      }

      setSuccessMessage("Issue successfully claimed! Your contribution workspace is now active.");
      setActiveClaim({
        id: data.claim.id,
        issueId: issue.id,
        userId: currentUser.id,
        status: "active",
        claimedAt: new Date(data.claim.claimedAt),
        expiresAt: new Date(data.claim.expiresAt),
        user: {
          id: currentUser.id,
          githubUsername: currentUser.githubUsername,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
        },
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to release this issue claim? Other contributors will be able to claim it.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/release`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to release claim.");
      }

      setSuccessMessage("Issue claim released.");
      setActiveClaim(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = activeClaim
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeClaim.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/issues" className="hover:text-sky-400 transition-colors flex items-center gap-1">
            <span>←</span>
            <span>Back to Marketplace</span>
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-semibold">{project.name}</span>
          <span>/</span>
          <span className="text-slate-500">#{issue.githubIssueNumber}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2.5 py-0.5 text-xs font-mono uppercase font-bold tracking-wider ${
                  issue.difficulty === "beginner"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : issue.difficulty === "intermediate"
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              >
                {issue.difficulty}
              </span>

              {issue.isGoodFirstIssue && (
                <span className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono text-emerald-300">
                  good first issue
                </span>
              )}

              {issue.estimatedEffort && (
                <span className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs font-mono text-slate-300">
                  ⏱ {issue.estimatedEffort}
                </span>
              )}

              <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-xs font-mono text-slate-400">
                {project.githubRepo}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight leading-tight">
              {issue.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={issue.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-mono font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors shadow-sm"
            >
              <span>GitHub Issue</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-300">
          ✕ {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-300">
          ✓ {successMessage}
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Body */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
                Issue Description
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Source: GitHub Issue #{issue.githubIssueNumber}
              </span>
            </div>

            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {issue.body || issue.bodySnippet || "No description provided in GitHub issue."}
            </div>

            {/* Labels and tags */}
            {issue.labels.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  GitHub Labels
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="rounded bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-xs font-mono text-slate-300"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Required Skills */}
            {issue.skillsRequired.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Relevant Skills & Stack
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {issue.skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-xs font-mono text-sky-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acceptance Criteria & Quality Standard */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              TechNexus Quality & Merge Requirements
            </h3>
            <div className="space-y-3 text-xs text-slate-300 font-mono">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>Code adheres to repository formatting, ESLint rules, and TypeScript strict mode.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>Unit and integration tests pass cleanly without regressions.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>Pull request references <code className="text-sky-300 font-bold">Fixes #{issue.githubIssueNumber}</code> in the PR description body.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">4.</span>
                <span>Maintainer review is approved before merge.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Claim & Contribution Workspace */}
        <div className="space-y-6">
          {/* Claim Action Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Claim Status
              </h3>
              <p className="text-xs text-slate-400">
                Claiming reserves this issue for 7 days while you implement the solution.
              </p>
            </div>

            {/* Status Indicator */}
            {isClaimedByMe ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ● ACTIVE CLAIM (YOU)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/80">
                    {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  You are actively working on this issue. Follow the guided steps below to submit your PR.
                </div>
                <button
                  type="button"
                  onClick={handleRelease}
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Release Claim Early"}
                </button>
              </div>
            ) : isClaimedByOther && activeClaim ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {activeClaim.user.avatarUrl ? (
                    <img
                      src={activeClaim.user.avatarUrl}
                      alt={activeClaim.user.githubUsername}
                      className="w-6 h-6 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300 font-mono">
                      @
                    </div>
                  )}
                  <span className="text-xs font-mono text-amber-200 font-bold">
                    Claimed by @{activeClaim.user.githubUsername}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Reserved for {daysRemaining} more day{daysRemaining === 1 ? "" : "s"}. If released or expired, it will become available again.
                </p>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-slate-800/60 border border-slate-800 py-2.5 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                >
                  Currently Claimed
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-2">
                  <div className="text-xs font-mono text-sky-300 font-semibold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Ready for Assignment</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This issue is open and ready to be claimed. Active claims last 7 days and can be released at any time without penalty.
                  </p>
                </div>

                {!currentUser ? (
                  <Link
                    href="/join"
                    className="w-full rounded-xl bg-sky-500 py-3 text-xs font-mono font-bold text-slate-950 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Sign in with GitHub to Claim</span>
                    <span>→</span>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleClaim}
                      disabled={loading || userActiveClaimsCount >= userMaxClaims}
                      className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-mono font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>{loading ? "Claiming..." : "Claim this issue"}</span>
                      <span>→</span>
                    </button>
                    {userActiveClaimsCount >= userMaxClaims && (
                      <p className="text-[11px] font-mono text-amber-400 text-center">
                        Active claim limit reached ({userActiveClaimsCount}/{userMaxClaims}). Release an existing claim first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Guided Contribution Steps Workspace */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                How to Complete This Contribution
              </h3>
              <span className="text-[10px] font-mono text-sky-400 font-semibold">
                Beginner-First Walkthrough
              </span>
            </div>

            <div className="space-y-6 text-xs font-mono">
              {/* Step 1-4: Setup */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-sky-400 border border-slate-700">
                    1–4
                  </span>
                  <span>Read, Claim & Fork</span>
                </div>
                <div className="space-y-1.5 pl-7 text-[11px] text-slate-400">
                  <p>1. Read the issue scope and acceptance criteria above carefully.</p>
                  <p>2. Claim this issue using the button above to reserve your 7-day slot.</p>
                  <p>3. Open <a href={`https://github.com/${project.githubRepo}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">https://github.com/{project.githubRepo}</a>.</p>
                  <p>4. Click <strong className="text-white">Fork</strong> in GitHub to create your own copy.</p>
                </div>
              </div>

              {/* Step 5-6: Clone & Branch */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-sky-400 border border-slate-700">
                    5–6
                  </span>
                  <span>Clone & Create Branch</span>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="text-slate-400 text-[11px]">
                    Clone your fork locally and create a dedicated branch:
                  </p>
                  <div className="relative group">
                    <pre className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-[11px] text-slate-300 overflow-x-auto">
                      git clone https://github.com/{currentUser?.githubUsername || "<your-username>"}/{project.name.toLowerCase()}.git{"\n"}
                      cd {project.name.toLowerCase()}{"\n"}
                      git checkout -b fix/issue-{issue.githubIssueNumber}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `git clone https://github.com/${currentUser?.githubUsername || "<your-username>"}/${project.name.toLowerCase()}.git && cd ${project.name.toLowerCase()} && git checkout -b fix/issue-${issue.githubIssueNumber}`,
                          "clone-step"
                        )
                      }
                      className="absolute top-2 right-2 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition-colors"
                    >
                      {copiedIndex === "clone-step" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 7-8: Implement & Test */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-sky-400 border border-slate-700">
                    7–8
                  </span>
                  <span>Implement & Run Tests</span>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="text-slate-400 text-[11px]">
                    Implement your code changes, then run project tests and type checks:
                  </p>
                  <div className="relative group">
                    <pre className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-[11px] text-slate-300 overflow-x-auto">
                      npm install{"\n"}
                      npm test{"\n"}
                      npm run typecheck
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard("npm test && npm run typecheck", "test-step")
                      }
                      className="absolute top-2 right-2 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition-colors"
                    >
                      {copiedIndex === "test-step" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 9-10: Commit & Push */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-sky-400 border border-slate-700">
                    9–10
                  </span>
                  <span>Commit & Push Branch</span>
                </div>
                <div className="space-y-2 pl-7">
                  <div className="relative group">
                    <pre className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-[11px] text-slate-300 overflow-x-auto">
                      git add .{"\n"}
                      git commit -m &quot;fix: resolve issue #{issue.githubIssueNumber}&quot;{"\n"}
                      git push origin fix/issue-{issue.githubIssueNumber}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `git add . && git commit -m "fix: resolve issue #${issue.githubIssueNumber}" && git push origin fix/issue-${issue.githubIssueNumber}`,
                          "push-step"
                        )
                      }
                      className="absolute top-2 right-2 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition-colors"
                    >
                      {copiedIndex === "push-step" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 11: Open Pull Request with Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-emerald-400 border border-emerald-500/40">
                    11
                  </span>
                  <span>Open PR with Standard Body</span>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="text-slate-400 text-[11px]">
                    Open a PR on GitHub and paste this description template:
                  </p>
                  <div className="relative group">
                    <pre className="rounded-lg bg-slate-950 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-300 overflow-x-auto font-mono">
                      ## Summary{"\n"}
                      Resolves issue #{issue.githubIssueNumber}.{"\n"}
                      {"\n"}
                      ## Changes{"\n"}
                      - Implemented required solution{"\n"}
                      - Added/updated test coverage{"\n"}
                      {"\n"}
                      ## Testing{"\n"}
                      - npm test passed{"\n"}
                      {"\n"}
                      Fixes #{issue.githubIssueNumber}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `## Summary\nResolves issue #${issue.githubIssueNumber}.\n\n## Changes\n- Implemented required solution\n- Added/updated test coverage\n\n## Testing\n- npm test passed\n\nFixes #${issue.githubIssueNumber}`,
                          "pr-body-step"
                        )
                      }
                      className="absolute top-2 right-2 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition-colors"
                    >
                      {copiedIndex === "pr-body-step" ? "Copied!" : "Copy Template"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 12-14: Review, Response & Verification */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-sky-400 border border-slate-700">
                    12–14
                  </span>
                  <span>Review, Merge & Proof Verification</span>
                </div>
                <div className="space-y-1.5 pl-7 text-[11px] text-slate-400">
                  <p>12. Wait for repository maintainers to review your code.</p>
                  <p>13. If changes are requested, push additional commits to the same branch.</p>
                  <p>14. Upon merge, TechNexusOrg automatically detects the closure via GitHub events, marks your claim completed, updates your Contributor Passport, and mints your proof-of-work record.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
