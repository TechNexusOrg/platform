"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevokeButton({ credentialId }: { credentialId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async () => {
    if (!reason.trim() || reason.length < 5) {
      setError("Please provide a legitimate justification (min 5 chars).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/credentials/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke credential");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded border border-red-500/30 bg-red-950/20 px-3 py-1 text-xs font-mono text-red-400 hover:bg-red-950/40 transition-colors"
      >
        Admin: Revoke Credential
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 space-y-3">
      <h4 className="text-xs font-mono font-bold text-red-300 uppercase">
        Administrative Revocation Action
      </h4>
      <p className="text-[11px] text-slate-300">
        This action is permanent and will be logged in the immutable audit registry.
      </p>

      {error && (
        <div className="text-[11px] font-mono text-red-400">
          {error}
        </div>
      )}

      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for revocation (e.g. PR reverted, plagiarized code)"
        className="w-full rounded border border-red-500/30 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
      />

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded px-3 py-1 text-xs font-mono text-slate-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={submitting}
          className="rounded bg-red-600 px-3 py-1 text-xs font-mono font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? "Revoking..." : "Confirm Revocation"}
        </button>
      </div>
    </div>
  );
}
