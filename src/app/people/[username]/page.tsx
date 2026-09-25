import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { getContributorPassport } from "@/lib/passport";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — Contributor Passport | TechNexusOrg`,
    description: `Public proof of work, verified open-source contributions, and verified credentials for @${username} on TechNexusOrg.`,
    openGraph: {
      title: `@${username} — Contributor Passport | TechNexusOrg`,
      description: `Verified open-source contributions and proof of work on official TechNexusOrg repositories.`,
    },
  };
}

export default async function ContributorPassportPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const sessionUser = token ? await verifySessionToken(token) : null;

  const data = await getContributorPassport(username, sessionUser?.id);

  if ("notFound" in data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-slate-400 font-mono text-xl">
          ?
        </div>
        <h1 className="text-2xl font-bold text-white font-mono">
          Contributor @{username} Not Found
        </h1>
        <p className="text-xs text-slate-400">
          No registered or verified contributor with this GitHub handle was found in the TechNexusOrg directory.
        </p>
        <div className="pt-2">
          <Link
            href="/people"
            className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
          >
            ← Browse Contributor Directory
          </Link>
        </div>
      </div>
    );
  }

  if ("isPrivate" in data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-slate-400 font-mono text-xl">
          🔒
        </div>
        <h1 className="text-2xl font-bold text-white font-mono">
          Private Contributor Profile
        </h1>
        <p className="text-xs text-slate-400">
          @{data.username} has chosen to keep their contributor passport private.
        </p>
        <div className="pt-2">
          <Link
            href="/people"
            className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
          >
            ← Browse Contributor Directory
          </Link>
        </div>
      </div>
    );
  }

  const { user, profile, statistics, credentials, timeline } = data;
  const isOwner = sessionUser?.id === user.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Contributor Passport Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.githubUsername}
                className="h-20 w-20 rounded-2xl border border-slate-700 bg-slate-800 shadow-lg"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-2xl font-bold">
                {user.githubUsername[0]?.toUpperCase()}
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {user.displayName || user.githubUsername}
                </h1>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-xs font-mono text-sky-400 capitalize">
                  {user.level.replace("_", " ")}
                </span>
                {user.foundingNumber && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono text-amber-300">
                    Founding #{String(user.foundingNumber).padStart(4, "0")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                @{user.githubUsername} • Public Contributor Passport
              </p>
              {user.bio && (
                <p className="text-xs text-slate-300 max-w-xl pt-1 leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://github.com/${user.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
            >
              <span>GitHub Profile</span>
              <span>↗</span>
            </a>
            {isOwner && (
              <Link
                href="/dashboard/settings"
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Edit Passport
              </Link>
            )}
          </div>
        </div>

        {/* Metadata links (location, portfolio) */}
        {(user.location || user.portfolioUrl || user.linkedinUrl) && (
          <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
            {user.location && (
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>{user.location}</span>
              </div>
            )}
            {user.portfolioUrl && (
              <a
                href={user.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sky-400 hover:underline"
              >
                <span>🌐</span>
                <span>Portfolio</span>
              </a>
            )}
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sky-400 hover:underline"
              >
                <span>💼</span>
                <span>LinkedIn</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Verified Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-white">
            {statistics.mergedPrs}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">PRs Merged</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Verified on GitHub</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-sky-400">
            {statistics.projectsContributed}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Official Projects</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Code repositories</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-emerald-400">
            {statistics.credentialsEarned}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Credentials Earned</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Verifiable records</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <div className="font-mono text-3xl font-bold text-purple-400 capitalize">
            {profile?.experienceLevel || "Beginner"}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Experience Tier</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Verified level</div>
        </div>
      </div>

      {/* Demonstrated Skills */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Demonstrated Skills & Technologies
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-mono text-sky-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verified Credentials Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Verified Credentials ({credentials.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Public Proof of Work</span>
        </div>

        {credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">
              No credentials minted yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Credentials are automatically issued when pull requests are merged into official repositories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300 uppercase">
                    {cred.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(cred.issuedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-mono">{cred.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cred.description}</p>
                <div className="pt-2 border-t border-slate-800/80">
                  <Link
                    href={`/verify/${cred.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300 underline"
                  >
                    <span>Inspect Cryptographic Evidence</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Contribution Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Verified Contribution Timeline
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            {timeline.length} verified events
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <ol className="relative border-l border-slate-800 space-y-8 ml-3">
            {timeline.map((event) => (
              <li key={event.id} className="ml-6">
                <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-sky-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-xs font-bold text-white font-mono">
                    {event.title}
                  </h3>
                  <time className="text-[10px] font-mono text-slate-500">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </time>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {event.description}
                </p>
                {event.url && (
                  <div className="mt-2">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-sky-400 hover:underline"
                    >
                      View Source Evidence ↗
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
