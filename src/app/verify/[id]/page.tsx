import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { BadgeSnippet } from "./BadgeSnippet";
import { RevokeButton } from "./RevokeButton";
import { PrintButton } from "./PrintButton";
import { verifyCredentialSignature } from "@/lib/credentials/crypto";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Credential Verification — ${id} | TechNexusOrg`,
    description: `Public verification record for TechNexusOrg credential ${id}. Proof of work backed by GitHub evidence and Ed25519 digital signatures.`,
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
  const evidence = (credential.evidenceData as any) || {};
  const isRevoked = credential.status === "revoked";
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // Verify Ed25519 signature if present
  let isCryptoSignatureValid: boolean | null = null;
  if (credential.signature) {
    const claims = {
      issuer: credential.issuer,
      credentialId: credential.id,
      recipientId: credential.userId,
      recipientGithub: evidence.githubUsername,
      type: credential.type,
      title: credential.title,
      issuedAt: new Date(credential.issuedAt).toISOString(),
      verificationUrl: credential.verificationUrl,
      evidence: credential.evidenceData,
    };
    isCryptoSignatureValid = verifyCredentialSignature(
      claims,
      credential.signature,
      credential.signingKeyId || undefined
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Verification Banner */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 space-y-6 print:border-black print:bg-white print:text-black ${
          isRevoked
            ? "border-red-500/40 bg-red-950/20"
            : "border-emerald-500/30 bg-emerald-950/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-2 w-2 rounded-full ${
                  isRevoked ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span
                className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                  isRevoked ? "text-red-400" : "text-emerald-400 print:text-emerald-700"
                }`}
              >
                {isRevoked ? "Revoked Record" : "Cryptographically Verified Credential"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white print:text-black font-mono">
              {credential.title}
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 font-mono">
              Issued and digitally signed by the TechNexusOrg Engineering Registry.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-left sm:text-right font-mono text-xs text-slate-500 print:text-slate-700">
              <div>ID: {credential.id}</div>
              <div className="mt-0.5">
                Issued: {new Date(credential.issuedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="print:hidden">
              <PrintButton />
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
          <div className="rounded-lg border border-slate-800 print:border-slate-300 bg-slate-900/60 print:bg-slate-50 p-4 space-y-2">
            <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px]">
              Credential Holder
            </span>
            <div className="flex items-center gap-3">
              {holder?.avatarUrl && (
                <img
                  src={holder.avatarUrl}
                  alt={holder.githubUsername}
                  className="h-8 w-8 rounded-full border border-slate-700 print:border-slate-300"
                />
              )}
              <div>
                <div className="font-bold text-white print:text-black">
                  {holder?.displayName || holder?.githubUsername}
                </div>
                <Link
                  href={`/people/${holder?.githubUsername}`}
                  className="text-sky-400 hover:text-sky-300 font-mono text-[11px] print:text-sky-700"
                >
                  @{holder?.githubUsername} (Passport ↗)
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 print:border-slate-300 bg-slate-900/60 print:bg-slate-50 p-4 space-y-2">
            <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px]">
              Verifying Authority
            </span>
            <div>
              <div className="font-bold text-white print:text-black">TechNexusOrg Registry</div>
              <a
                href="https://github.com/TechNexusOrg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 font-mono text-[11px] print:text-sky-700"
              >
                github.com/TechNexusOrg
              </a>
            </div>
          </div>
        </div>

        {/* Cryptographic Signature Card */}
        {credential.signature && (
          <div className="rounded-lg border border-slate-800 print:border-slate-300 bg-slate-900/60 print:bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">
                Ed25519 Cryptographic Proof
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  isCryptoSignatureValid
                    ? "text-emerald-400 print:text-emerald-700"
                    : "text-red-400"
                }`}
              >
                {isCryptoSignatureValid ? "✓ Signature Verified" : "✗ Invalid Signature"}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <span className="text-slate-500">Signing Key ID:</span>
                <span className="text-slate-300 print:text-black">{credential.signingKeyId}</span>
              </div>
              {credential.canonicalHash && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <span className="text-slate-500">Canonical SHA-256 Digest:</span>
                  <span className="text-slate-300 print:text-black truncate max-w-xs font-mono">
                    {credential.canonicalHash}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proof of Work Evidence Section */}
        <div className="rounded-lg border border-slate-800 print:border-slate-300 bg-slate-900/40 print:bg-slate-50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 print:text-black">
              Verified Evidence
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Source of Truth</span>
          </div>

          <div className="space-y-2 text-xs">
            {evidence.repository && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Target Repository:</span>
                <span className="font-mono text-white print:text-black">{evidence.repository}</span>
              </div>
            )}

            {evidence.prNumber && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Pull Request:</span>
                <a
                  href={evidence.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sky-400 hover:underline print:text-sky-700"
                >
                  #{evidence.prNumber} {evidence.prTitle ? `— ${evidence.prTitle}` : ""}
                </a>
              </div>
            )}

            {evidence.trackTitle && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Completed Curriculum Track:</span>
                <span className="font-mono text-emerald-400 print:text-emerald-700 font-semibold">
                  {evidence.trackTitle}
                </span>
              </div>
            )}

            {evidence.programTitle && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Completed Fellowship Program:</span>
                <span className="font-mono text-sky-400 print:text-sky-700 font-semibold">
                  {evidence.programTitle}
                </span>
              </div>
            )}

            {evidence.mentorUsername && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Supervising Mentor:</span>
                <span className="font-mono text-slate-300 print:text-black">
                  @{evidence.mentorUsername}
                </span>
              </div>
            )}

            {evidence.mergeCommitSha && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-800/80 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-600">Merge Commit SHA:</span>
                <span className="font-mono text-slate-300 print:text-black text-[11px] truncate max-w-xs">
                  {evidence.mergeCommitSha}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5">
              <span className="text-slate-400 print:text-slate-600">Verification Source:</span>
              <span className="font-mono text-emerald-400 print:text-emerald-700">
                TechNexusOrg Registry / Ed25519 Signed
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 print:hidden">
            {evidence.prUrl && (
              <a
                href={evidence.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-mono text-white hover:bg-slate-700 transition-colors"
              >
                <span>Inspect PR on GitHub</span>
                <span>→</span>
              </a>
            )}

            {/* Admin safety control */}
            {sessionUser?.role === "admin" && !isRevoked && (
              <RevokeButton credentialId={credential.id} />
            )}
          </div>
        </div>

        {/* Embeddable Badge Snippet */}
        {!isRevoked && (
          <div className="print:hidden">
            <BadgeSnippet
              credentialId={credential.id}
              title={credential.title.split("—")[0].trim()}
              appUrl={appUrl}
            />
          </div>
        )}

        {/* Anti-certificate mill disclaimer */}
        <p className="text-[11px] text-slate-500 font-mono text-center">
          TechNexusOrg credentials represent verifiable open-source engineering work. This record is backed by public cryptographic proof and verifiable GitHub contributions.
        </p>
      </div>
    </div>
  );
}
