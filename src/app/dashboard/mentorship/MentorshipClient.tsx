"use client";

import { useState } from "react";
import Link from "next/link";

interface IssueOption {
  id: string;
  title: string;
  githubIssueNumber: number;
  projectName: string;
  githubRepo: string;
}

interface MentorRequestItem {
  id: string;
  studentId: string;
  mentorId: string | null;
  issueId: string;
  message: string;
  reply: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string | Date;
  issueTitle?: string;
  issueNumber?: number;
  studentUsername?: string;
}

interface MentorshipClientProps {
  initialRequests: MentorRequestItem[];
  activeClaimIssues: IssueOption[];
  isMaintainer: boolean;
  currentUserId: string;
}

export function MentorshipClient({
  initialRequests,
  activeClaimIssues,
  isMaintainer,
  currentUserId,
}: MentorshipClientProps) {
  const [requests, setRequests] = useState<MentorRequestItem[]>(initialRequests);
  const [selectedIssueId, setSelectedIssueId] = useState(
    activeClaimIssues[0]?.id || ""
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Maintainer reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !message.trim()) {
      setError("Please select a claimed issue and explain what you are blocked on.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/mentors/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: selectedIssueId,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess("Your help request was submitted! A maintainer or mentor will review it.");
      setMessage("");
      // Refresh requests list
      const ref = await fetch("/api/mentors/requests");
      if (ref.ok) {
        const refData = await ref.json();
        setRequests(refData.requests || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (requestId: string, status: "in_progress" | "resolved" | "closed") => {
    const replyText = replyTextMap[requestId] || "";
    if (!replyText.trim()) return;

    setReplyLoadingId(requestId);
    try {
      const res = await fetch(`/api/mentors/requests/${requestId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: replyText.trim(),
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit reply");
      }

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, reply: replyText.trim(), status, mentorId: currentUserId }
            : r
        )
      );
      setReplyTextMap((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReplyLoadingId(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Disclaimer Alert */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4 text-xs font-mono text-slate-300 space-y-1">
        <span className="text-sky-400 font-bold block">
          About TechNexusOrg Engineering Mentorship
        </span>
        <p className="text-slate-400 leading-relaxed">
          Mentorship is designed for contributors who are actively working on an issue and hit an architectural or environmental blocker. Maintainers review requests and reply directly in the thread. Mentorship is an engineering support workflow, not a replacement for independent problem-solving.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Submit New Request */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Request Assistance
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Stuck on a claimed issue? Describe the problem clearly with error messages or reproduction steps.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 font-mono">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-mono">
                {success}
              </div>
            )}

            {activeClaimIssues.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-5 text-center space-y-3">
                <p className="text-xs text-slate-400 font-mono">
                  You do not have any active claimed issues.
                </p>
                <Link
                  href="/issues"
                  className="inline-block text-xs font-mono text-sky-400 hover:text-sky-300 underline font-semibold"
                >
                  Claim an Issue First →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Select Claimed Issue
                  </label>
                  <select
                    value={selectedIssueId}
                    onChange={(e) => setSelectedIssueId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  >
                    {activeClaimIssues.map((iss) => (
                      <option key={iss.id} value={iss.id}>
                        #{iss.githubIssueNumber}: {iss.title} ({iss.githubRepo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Describe Your Blocker
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. I am having trouble with the TypeScript types when modifying the schema... Expected X but got Y..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-sky-500 placeholder-slate-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-sky-500 py-2.5 text-xs font-mono font-bold text-slate-950 hover:bg-sky-400 transition-colors shadow-md disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Help Request →"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Existing Requests & Threads */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span>{isMaintainer ? "Mentor & Support Queue" : "My Help Requests"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {requests.length}
              </span>
            </h2>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center space-y-2">
              <p className="text-xs text-slate-400 font-mono">
                No mentorship requests recorded yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {req.studentUsername && (
                        <span className="text-xs font-mono text-slate-400 block mb-1">
                          Contributor: @{req.studentUsername}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-white font-mono">
                        Issue #{req.issueNumber || "—"}: {req.issueTitle || "Claimed Issue"}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-medium ${
                        req.status === "resolved"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : req.status === "in_progress"
                          ? "bg-sky-500/10 border border-sky-500/30 text-sky-300"
                          : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Student Question */}
                  <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {req.message}
                  </div>

                  {/* Mentor Reply */}
                  {req.reply ? (
                    <div className="rounded-lg bg-sky-950/20 border border-sky-500/20 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        <span className="text-xs font-mono font-bold text-sky-300">
                          Maintainer / Mentor Guidance
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {req.reply}
                      </p>
                    </div>
                  ) : isMaintainer ? (
                    /* Maintainer Reply Form */
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <textarea
                        rows={3}
                        value={replyTextMap[req.id] || ""}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        placeholder="Provide guidance, point to documentation, or explain the fix..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReply(req.id, "resolved")}
                          disabled={replyLoadingId === req.id || !replyTextMap[req.id]?.trim()}
                          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-mono font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          Reply & Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReply(req.id, "in_progress")}
                          disabled={replyLoadingId === req.id || !replyTextMap[req.id]?.trim()}
                          className="rounded bg-slate-700 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white disabled:opacity-50"
                        >
                          Reply (In Progress)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-slate-500 italic">
                      Awaiting maintainer response...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
