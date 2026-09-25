"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SKILL_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Docker",
  "Linux",
  "Git & GitHub Actions",
];

const INTEREST_OPTIONS = [
  "Backend & API Systems",
  "Frontend & User Interfaces",
  "DevOps & Infrastructure",
  "Developer Tooling & CLIs",
  "Distributed Systems",
  "Security & Code Auditing",
];

const CONTRIBUTION_TYPES = [
  "Good First Issues & Bug Fixes",
  "Documentation & Guides",
  "Feature Implementation",
  "Unit & E2E Testing",
  "Code Review & Mentorship",
];

export function OnboardingForm({ user }: { user: { githubUsername: string; displayName: string | null } }) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [contributionPreferences, setContributionPreferences] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (skills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }
    if (interests.length === 0) {
      setError("Please select at least one area of interest.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          interests,
          experienceLevel,
          preferredLanguages: skills,
          contributionPreferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-bold text-white font-mono">
          Contributor Profile Onboarding
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Welcome @{user.githubUsername}. Configure your skills and interests to receive deterministic issue recommendations.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Experience Level */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Experience Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["beginner", "intermediate", "advanced"] as const).map((level) => (
            <button
              type="button"
              key={level}
              onClick={() => setExperienceLevel(level)}
              className={`rounded-lg border p-3 text-left transition-all ${
                experienceLevel === level
                  ? "border-sky-500 bg-sky-500/10 text-white"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-xs font-medium capitalize font-mono">{level}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {level === "beginner" && "First-time open source contributor"}
                {level === "intermediate" && "Comfortable with Git & pull requests"}
                {level === "advanced" && "Experienced maintainer or engineer"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Skills & Technologies <span className="text-slate-500 normal-case">(Select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((skill) => {
            const selected = skills.includes(skill);
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggleItem(skills, setSkills, skill)}
                className={`rounded-md border px-3 py-1.5 text-xs font-mono transition-colors ${
                  selected
                    ? "border-sky-500 bg-sky-500/20 text-sky-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Areas of Interest
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() => toggleItem(interests, setInterests, interest)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  selected
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contribution Preferences */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Preferred Contribution Types
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTRIBUTION_TYPES.map((type) => {
            const selected = contributionPreferences.includes(type);
            return (
              <button
                type="button"
                key={type}
                onClick={() => toggleItem(contributionPreferences, setContributionPreferences, type)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  selected
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-mono">
          Can be updated anytime from your settings.
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors font-mono"
        >
          {submitting ? "Saving Profile..." : "Complete Onboarding →"}
        </button>
      </div>
    </form>
  );
}
