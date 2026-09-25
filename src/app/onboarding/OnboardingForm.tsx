"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EXPERIENCE_OPTIONS = [
  {
    key: "complete_beginner",
    title: "Complete Beginner",
    desc: "New to programming or never used Git/GitHub before",
  },
  {
    key: "beginner",
    title: "Beginner",
    desc: "Know basic programming; ready to make first open-source PR",
  },
  {
    key: "intermediate",
    title: "Intermediate",
    desc: "Comfortable with Git workflows, branches, and code reviews",
  },
  {
    key: "advanced",
    title: "Advanced",
    desc: "Experienced engineer, architectural contributor, or maintainer",
  },
] as const;

const PROGRAMMING_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C",
  "C++",
  "Kotlin",
  "Swift",
  "Ruby",
  "PHP",
  "SQL",
  "Shell / Bash",
];

const TECHNOLOGIES_AND_TOOLS = [
  "Git & GitHub",
  "Linux / POSIX",
  "Docker",
  "PostgreSQL",
  "React",
  "Next.js",
  "Node.js",
  "CI/CD Actions",
  "Cloud Infrastructure",
  "Tailwind CSS",
  "Kubernetes",
  "GraphQL & REST APIs",
  "Testing (Vitest/Jest)",
];

const INTEREST_AREAS = [
  "Backend & Distributed Systems",
  "Frontend & User Interfaces",
  "DevOps & Platform Engineering",
  "AI / Machine Learning",
  "Cybersecurity & Code Auditing",
  "Developer Tools & CLIs",
  "Linux & Systems Engineering",
  "Documentation & Community Guides",
  "Testing & Quality Assurance",
  "Mobile & Embedded Applications",
];

const CONTRIBUTION_PREFERENCES = [
  "Good First Issues",
  "Bug Fixes",
  "Documentation & Tutorials",
  "Unit & E2E Testing",
  "Feature Implementation",
  "Developer Tooling",
  "Code Review & Peer Feedback",
  "Mentorship",
];

const TIME_COMMITMENTS = [
  { key: "1-2_hours", label: "1–2 hours / week", desc: "Light exploration" },
  { key: "2-4_hours", label: "2–4 hours / week", desc: "Steady progress" },
  { key: "4-8_hours", label: "4–8 hours / week", desc: "Active engineering" },
  { key: "8+_hours", label: "8+ hours / week", desc: "Deep immersion" },
  { key: "flexible", label: "Flexible", desc: "Contribute as time permits" },
];

const GOAL_OPTIONS = [
  { key: "first_pr", label: "Make my first legitimate PR", desc: "Earn verified proof of work" },
  { key: "open_source_experience", label: "Gain open-source experience", desc: "Learn production conventions" },
  { key: "portfolio", label: "Build my public portfolio", desc: "Verifiable Contributor Passport" },
  { key: "learn_from_maintainers", label: "Learn from maintainers", desc: "Receive technical code reviews" },
  { key: "become_maintainer", label: "Grow into a project maintainer", desc: "Steward open-source projects" },
];

