"use client";

import React from "react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
    >
      <span>🖨️</span>
      <span>Print / Save PDF</span>
    </button>
  );
}
