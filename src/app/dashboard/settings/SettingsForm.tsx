"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  initialUser,
  initialSkills,
}: {
  initialUser: {
    githubUsername: string;
    displayName: string | null;
    bio: string | null;
    location: string | null;
    portfolioUrl: string | null;
    linkedinUrl: string | null;
    isPublic: boolean;
  };
  initialSkills: string[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialUser.displayName || "");
  const [bio, setBio] = useState(initialUser.bio || "");
  const [location, setLocation] = useState(initialUser.location || "");
  const [portfolioUrl, setPortfolioUrl] = useState(initialUser.portfolioUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialUser.linkedinUrl || "");
  const [isPublic, setIsPublic] = useState(initialUser.isPublic);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(initialSkills || []);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          portfolioUrl: portfolioUrl || "",
          linkedinUrl: linkedinUrl || "",
          isPublic,
          skills,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile settings");
      }

      setMessage({ type: "success", text: "Settings saved successfully!" });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8">
      {message && (
        <div
          className={`rounded-lg p-3 text-xs font-mono ${
            message.type === "success"
              ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Privacy Toggle */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white">
              Public Contributor Passport
            </h3>
            <p className="text-[11px] text-slate-400">
              When enabled, your passport is visible at <code className="text-sky-300 font-mono">/people/{initialUser.githubUsername}</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPublic ? "bg-sky-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={initialUser.githubUsername}
          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Bio / Summary
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Software engineer interested in distributed systems, compilers, and open-source..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="San Francisco, CA or Remote"
          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      {/* Social / Portfolio Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
            Portfolio / Blog URL
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourportfolio.dev"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Skills Manager */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
          Skills & Technologies
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Add skill (e.g. Rust, Docker, PyTest)"
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={addSkill}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-mono text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-300"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-slate-400 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
