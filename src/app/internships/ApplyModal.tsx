"use client";

import React, { useState } from "react";

interface ApplyModalProps {
  programs: Array<{ id: string; title: string; slug: string; durationWeeks: number }>;
  isLoggedIn: boolean;
}

export function ApplyModal({ programs, isLoggedIn }: ApplyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [programId, setProgramId] = useState(programs[0]?.id || "");
  const [statement, setStatement] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(15);
  const [githubProfile, setGithubProfile] = useState("");
  const [priorExperience, setPriorExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.location.href = "/join";
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/internships/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          statement,
          weeklyAvailabilityHours: Number(weeklyHours),
          githubProfile,
          priorExperience,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isLoggedIn) {
            window.location.href = "/join";
            return;
          }
          setIsOpen(true);
        }}
        className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 font-mono transition-all"
      >
        Apply for Fellowship →
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-[#0c1017] p-6 sm:p-8 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">
                  Apply for Engineering Fellowship
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rigorous supervised open-source apprenticeship
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-2xl mb-4 border border-emerald-500/20">
                  ✓
                </div>
                <h4 className="text-base font-bold text-white font-mono">
                  Application Submitted!
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  Our engineering maintainers review applications weekly based on your verified open-source activity and statement of purpose.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-6 inline-flex rounded-lg bg-slate-800 px-4 py-2 text-xs font-mono text-white hover:bg-slate-700"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 font-mono">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Select Fellowship Track
                  </label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.durationWeeks} weeks)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/your-handle"
                    value={githubProfile}
                    onChange={(e) => setGithubProfile(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Weekly Availability (hours/week, min 10)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Statement of Purpose & Technical Goals (min 50 chars)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Why do you want to join this fellowship? What systems or features do you want to contribute to?"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Prior Engineering / Project Experience
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your programming experience, tech stack familiarity, and links to any past projects or PRs."
                    value={priorExperience}
                    onChange={(e) => setPriorExperience(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold font-mono text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
