import type { ContributorLevel, ProgressionResult } from "@/lib/progression/rules";

interface ProgressionPathProps {
  currentLevel: ContributorLevel;
  progression: ProgressionResult;
  mergedCount: number;
}

const LEVELS: Array<{ key: ContributorLevel; label: string }> = [
  { key: "explorer", label: "Explorer" },
  { key: "contributor", label: "Contributor" },
  { key: "active_contributor", label: "Active" },
  { key: "core_contributor", label: "Core" },
  { key: "maintainer", label: "Maintainer" },
];

const LEVEL_RANK: Record<ContributorLevel, number> = {
  explorer: 0,
  contributor: 1,
  active_contributor: 2,
  core_contributor: 3,
  maintainer: 4,
  project_lead: 5,
  mentor: 4,
};

export function ProgressionPath({ currentLevel, progression, mergedCount }: ProgressionPathProps) {
  const currentRank = LEVEL_RANK[currentLevel] ?? 0;

  return (
    <div className="space-y-6">
      {/* Milestone Stepper */}
      <div className="relative">
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500 -z-0"
          style={{
            width: `${Math.min(100, (currentRank / (LEVELS.length - 1)) * 100)}%`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          {LEVELS.map((lvl, idx) => {
            const isCompleted = idx < currentRank;
            const isCurrent = lvl.key === currentLevel;

            return (
              <div key={lvl.key} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? "border-sky-400 bg-sky-950 text-sky-300 ring-4 ring-sky-500/20"
                      : isCompleted
                      ? "border-emerald-500 bg-emerald-950 text-emerald-400"
                      : "border-slate-800 bg-slate-900 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-mono capitalize ${
                    isCurrent
                      ? "font-bold text-sky-400"
                      : isCompleted
                      ? "text-slate-300"
                      : "text-slate-600"
                  }`}
                >
                  {lvl.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Next Milestone:{" "}
            <span className="font-bold text-sky-300 capitalize">
              {progression.nextLevel ? progression.nextLevel.replace("_", " ") : "Maintainer / Max Tier"}
            </span>
          </span>
          <span className="text-emerald-400">{mergedCount} PR(s) verified & merged</span>
        </div>

        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Remaining Requirements:
          </h4>
          {progression.requirementsForNextLevel.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {progression.requirementsForNextLevel.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-emerald-400 font-mono">
              All quantitative milestones satisfied for current evaluation cycle!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
