"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { DetailedLesson } from "@/lib/learning/service";

interface LessonViewerProps {
  lesson: DetailedLesson;
  isLoggedIn: boolean;
}

export function LessonViewer({ lesson, isLoggedIn }: LessonViewerProps) {
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted);
  const [isToggling, setIsToggling] = useState(false);

  // Assignment states
  const [submissionContent, setSubmissionContent] = useState(
    lesson.assignment?.userSubmission?.content || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(
    lesson.assignment?.userSubmission?.status || null
  );
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleToggleCompletion = async () => {
    if (!isLoggedIn) {
      window.location.href = "/join";
      return;
    }

    setIsToggling(true);
    try {
      const res = await fetch(`/api/learn/lessons/${lesson.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !isCompleted }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update progress");
      }

      setIsCompleted(!isCompleted);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update progress");
    } finally {
      setIsToggling(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson.assignment) return;

    if (!isLoggedIn) {
      window.location.href = "/join";
      return;
    }

    if (!submissionContent.trim()) {
      setSubmissionError("Please provide submission content");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionMessage(null);

    try {
      const res = await fetch(
        `/api/learn/assignments/${lesson.assignment.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: submissionContent.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assignment");
      }

      setSubmissionStatus("submitted");
      setSubmissionMessage("Assignment submitted successfully for review!");
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Metadata */}
      <nav className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mb-6">
        <Link href="/learn" className="hover:text-emerald-400 transition-colors">
          Tracks
        </Link>
        <span>/</span>
        <Link
          href={`/learn/${lesson.track.slug}`}
          className="hover:text-emerald-400 transition-colors"
        >
          {lesson.track.title}
        </Link>
        <span>/</span>
        <span className="text-slate-500">{lesson.module.title}</span>
      </nav>

      {/* Lesson Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {lesson.module.title}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ⏱ {lesson.estimatedMinutes} minutes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {lesson.title}
            </h1>
          </div>

          {/* Completion Toggle */}
          <button
            type="button"
            onClick={handleToggleCompletion}
            disabled={isToggling}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold font-mono transition-all ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30"
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {isCompleted ? (
              <>
                <span>✓</span> Completed
              </>
            ) : (
              <>
                <span className="h-3.5 w-3.5 rounded-full border border-slate-400 inline-block" />
                Mark as Complete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lesson Content */}
      <article className="prose prose-invert max-w-none rounded-xl border border-slate-800/80 bg-slate-900/20 p-6 sm:p-8">
        <MarkdownRenderer content={lesson.content} />
      </article>

      {/* Practical Assignment Section */}
      {lesson.assignment && (
        <section className="mt-10 rounded-xl border border-purple-500/30 bg-purple-950/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Capstone Assignment
            </span>
            {submissionStatus && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                  submissionStatus === "approved"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : submissionStatus === "needs_revision"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                }`}
              >
                Status: {submissionStatus.replace("_", " ")}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold font-mono text-white mb-2">
            {lesson.assignment.title}
          </h2>

          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            {lesson.assignment.description}
          </p>

          {/* Acceptance Criteria */}
          {lesson.assignment.acceptanceCriteria.length > 0 && (
            <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300 mb-2">
                Acceptance Criteria
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {lesson.assignment.acceptanceCriteria.map((criterion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submission Form */}
          <form onSubmit={handleAssignmentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                {lesson.assignment.submissionType === "github_pr"
                  ? "Pull Request URL (e.g. https://github.com/owner/repo/pull/12)"
                  : "Terminal Output / Verification Logs"}
              </label>

              {lesson.assignment.submissionType === "github_pr" ? (
                <input
                  type="url"
                  placeholder="https://github.com/TechNexusOrg/platform/pull/..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  required
                />
              ) : (
                <textarea
                  rows={6}
                  placeholder="Paste terminal command output verifying systemd service status and journal logs..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-emerald-400 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  required
                />
              )}
            </div>

            {submissionError && (
              <p className="text-xs font-mono text-red-400">{submissionError}</p>
            )}

            {submissionMessage && (
              <p className="text-xs font-mono text-emerald-400">
                {submissionMessage}
              </p>
            )}

            {lesson.assignment.userSubmission?.feedback && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                <span className="font-semibold font-mono">Mentor Feedback: </span>
                {lesson.assignment.userSubmission.feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-xs sm:text-sm font-semibold font-mono text-white shadow-sm hover:bg-purple-500 transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Submitting..."
                : submissionStatus
                ? "Update Submission"
                : "Submit Assignment for Review"}
            </button>
          </form>
        </section>
      )}

      {/* Bottom Navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-slate-800 pt-6">
        {lesson.previousLesson ? (
          <Link
            href={`/learn/${lesson.track.slug}/${lesson.previousLesson.slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs sm:text-sm font-mono text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            ← {lesson.previousLesson.title}
          </Link>
        ) : (
          <div />
        )}

        {lesson.nextLesson ? (
          <Link
            href={`/learn/${lesson.track.slug}/${lesson.nextLesson.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold font-mono text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            {lesson.nextLesson.title} →
          </Link>
        ) : (
          <Link
            href={`/learn/${lesson.track.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold font-mono text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Back to Syllabus ✓
          </Link>
        )}
      </div>
    </div>
  );
}
