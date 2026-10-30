"use client";

import React, { useState } from "react";

interface WorkLogFormProps {
  enrollmentId: string;
}

export function WorkLogForm({ enrollmentId }: WorkLogFormProps) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [hoursSpent, setHoursSpent] = useState(12);
  const [prUrlsInput, setPrUrlsInput] = useState("");
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const pullRequestUrls = prUrlsInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (pullRequestUrls.length === 0) {
      setError("Please provide at least one GitHub Pull Request URL.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/internships/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          weekNumber: Number(weekNumber),
          hoursSpent: Number(hoursSpent),
          summary,
          pullRequestUrls,
          blockers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit work log");
      }

      setSuccessMessage(`Week ${weekNumber} work log submitted successfully!`);
      // Reload page to reflect new log
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to submit work log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 font-mono">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
            Week Number
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={weekNumber}
            onChange={(e) => setWeekNumber(Number(e.target.value))}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
            Hours Spent This Week
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={hoursSpent}
            onChange={(e) => setHoursSpent(Number(e.target.value))}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
          Pull Request URLs (one per line)
        </label>
        <textarea
          rows={2}
          placeholder="https://github.com/TechNexusOrg/platform/pull/15"
          value={prUrlsInput}
          onChange={(e) => setPrUrlsInput(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
          Technical Summary of Work Performed (min 20 chars)
        </label>
        <textarea
          rows={3}
          placeholder="Implemented postgres queue dispatcher, authored integration tests in Vitest, resolved merge conflict with main branch..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
          Blockers or Questions for Mentor (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="Any architectural decisions or technical hurdles needing feedback..."
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold font-mono text-white shadow-sm hover:bg-sky-500 transition-all disabled:opacity-50"
      >
        {isSubmitting ? "Submitting Log..." : "Submit Weekly Work Log"}
      </button>
    </form>
  );
}