export function OnboardingForm({ user }: { user: { githubUsername: string; displayName: string | null } }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form State
  const [experienceLevel, setExperienceLevel] = useState<"complete_beginner" | "beginner" | "intermediate" | "advanced">("beginner");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(["TypeScript", "Python"]);
  const [technologies, setTechnologies] = useState<string[]>(["Git & GitHub", "React"]);
  const tools = technologies.filter((t) => ["Git & GitHub", "Docker", "Linux / POSIX", "CI/CD Actions"].includes(t));
  const [interests, setInterests] = useState<string[]>(["Backend & Distributed Systems"]);
  const [contributionPreferences, setContributionPreferences] = useState<string[]>(["Good First Issues"]);
  const [timeCommitment, setTimeCommitment] = useState<string>("2-4_hours");
  const [primaryGoal, setPrimaryGoal] = useState<string>("first_pr");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<{
    matchingIssuesCount: number;
    topMatch?: any;
  } | null>(null);

  const toggleArrayItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 2 && preferredLanguages.length === 0) {
      setError("Please select at least one programming language.");
      return;
    }
    if (step === 4 && interests.length === 0) {
      setError("Please select at least one area of interest.");
      return;
    }
    if (step === 5 && contributionPreferences.length === 0) {
      setError("Please select at least one contribution type.");
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel,
          preferredLanguages,
          technologies,
          tools,
          interests,
          contributionPreferences,
          timeCommitment,
          primaryGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      setCompletionData({
        matchingIssuesCount: data.matchingIssuesCount ?? 0,
        topMatch: data.topMatch || null,
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  // Completion Screen — First Contribution Path
  if (completionData) {
    const top = completionData.topMatch;

    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xl font-mono mb-2">
            ✓
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            Profile Initialized
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            Your First Contribution Path is Ready
          </h2>
          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            Welcome, <span className="font-mono text-white font-bold">@{user.githubUsername}</span>. We matched your
            skills with <span className="font-mono text-sky-400 font-bold">{completionData.matchingIssuesCount}</span> open
            issues on official TechNexusOrg repositories.
          </p>
        </div>

        {top ? (
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-5 space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 border-b border-sky-500/20 pb-3">
              <span className="text-xs font-mono font-semibold text-sky-400">
                Recommended First Task
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 capitalize">
                {top.difficulty}
              </span>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-400">
                {top.repo}
              </div>
              <h3 className="text-sm font-bold text-white font-mono mt-0.5">
                {top.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <div>
                <span className="text-slate-500">Language:</span>{" "}
                <span className="text-slate-300">{top.primaryLanguage}</span>
              </div>
              <div>
                <span className="text-slate-500">Est. Effort:</span>{" "}
                <span className="text-slate-300">{top.estimatedEffort}</span>
              </div>
            </div>

            {top.matchReasons && top.matchReasons.length > 0 && (
              <div className="text-xs font-mono text-slate-400 pt-2 border-t border-sky-500/10">
                <span className="text-sky-300 font-semibold block mb-1">Why this matches you:</span>
                <ul className="space-y-1">
                  {top.matchReasons.slice(0, 2).map((reason: string, i: number) => (
                    <li key={i} className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-sky-400">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg bg-slate-900/80 p-3 text-[11px] font-mono text-slate-400 border border-slate-800">
              <span className="text-white font-semibold block mb-0.5">First Step:</span>
              Open the contribution workspace, claim this issue to reserve it, and follow the terminal commands to submit your PR.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={`/issues/${top.id}`}
                className="w-full sm:w-auto flex-1 rounded-xl bg-sky-500 px-5 py-3 text-xs font-bold font-mono text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all text-center"
              >
                Start This Contribution →
              </Link>
              <Link
                href="/issues"
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-semibold font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-center"
              >
                Browse Other Issues
              </Link>
            </div>
          </div>
        ) : (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/issues"
              className="w-full sm:w-auto rounded-xl bg-sky-500 px-6 py-3 text-xs font-bold font-mono text-slate-950 hover:bg-sky-400 shadow-lg transition-all text-center"
            >
              Browse All Issues →
            </Link>
            <Link
              href="/dashboard/work"
              className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-xs font-semibold font-mono text-slate-200 hover:text-white text-center"
            >
              My Work Dashboard
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-8">
      {/* Header & Step Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>STEP {step} OF {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% COMPLETED</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white font-mono">
            {step === 1 && "Step 1: What is your current engineering experience?"}
            {step === 2 && "Step 2: Select your primary programming languages"}
            {step === 3 && "Step 3: Which technologies & tools do you work with?"}
            {step === 4 && "Step 4: What technical domains interest you most?"}
            {step === 5 && "Step 5: How would you like to contribute?"}
            {step === 6 && "Step 6: Estimated weekly time commitment"}
            {step === 7 && "Step 7: What is your primary open-source goal?"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 && "This helps us calibrate issue difficulty and beginner-friendly mentorship."}
            {step === 2 && "We match issues where the repository code is written in these languages."}
            {step === 3 && "Tools, frameworks, and deployment platforms you want to learn or use."}
            {step === 4 && "Choose architectural domains for curated issue discovery."}
            {step === 5 && "From good-first-issues to tests, docs, or feature implementation."}
            {step === 6 && "Helps us recommend issues with the appropriate effort estimate."}
            {step === 7 && "Your journey: first PR, portfolio building, or maintainer roadmap."}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {/* Step 1: Experience */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setExperienceLevel(opt.key)}
              className={`rounded-xl border p-4 text-left transition-all ${
                experienceLevel === opt.key
                  ? "border-sky-400 bg-sky-500/10 text-white ring-1 ring-sky-400"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-sm font-bold text-white font-mono">{opt.title}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Languages */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PROGRAMMING_LANGUAGES.map((lang) => {
              const selected = preferredLanguages.includes(lang);
              return (
                <button
                  type="button"
                  key={lang}
                  onClick={() => toggleArrayItem(preferredLanguages, setPreferredLanguages, lang)}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-mono transition-all ${
                    selected
                      ? "border-sky-400 bg-sky-500/20 text-sky-200 ring-1 ring-sky-400"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {selected ? "✓ " : ""}{lang}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Technologies & Tools */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TECHNOLOGIES_AND_TOOLS.map((tech) => {
              const selected = technologies.includes(tech);
              return (
                <button
                  type="button"
                  key={tech}
                  onClick={() => toggleArrayItem(technologies, setTechnologies, tech)}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-mono transition-all ${
                    selected
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {selected ? "✓ " : ""}{tech}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Interests */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INTEREST_AREAS.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleArrayItem(interests, setInterests, interest)}
                  className={`rounded-xl border p-3 text-left text-xs font-mono transition-all ${
                    selected
                      ? "border-purple-400 bg-purple-500/20 text-purple-200 ring-1 ring-purple-400"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {selected ? "✓ " : "+ "}{interest}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 5: Contribution Preference */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CONTRIBUTION_PREFERENCES.map((pref) => {
              const selected = contributionPreferences.includes(pref);
              return (
                <button
                  type="button"
                  key={pref}
                  onClick={() => toggleArrayItem(contributionPreferences, setContributionPreferences, pref)}
                  className={`rounded-xl border p-3 text-left text-xs font-mono transition-all ${
                    selected
                      ? "border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {selected ? "✓ " : "+ "}{pref}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 6: Time Commitment */}
      {step === 6 && (
        <div className="space-y-3">
          {TIME_COMMITMENTS.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setTimeCommitment(item.key)}
              className={`w-full rounded-xl border p-4 text-left flex items-center justify-between transition-all ${
                timeCommitment === item.key
                  ? "border-sky-400 bg-sky-500/10 text-white ring-1 ring-sky-400"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white font-mono">{item.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <span className="font-mono text-sm">{timeCommitment === item.key ? "●" : "○"}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 7: Goal */}
      {step === 7 && (
        <div className="space-y-3">
          {GOAL_OPTIONS.map((goal) => (
            <button
              type="button"
              key={goal.key}
              onClick={() => setPrimaryGoal(goal.key)}
              className={`w-full rounded-xl border p-4 text-left flex items-center justify-between transition-all ${
                primaryGoal === goal.key
                  ? "border-emerald-400 bg-emerald-500/10 text-white ring-1 ring-emerald-400"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white font-mono">{goal.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{goal.desc}</div>
              </div>
              <span className="font-mono text-sm">{primaryGoal === goal.key ? "●" : "○"}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-mono font-medium text-slate-300 hover:text-white transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-sky-500 px-5 py-2 text-xs font-mono font-bold text-slate-950 hover:bg-sky-400 transition-colors"
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-lg bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-2.5 text-xs font-mono font-bold text-slate-950 hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            {submitting ? "Finalizing Profile..." : "Finish Setup & Match Issues →"}
          </button>
        )}
      </div>
    </div>
  );
}
