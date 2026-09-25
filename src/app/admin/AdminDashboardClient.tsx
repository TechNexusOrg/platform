"use client";

import { useState } from "react";

interface ProjectItem {
  id: string;
  name: string;
  githubRepo: string;
  isOfficial: boolean;
  contributionEnabled: boolean;
  firstPrEnabled: boolean;
  approvedAt: string | null;
  openIssuesCount: number;
}

interface IssueItem {
  id: string;
  title: string;
  githubIssueNumber: number;
  difficulty: "unclassified" | "beginner" | "intermediate" | "advanced";
  estimatedEffort: string | null;
  isGoodFirstIssue: boolean;
  isHelpWanted: boolean;
  githubRepo: string;
}

interface PrItem {
  id: string;
  githubPrNumber: number;
  title: string;
  url: string;
  state: string;
  associationStatus: string;
  authorUsername?: string;
  githubRepo: string;
  openedAt: string;
}

interface MentorItem {
  id: string;
  message: string;
  reply: string | null;
  status: string;
  studentUsername?: string;
  issueTitle?: string;
  issueNumber?: number;
}

interface AdminDashboardClientProps {
  projects: ProjectItem[];
  issues: IssueItem[];
  prs: PrItem[];
  mentorRequests: MentorItem[];
}

export function AdminDashboardClient({
  projects: initialProjects,
  issues: initialIssues,
  prs,
  mentorRequests,
}: AdminDashboardClientProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [activeTab, setActiveTab] = useState<
    "projects" | "issues" | "prs" | "mentorship"
  >("projects");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleApproveProject = async (id: string) => {
    setLoadingAction(`approve_${id}`);
    try {
      const res = await fetch(`/api/admin/projects/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributionEnabled: true, firstPrEnabled: true }),
      });
      if (!res.ok) throw new Error("Failed to approve project");
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isOfficial: true,
                contributionEnabled: true,
                firstPrEnabled: true,
                approvedAt: new Date().toISOString(),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectProject = async (id: string) => {
    setLoadingAction(`reject_${id}`);
    try {
      const res = await fetch(`/api/admin/projects/${id}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to unapprove project");
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isOfficial: false,
                contributionEnabled: false,
                firstPrEnabled: false,
                approvedAt: null,
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClassifyIssue = async (
    id: string,
    difficulty: "beginner" | "intermediate" | "advanced"
  ) => {
    setLoadingAction(`classify_${id}`);
    try {
      const res = await fetch(`/api/admin/issues/${id}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      if (!res.ok) throw new Error("Failed to classify issue");
      setIssues((prev) =>
        prev.map((iss) => (iss.id === id ? { ...iss, difficulty } : iss))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "projects"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Project Approvals ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("issues")}
          className={`px-4 py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "issues"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Issue Quality & Difficulty ({issues.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prs")}
          className={`px-4 py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "prs"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          PR Review Queue ({prs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mentorship")}
          className={`px-4 py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "mentorship"
              ? "border-sky-400 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Mentor Requests ({mentorRequests.length})
        </button>
      </div>

      {/* Tab 1: Project Approvals */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800 bg-slate-900/60">
            {projects.map((proj) => {
              const isApproved = proj.isOfficial && proj.contributionEnabled && !!proj.approvedAt;
              return (
                <div
                  key={proj.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">
                        {proj.githubRepo}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-medium ${
                          isApproved
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                        }`}
                      >
                        {isApproved ? "Official & Approved" : "Unapproved / Disabled"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Open issues: {proj.openIssuesCount} • First PR eligible:{" "}
                      {proj.firstPrEnabled ? "Yes" : "No"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    {isApproved ? (
                      <button
                        type="button"
                        onClick={() => handleRejectProject(proj.id)}
                        disabled={loadingAction === `reject_${proj.id}`}
                        className="rounded border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-red-400 hover:bg-red-950/60 disabled:opacity-50"
                      >
                        Unapprove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApproveProject(proj.id)}
                        disabled={loadingAction === `approve_${proj.id}`}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500 disabled:opacity-50 font-semibold"
                      >
                        Approve Repository
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Issue Quality & Difficulty */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800 bg-slate-900/60">
            {issues.map((iss) => (
              <div
                key={iss.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {iss.githubRepo} #{iss.githubIssueNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                        iss.difficulty === "beginner"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : iss.difficulty === "intermediate"
                          ? "bg-sky-500/20 text-sky-300"
                          : iss.difficulty === "advanced"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {iss.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white font-mono">
                    {iss.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-500 text-[11px]">Set difficulty:</span>
                  <button
                    type="button"
                    onClick={() => handleClassifyIssue(iss.id, "beginner")}
                    className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-emerald-600"
                  >
                    Beginner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClassifyIssue(iss.id, "intermediate")}
                    className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-sky-600"
                  >
                    Intermediate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClassifyIssue(iss.id, "advanced")}
                    className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-purple-600"
                  >
                    Advanced
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: PR Review Queue */}
      {activeTab === "prs" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-900/60">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {pr.githubRepo} #{pr.githubPrNumber}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      {pr.state}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {pr.associationStatus}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white font-mono">
                    {pr.title}
                  </h4>
                </div>

                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white"
                >
                  Review on GitHub ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Mentor Requests */}
      {activeTab === "mentorship" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-900/60">
            {mentorRequests.map((req) => (
              <div key={req.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    From @{req.studentUsername || "contributor"} on Issue #{req.issueNumber || "—"}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-amber-400">
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans">{req.message}</p>
                {req.reply && (
                  <p className="text-xs text-sky-300 font-sans pl-3 border-l border-sky-500">
                    Reply: {req.reply}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
