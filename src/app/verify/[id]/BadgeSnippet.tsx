"use client";

import { useState } from "react";

export function BadgeSnippet({
  credentialId,
  title,
  appUrl,
}: {
  credentialId: string;
  title: string;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const snippet = `[![TechNexusOrg — ${title}](${appUrl}/api/badges/credential/${credentialId}/badge.svg)](${appUrl}/verify/${credentialId})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-mono font-bold uppercase text-white">
            Embed on GitHub Profile README
          </h4>
          <p className="text-[11px] text-slate-400">
            Showcase this verified proof of work on your personal GitHub README.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          {copied ? "Copied! ✓" : "Copy Markdown"}
        </button>
      </div>

      <div className="rounded-lg bg-slate-950 p-3 overflow-x-auto border border-slate-800/80">
        <code className="text-[11px] font-mono text-sky-300 whitespace-pre">
          {snippet}
        </code>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase">Live Badge Preview:</span>
        <img
          src={`/api/badges/credential/${credentialId}/badge.svg`}
          alt="Badge Preview"
          className="h-6"
        />
      </div>
    </div>
  );
}
