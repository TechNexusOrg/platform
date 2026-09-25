"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncContributionsButton() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setStatusMessage("Scanning official repositories on GitHub...");

    try {
      const res = await fetch("/api/sync/contributions", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      if (data.newContributionsCount > 0) {
        setStatusMessage(
          `Verified ${data.newContributionsCount} new PR(s)! ${
            data.credentialsIssued?.length ? "Credentials minted!" : ""
          }`
        );
      } else {
        setStatusMessage("All contributions are up to date.");
      }

      router.refresh();
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3.5 py-2 text-xs font-mono font-medium text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
      >
        <span className={loading ? "animate-spin" : ""}>⟳</span>
        {loading ? "Syncing..." : "Sync PRs from GitHub"}
      </button>

      {statusMessage && (
        <span className="text-[11px] font-mono text-emerald-400 animate-fade-in">
          {statusMessage}
        </span>
      )}
    </div>
  );
}
