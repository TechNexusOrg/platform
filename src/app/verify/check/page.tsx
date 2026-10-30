import { VerifyLookupForm } from "./VerifyLookupForm";
import Link from "next/link";
import { ShieldCheck, Key, Lock, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Verify Credential — TechNexusOrg Registry",
  description:
    "Verify TechNexusOrg student credentials, fellowships, and contributor passports using Ed25519 digital signatures and public JWKS keys.",
};

export default function VerifyCheckPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck className="h-4 w-4" />
            <span>Public Credential Registry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono uppercase">
            Verify Proof of Work
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Instant verification for employer background checks, university
            credit validation, and open-source fellowship credentials.
          </p>
        </div>

        <div className="bento-card p-6 sm:p-8">
          <VerifyLookupForm />
        </div>

        {/* Cryptographic Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-semibold">
              <Key className="h-4 w-4" />
              <span>Ed25519 Asymmetric</span>
            </div>
            <p className="text-xs text-slate-400">
              Each credential is cryptographically signed at issuance using our
              secure Ed25519 key.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>GitHub Commit Proof</span>
            </div>
            <p className="text-xs text-slate-400">
              All credentials link directly to immutable pull requests merged on
              GitHub.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-semibold">
              <Lock className="h-4 w-4" />
              <span>Open JWKS Endpoint</span>
            </div>
            <p className="text-xs text-slate-400">
              Third-party automated verifiers can fetch our public keys at{" "}
              <Link
                href="/api/verify/keys"
                className="text-sky-400 underline font-mono"
              >
                /api/verify/keys
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
