"use client";

import { useState } from "react";
import { Building2, Mail, Users } from "lucide-react";

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

export interface PartnerProposalItem {
  id: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  partnerType: string;
  proposalType: string;
  summary: string;
  targetTechnologies: string[];
  estimatedStudentCapacity: number;
  status: string;
  createdAt: string;
}

interface AdminDashboardClientProps {
  projects: ProjectItem[];
  issues: IssueItem[];
  prs: PrItem[];
  mentorRequests: MentorItem[];
  partnerProposals?: PartnerProposalItem[];
}

export function AdminDashboardClient({
  projects: initialProjects,
  issues: initialIssues,
  prs,
  mentorRequests,
  partnerProposals = [],
}: AdminDashboardClientProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [activeTab, setActiveTab] = useState<
    "projects" | "issues" | "prs" | "mentorship" | "partners"
  >("projects");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleApproveProject = async (id: string) => {
    setLoadingAction(`approve_${id}`);
    try {
      const res = await fetch(`/api/admin/projects/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionEnabled: true,
          firstPrEnabled: true,
        }),
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
            : p,
        ),
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
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateDifficulty = async (
    id: string,
    difficulty: IssueItem["difficulty"],
    isGoodFirstIssue: boolean,
  ) => {
    setLoadingAction(`issue_${id}`);
    try {
      const res = await fetch(`/api/admin/issues/${id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, isGoodFirstIssue }),
      });
      if (!res.ok) throw new Error("Failed to triage issue");
      setIssues((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, difficulty, isGoodFirstIssue } : i,
        ),
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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "projects"
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Repositories ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "issues"
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Issue Quality Triage ({issues.length})
        </button>
        <button
          onClick={() => setActiveTab("prs")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "prs"
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          PR Review Queue ({prs.length})
        </button>
        <button
          onClick={() => setActiveTab("mentorship")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "mentorship"
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Mentorship Requests ({mentorRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "partners"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold"
              : "text-slate-400 hover:text-emerald-300"
          }`}
        >
          Partner Proposals ({partnerProposals.length})
        </button>
      </div>

      {/* Tab 1: Project Approvals */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-900/60">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white font-mono">
                      {p.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                        p.isOfficial
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {p.isOfficial
                        ? "Official Ecosystem"
                        : "Pending Verification"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {p.githubRepo} • {p.openIssuesCount} issues
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {p.isOfficial ? (
                    <button
                      onClick={() => handleRejectProject(p.id)}
                      disabled={loadingAction === `reject_${p.id}`}
                      className="rounded border border-red-500/40 bg-red-950/20 px-3 py-1.5 text-xs font-mono text-red-300 hover:bg-red-950/40"
                    >
                      Revoke Official Status
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApproveProject(p.id)}
                      disabled={loadingAction === `approve_${p.id}`}
                      className="rounded bg-sky-500 px-3 py-1.5 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      Approve &amp; Enable PRs
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Issue Triage */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-900/60">
            {issues.map((i) => (
              <div
                key={i.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {i.githubRepo} #{i.githubIssueNumber}
                    </span>
                    {i.isGoodFirstIssue && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        #FirstPR
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white font-mono">
                    {i.title}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={i.difficulty}
                    onChange={(e) =>
                      handleUpdateDifficulty(
                        i.id,
                        e.target.value as any,
                        i.isGoodFirstIssue,
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-white"
                  >
                    <option value="unclassified">Unclassified</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <button
                    onClick={() =>
                      handleUpdateDifficulty(
                        i.id,
                        i.difficulty,
                        !i.isGoodFirstIssue,
                      )
                    }
                    className={`rounded px-2.5 py-1 text-xs font-mono border ${
                      i.isGoodFirstIssue
                        ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    {i.isGoodFirstIssue ? "✓ Good First" : "+ Mark FirstPR"}
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
                    From @{req.studentUsername || "contributor"} on Issue #
                    {req.issueNumber || "—"}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-amber-400">
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  {req.message}
                </p>
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

      {/* Tab 5: Partner Proposals */}
      {activeTab === "partners" && (
        <div className="space-y-4">
          {partnerProposals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500 font-mono">
              No institutional partner proposals submitted yet.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-900/60">
              {partnerProposals.map((p) => (
                <div key={p.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white font-mono">
                        {p.organizationName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                        {p.partnerType.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-4 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                      Contact: {p.contactName}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="h-3.5 w-3.5 text-sky-400" />
                      <a
                        href={`mailto:${p.contactEmail}`}
                        className="text-sky-400 hover:underline"
                      >
                        {p.contactEmail}
                      </a>
                    </span>
                    <span className="text-amber-400">
                      Type: {p.proposalType.replace("_", " ")}
                    </span>
                    <span className="text-slate-400">
                      Capacity: {p.estimatedStudentCapacity} students
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    {p.summary}
                  </p>

                  {p.targetTechnologies && p.targetTechnologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.targetTechnologies.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
