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
  const [deleting, setDeleting] = useState(false);
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure you want to delete your TechNexusOrg account? This action is permanent and deletes your profile, claims, and stored records."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      alert("Your account has been deleted.");
      window.location.href = "/";
    } catch (err: any) {
      alert(`Account deletion failed: ${err.message}`);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8">
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

        {/* Privacy by Default & Explicit Consent */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase text-white">
                  Public Contributor Passport
                </h3>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-sky-400">
                  Privacy-by-Default
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                By default, your student profile is private. Enabling this toggle provides explicit consent to display your public GitHub proof of work, approved pull requests, and earned badges at <code className="text-sky-300 font-mono">/people/{initialUser.githubUsername}</code>.
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
            placeholder="Uttarakhand, India or Remote"
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
              placeholder="Add skill (e.g. TypeScript, Docker, PyTest)"
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

      {/* GDPR Data Portability & Erasure Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-mono font-bold uppercase text-white">
            Data Portability & Privacy Rights
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            In accordance with digital privacy principles and transparency, you can export an archive of your platform data or permanently delete your account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div>
            <h4 className="text-xs font-mono font-semibold text-slate-200">
              Export Personal Data (GDPR Portability)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Download a complete JSON export of your profile, contributions, claims, and badges.
            </p>
          </div>
          <a
            href="/api/user/export"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-mono font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Download Data (JSON) ↓
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div>
            <h4 className="text-xs font-mono font-semibold text-red-400">
              Delete Account & Records (Right to Erasure)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Permanently delete your profile and unlink all stored personal data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-2 text-xs font-mono font-medium text-red-300 hover:bg-red-900/60 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
