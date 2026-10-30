"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";

interface MobileMenuProps {
  user: {
    id: string;
    githubUsername: string;
    avatarUrl?: string | null;
    level: string;
    role: string;
  } | null;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const togglePalette = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <div className="md:hidden flex items-center gap-2">
      <button
        type="button"
        onClick={togglePalette}
        className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 bg-slate-900/50"
        aria-label="Open search palette"
      >
        <Search className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 bg-slate-900/50"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-slate-800 bg-[#07090e]/95 backdrop-blur-xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-medium">
            <Link
              href="/learn"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-sky-400 transition-colors py-1"
            >
              Learn & Curriculum
            </Link>
            <Link
              href="/internships"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-sky-400 transition-colors py-1"
            >
              Fellowships
            </Link>
            <Link
              href="/issues"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-sky-400 transition-colors py-1"
            >
              Issue Marketplace
            </Link>
            <Link
              href="/projects"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-sky-400 transition-colors py-1"
            >
              Projects
            </Link>
            <Link
              href="/first-pr"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-sky-400 transition-colors py-1"
            >
              #FirstPR
            </Link>
            <Link
              href="/people"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-sky-400 transition-colors py-1"
            >
              Contributors
            </Link>
            <Link
              href="/partners"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-emerald-400 transition-colors py-1"
            >
              Partners & Universities
            </Link>
            {user && (
              <>
                <div className="pt-2 border-t border-slate-800/80" />
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-sky-400 hover:text-sky-300 transition-colors py-1 font-mono text-xs"
                >
                  Contributor Cockpit
                </Link>
                <Link
                  href="/dashboard/work"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white transition-colors py-1 text-xs"
                >
                  My Work & PRs
                </Link>
                <Link
                  href="/dashboard/mentorship"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white transition-colors py-1 text-xs"
                >
                  Mentorship Guidance
                </Link>
                {(user.role === "admin" || user.role === "maintainer") && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="text-amber-400 hover:text-amber-300 transition-colors py-1 font-mono text-xs"
                  >
                    Admin Control Room
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {user ? (
              <form action="/api/auth/logout" method="POST" className="w-full">
                <button
                  type="submit"
                  className="w-full py-2 px-3 text-center rounded-lg border border-red-500/30 bg-red-950/20 text-xs font-mono text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  Log out @{user.githubUsername}
                </button>
              </form>
            ) : (
              <a
                href="/api/auth/github"
                className="w-full py-2.5 px-4 text-center rounded-lg bg-white text-xs font-semibold text-slate-950 hover:bg-slate-200 transition-colors"
              >
                Continue with GitHub
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
