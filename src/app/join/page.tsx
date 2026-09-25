import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getLivePlatformMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join TechNexusOrg — Build Real Software, Build Real Proof",
  description:
    "Join TechNexusOrg with GitHub. Work on real open-source repositories, earn verified proof of work, and build a public engineering track record.",
};

export default async function JoinPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      if (!session.isOnboarded) {
        redirect("/onboarding");
      } else {
        redirect("/dashboard");
      }
    }
  }

  const metrics = await getLivePlatformMetrics();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/40 px-4 py-1 text-xs font-mono text-sky-300">
          GitHub-Native Open Source Infrastructure
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight leading-tight">
          Build Real Software.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300">
            Build Real Proof.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          TechNexusOrg helps students and engineers move from learning syntax to verified open-source engineering experience.
        </p>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/api/auth/github"
            className="w-full sm:w-auto rounded-xl bg-sky-500 px-8 py-4 text-sm font-bold font-mono text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Continue with GitHub</span>
            <span>→</span>
          </Link>
          <Link
            href="/projects"
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-4 text-sm font-semibold font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Explore Projects
          </Link>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          OAuth requires read access to your public GitHub profile and verified email. We never access private code.
        </p>
      </div>

      {/* Value Pillars Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6">
        <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider text-center">
          What Happens When You Join TechNexusOrg
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <span className="text-emerald-400 font-bold font-mono text-base">✓</span>
            <div>
              <div className="text-xs font-bold text-white font-mono">Real Open-Source Projects</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Work on active, curated repositories with real production architecture and tests.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <span className="text-emerald-400 font-bold font-mono text-base">✓</span>
            <div>
              <div className="text-xs font-bold text-white font-mono">Real GitHub Issues</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Claim genuine issues matched deterministically to your current skills and experience.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <span className="text-emerald-400 font-bold font-mono text-base">✓</span>
            <div>
              <div className="text-xs font-bold text-white font-mono">Real Pull Requests</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Write code, submit standard Git pull requests, and resolve code review feedback.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <span className="text-emerald-400 font-bold font-mono text-base">✓</span>
            <div>
              <div className="text-xs font-bold text-white font-mono">Maintainer Review</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Receive rigorous code review from experienced project maintainers and mentors.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <span className="text-emerald-400 font-bold font-mono text-base">✓</span>
            <div>
              <div className="text-xs font-bold text-white font-mono">Public Contributor Passport</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Your public proof-of-work portfolio at <code className="text-sky-300">/people/[username]</code> backed by GitHub evidence.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <span className="text-emerald-400 font-bold font-mono text-base">✓</span>
            <div>
              <div className="text-xs font-bold text-white font-mono">Verifiable Credentials</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Permanent records with direct GitHub links and embeddable badges for your README.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Community Proof */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="font-mono text-2xl font-bold text-white">{metrics.totalContributors}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono uppercase">Contributors</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="font-mono text-2xl font-bold text-emerald-400">{metrics.totalMergedPrs}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono uppercase">PRs Merged</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="font-mono text-2xl font-bold text-sky-400">{metrics.totalOfficialProjects}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono uppercase">Official Projects</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="font-mono text-2xl font-bold text-amber-400">{metrics.foundingMembersCount} / 1,000</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono uppercase">Founding Cohort</div>
        </div>
      </div>
    </div>
  );
}
