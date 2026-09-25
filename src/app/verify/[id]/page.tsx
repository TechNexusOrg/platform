import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { BadgeSnippet } from "./BadgeSnippet";
import { RevokeButton } from "./RevokeButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Credential Verification — ${id} | TechNexusOrg`,
    description: `Public verification record for TechNexusOrg credential ${id}. Proof of work backed by GitHub evidence.`,
  };
}

export default async function VerifyCredentialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const sessionUser = token ? await verifySessionToken(token) : null;

  const db = await getDb();

  const credRecords = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.id, id))
    .limit(1);

  if (credRecords.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-2xl font-bold">
          !
        </div>
        <h1 className="text-2xl font-bold text-white font-mono">
          Credential Not Found
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The credential identifier <code className="text-red-400 font-mono">{id}</code> is not recorded in the TechNexusOrg immutable registry.
        </p>
        <div>
          <Link
            href="/"
            className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const credential = credRecords[0];

  // Fetch holder user details
  const holderUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, credential.userId))
    .limit(1);

  const holder = holderUsers[0];
  const evidence = credential.evidenceData as any;
  const isRevoked = credential.status === "revoked";
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      {/* Verification Banner */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 space-y-6 ${
          isRevoked
            ? "border-red-500/40 bg-red-950/20"
            : "border-emerald-500/30 bg-emerald-950/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-2 w-2 rounded-full ${
                  isRevoked ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span
                className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                  isRevoked ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {isRevoked ? "Revoked Credential" : "Cryptographically Verified"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white font-mono">
              {credential.title}
            </h1>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-500">
            <div>ID: {credential.id}</div>
            <div className="mt-0.5">
              Issued: {new Date(credential.issuedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* If Revoked Banner */}
        {isRevoked && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-4 space-y-1">
            <div className="text-xs font-mono font-bold text-red-300 uppercase">
              Notice of Revocation
            </div>
            <p className="text-xs text-red-200">
              {credential.revokedReason || "This credential was revoked by repository maintainers."}
            </p>
          </div>
        )}

        {/* Holder & Issuer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px]">
              Credential Holder
            </span>
            <div className="flex items-center gap-3">
              {holder?.avatarUrl && (
                <img
                  src={holder.avatarUrl}
                  alt={holder.githubUsername}
                  className="h-8 w-8 rounded-full border border-slate-700"
                />
              )}
              <div>
                <div className="font-bold text-white">
                  {holder?.displayName || holder?.githubUsername}
                </div>
                <Link
                  href={`/people/${holder?.githubUsername}`}
                  className="text-sky-400 hover:text-sky-300 font-mono text-[11px]"
                >
                  @{holder?.githubUsername} (Passport ↗)
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px]">
              Verifying Authority
            </span>
            <div>
              <div className="font-bold text-white">TechNexusOrg Registry</div>
              <a
                href="https://github.com/TechNexusOrg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 font-mono text-[11px]"
              >
                github.com/TechNexusOrg
              </a>
            </div>
          </div>
        </div>

        {/* Proof of Work Evidence Section */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Canonical GitHub Evidence
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Source of Truth</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Target Repository:</span>
              <span className="font-mono text-white">{evidence?.repository}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Pull Request:</span>
              <a
                href={evidence?.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sky-400 hover:underline"
              >
                #{evidence?.prNumber} — {evidence?.prTitle}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Merge Timestamp:</span>
              <span className="font-mono text-slate-300">
                {evidence?.mergedAt ? new Date(evidence.mergedAt).toUTCString() : "Verified"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5">
              <span className="text-slate-400">Verification Source:</span>
              <span className="font-mono text-emerald-400">GitHub Webhook / SHA256 HMAC</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <a
              href={evidence?.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-mono text-white hover:bg-slate-700 transition-colors"
            >
              <span>Inspect PR on GitHub</span>
              <span>→</span>
            </a>

            {/* Admin safety control */}
            {sessionUser?.role === "admin" && !isRevoked && (
              <RevokeButton credentialId={credential.id} />
            )}
          </div>
        </div>

        {/* Embeddable Badge Snippet */}
        {!isRevoked && (
          <BadgeSnippet
            credentialId={credential.id}
            title={credential.title.split("—")[0].trim()}
            appUrl={appUrl}
          />
        )}

        {/* Anti-certificate mill disclaimer */}
        <p className="text-[11px] text-slate-500 font-mono text-center">
          TechNexusOrg credentials represent verifiable open-source engineering work. This record is linked to public GitHub contributions.
        </p>
      </div>
    </div>
  );
}
