"use client";

import * as React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Briefcase,
  GitPullRequest,
  Terminal,
  ShieldCheck,
  Users,
  Settings,
  ArrowRight,
  ExternalLink,
  Laptop,
  Building2,
  X,
  Compass,
} from "lucide-react";

interface PaletteItem {
  id: string;
  category:
    | "Curriculum"
    | "Fellowships"
    | "Contribute"
    | "Platform"
    | "Developer Workspace";
  title: string;
  description: string;
  href: string;
  icon: typeof Search;
  isExternal?: boolean;
  keywords: string[];
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Curriculum
  {
    id: "learn-tracks",
    category: "Curriculum",
    title: "Browse All Learning Tracks",
    description: "Hands-on terminal modules, system engineering & capstones",
    href: "/learn",
    icon: BookOpen,
    keywords: [
      "curriculum",
      "courses",
      "study",
      "education",
      "tracks",
      "learn",
    ],
  },
  {
    id: "track-linux",
    category: "Curriculum",
    title: "Linux Fundamentals & POSIX Systems",
    description: "File systems, processes, memory, and shell scripting",
    href: "/learn/linux-fundamentals",
    icon: Terminal,
    keywords: ["linux", "posix", "bash", "shell", "systems"],
  },
  {
    id: "track-git",
    category: "Curriculum",
    title: "Git, GitHub & Open Source Workflows",
    description:
      "Rebasing, pull requests, conventional commits and maintainer reviews",
    href: "/learn/git-and-open-source",
    icon: GitPullRequest,
    keywords: ["git", "github", "prs", "rebase", "workflow"],
  },
  // Fellowships
  {
    id: "fellowships-overview",
    category: "Fellowships",
    title: "Open Source Engineering Fellowships",
    description: "Supervised 8-week cohorts with code reviews & proof of work",
    href: "/internships",
    icon: Briefcase,
    keywords: ["internship", "fellowship", "cohort", "mentorship", "apply"],
  },
  {
    id: "fellowships-portal",
    category: "Fellowships",
    title: "Fellowship Workspace & Work Logs",
    description: "Submit weekly deliverables and review mentor evaluations",
    href: "/internships/portal",
    icon: Laptop,
    keywords: [
      "worklog",
      "timesheet",
      "weekly",
      "evaluation",
      "fellowship portal",
    ],
  },
  // Contribute
  {
    id: "contribute-marketplace",
    category: "Contribute",
    title: "Issue Marketplace",
    description: "Claim curated issues with active timers & PR tracking",
    href: "/issues",
    icon: Terminal,
    keywords: ["issues", "bugs", "tasks", "claim", "work"],
  },
  {
    id: "contribute-first-pr",
    category: "Contribute",
    title: "#FirstPR Initiative",
    description:
      "Guided path to merging your first production open-source commit",
    href: "/first-pr",
    icon: GitPullRequest,
    keywords: ["first pr", "beginner", "starter", "onboarding"],
  },
  {
    id: "contribute-projects",
    category: "Contribute",
    title: "Official TechNexus Repositories",
    description: "Explore core engines, tools, and developer platforms",
    href: "/projects",
    icon: Compass,
    keywords: ["projects", "repos", "repositories", "code"],
  },
  // Platform & Community
  {
    id: "platform-contributors",
    category: "Platform",
    title: "Contributor Directory & Passports",
    description:
      "Explore verified engineers and public proof-of-work passports",
    href: "/people",
    icon: Users,
    keywords: ["contributors", "people", "profiles", "community", "passport"],
  },
  {
    id: "platform-founding-1000",
    category: "Platform",
    title: "Founding 1,000 Cohort",
    description: "Immutable registry of initial ecosystem builders",
    href: "/founding-1000",
    icon: ShieldCheck,
    keywords: ["founding", "1000", "pioneer", "cohort"],
  },
  {
    id: "platform-partners",
    category: "Platform",
    title: "Institutional Partnerships & Sponsors",
    description: "Universities, companies, and project sponsor proposals",
    href: "/partners",
    icon: Building2,
    keywords: ["partners", "university", "sponsor", "company", "hiring"],
  },
  {
    id: "platform-verify",
    category: "Platform",
    title: "Verify Cryptographic Credential",
    description:
      "Inspect Ed25519 digital signatures and public JWKS verification",
    href: "/verify/check",
    icon: ShieldCheck,
    keywords: [
      "verify",
      "credential",
      "certificate",
      "signature",
      "jwks",
      "crypto",
    ],
  },
  // Developer Workspace
  {
    id: "workspace-dashboard",
    category: "Developer Workspace",
    title: "Contributor Cockpit",
    description: "View active claims, progression tier, and milestones",
    href: "/dashboard",
    icon: Laptop,
    keywords: ["dashboard", "home", "stats", "progression"],
  },
  {
    id: "workspace-work",
    category: "Developer Workspace",
    title: "My Work & PR History",
    description: "Track merged pull requests, review syncs, and claimed tasks",
    href: "/dashboard/work",
    icon: GitPullRequest,
    keywords: ["work", "prs", "contributions", "my work"],
  },
  {
    id: "workspace-mentorship",
    category: "Developer Workspace",
    title: "Mentorship & Code Reviews",
    description: "Request technical guidance and review meeting schedules",
    href: "/dashboard/mentorship",
    icon: Users,
    keywords: ["mentorship", "mentor", "advice", "guidance"],
  },
  {
    id: "workspace-settings",
    category: "Developer Workspace",
    title: "Profile & Privacy Settings",
    description: "Manage visibility, contact info, and GDPR data export",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["settings", "privacy", "gdpr", "profile", "account"],
  },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Listen for Cmd+K / Ctrl+K and custom trigger events
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    function onOpenEvent() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PALETTE_ITEMS;

    return PALETTE_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) =>
        k.toLowerCase().includes(q),
      );
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [query]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      setIsOpen(false);
      setQuery("");
      if (item.isExternal) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      } else {
        router.push(item.href);
      }
    },
    [router],
  );

  // Handle arrow key navigation
  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev + 1) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1018] shadow-2xl shadow-black/80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5 bg-slate-900/40">
          <Search className="h-5 w-5 text-sky-400 shrink-0" />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            placeholder="Search programmes, projects, issues, or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNavigation}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none font-sans"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ESC
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
              aria-label="Close command palette"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div
          id="command-palette-results"
          role="listbox"
          className="max-h-96 overflow-y-auto p-2 space-y-1"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching commands or routes found for{" "}
              <span className="text-white">&ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-800/80 text-white"
                      : "text-slate-300 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "bg-slate-800/60 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tracking-tight truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center text-slate-500">
                    {item.isExternal ? (
                      <ExternalLink className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isSelected ? "translate-x-0.5 text-sky-400" : ""
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>TechNexusOrg Global Hub</span>
        </div>
      </div>
    </div>
  );
}
