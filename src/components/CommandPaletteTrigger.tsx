"use client";

import * as React from "react";
import { Search } from "lucide-react";

export function CommandPaletteTrigger() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open command palette (Cmd+K or Ctrl+K)"
      className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all"
    >
      <Search className="h-3.5 w-3.5 text-slate-400" />
      <span>Search or jump to...</span>
      <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
        <span className="text-[10px]">⌘</span>K
      </kbd>
    </button>
  );
}
