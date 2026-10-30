import { PartnerProposalForm } from "./PartnerProposalForm";
import {
  Building2,
  GraduationCap,
  GitPullRequest,
  Award,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Partner With TechNexusOrg — Universities & Industry",
  description:
    "Collaborate with TechNexusOrg to launch student open-source engineering cohorts, sponsor project tracks, and build genuine pipelines with verified proof of work.",
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Institutional Collaboration Network
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
            Build Genuine Pipelines With <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              Verified Proof of Work
            </span>
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Partner with TechNexusOrg to support student open-source
            engineering. Move past artificial certificate inflation with
            auditable GitHub deliverables, maintainer code reviews, and Ed25519
            cryptographic credentials.
          </p>
        </div>

        {/* Partnership Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bento-card p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              University Capstones
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrate semester-long open-source project tracks into your
              college computer science curriculum. Students build real systems
              and receive external maintainer feedback.
            </p>
            <div className="pt-2 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verifiable student transcripts</span>
            </div>
          </div>

          <div className="bento-card p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Sponsored 8-Week Cohorts
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sponsor dedicated internship cohorts focused on your technical
              stack (Go, Rust, Next.js, Cloud-Native). Supervised deliverables
              ensure legitimate engineering impact.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>Dedicated weekly PR audits</span>
            </div>
          </div>

          <div className="bento-card p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Evidence-Based Hiring
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Skip traditional algorithmic resume screening. Inspect candidates
              with hundreds of verified commits, passing CI pipelines, and peer
              code reviews across public repositories.
            </p>
            <div className="pt-2 text-[11px] font-mono text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero fabricated resume claims</span>
            </div>
          </div>
        </div>

        {/* Proposal Submission Section */}
        <div className="max-w-3xl mx-auto">
          <PartnerProposalForm />
        </div>
      </div>
    </div>
  );
}
