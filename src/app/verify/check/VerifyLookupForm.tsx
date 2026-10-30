"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

export function VerifyLookupForm() {
  const [credentialId, setCredentialId] = useState("");
  const router = useRouter();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = credentialId.trim();
    if (trimmed) {
      router.push(`/verify/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleLookup} className="space-y-4">
      <div className="relative">
        <input
          type="text"
          required
          placeholder="Enter credential ID (e.g. cred_abc123 or uuid)..."
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-11 pr-32 py-3.5 text-sm font-mono text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none shadow-lg"
        />
        <ShieldCheck className="absolute left-3.5 top-3.5 h-5 w-5 text-sky-400" />
        <button
          type="submit"
          className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-mono font-semibold text-slate-950 hover:bg-sky-400 transition-all"
        >
          <span>Verify</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[11px] font-mono text-slate-500">
        All certificates carry an Ed25519 digital signature verifiable with our
        public JWKS keys.
      </p>
    </form>
  );
}
