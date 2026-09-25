"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export interface MarketplaceIssue {
  id: string;
  title: string;
  bodySnippet: string | null;
  htmlUrl: string;
  labels: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedEffort: string | null;
  skillsRequired: string[];
  isGoodFirstIssue: boolean;
  isHelpWanted: boolean;
  projectName: string;
  githubRepo: string;
  primaryLanguage: string;
}

export function IssueMarketplace({ initialIssues }: { initialIssues: MarketplaceIssue[] }) {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [goodFirstOnly, setGoodFirstOnly] = useState(false);

  // Extract unique languages from issues
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const issue of initialIssues) {
      if (issue.primaryLanguage) langs.add(issue.primaryLanguage);
      for (const skill of issue.skillsRequired) {
        langs.add(skill);
      }
    }
    return Array.from(langs).sort();
  }, [initialIssues]);

  const filteredIssues = useMemo(() => {
    return initialIssues.filter((issue) => {
      // Search text match
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesBody = issue.bodySnippet?.toLowerCase().includes(query);
        const matchesRepo = issue.githubRepo.toLowerCase().includes(query);
        const matchesSkills = issue.skillsRequired.some((s) => s.toLowerCase().includes(query));
        if (!matchesTitle && !matchesBody && !matchesRepo && !matchesSkills) {
          return false;
        }
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && issue.difficulty !== selectedDifficulty) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== "all") {
        const matchesLang =
          issue.primaryLanguage.toLowerCase() === selectedLanguage.toLowerCase() ||
          issue.skillsRequired.some((s) => s.toLowerCase() === selectedLanguage.toLowerCase());
        if (!matchesLang) return false;
      }

      // Good first issue only
      if (goodFirstOnly && !issue.isGoodFirstIssue) {
        return false;
      }

      return true;
    });
  }, [initialIssues, search, selectedDifficulty, selectedLanguage, goodFirstOnly]);

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, skill, or repo..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none font-mono capitalize"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Language / Skill Dropdown */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none font-mono"
            >
              <option value="all">All Languages & Skills</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkbox & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={goodFirstOnly}
              onChange={(e) => setGoodFirstOnly(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-300 font-mono">
              Only show <span className="text-emerald-400">good first issues</span>
            </span>
          </label>

          <div className="text-xs font-mono text-slate-500">
            Showing {filteredIssues.length} of {initialIssues.length} issue(s)
          </div>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <div className="font-mono text-xs text-slate-400">No matching issues found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search filters, or view all official open-source repositories on GitHub.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearch("");
                setSelectedDifficulty("all");
                setSelectedLanguage("all");
                setGoodFirstOnly(false);
              }}
              className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 hover:bg-slate-900/60 transition-all"
            >
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    {issue.githubRepo}
                  </span>
                  {issue.isGoodFirstIssue && (
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                      good first issue
                    </span>
                  )}
                  {issue.isHelpWanted && (
                    <span className="rounded bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                      help wanted
                    </span>
                  )}
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-mono text-sky-300 capitalize">
                    {issue.difficulty}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white hover:text-sky-300 transition-colors">
                  <Link href={`/issues/${issue.id}`}>
                    {issue.title}
                  </Link>
                </h3>

                {issue.bodySnippet && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {issue.bodySnippet}
                  </p>
                )}

                {issue.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {issue.skillsRequired.map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                <Link
                  href={`/issues/${issue.id}`}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-mono font-bold text-slate-950 hover:bg-sky-400 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>Start Contribution</span>
                  <span>→</span>
                </Link>
                <div className="flex items-center gap-2">
                  <a
                    href={issue.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-slate-400 hover:text-sky-300 transition-colors"
                  >
                    GitHub ↗
                  </a>
                  {issue.estimatedEffort && (
                    <span className="text-[10px] font-mono text-slate-500">
                      • {issue.estimatedEffort}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
