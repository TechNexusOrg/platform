"use client";

import * as React from "react";
import { useState } from "react";
import { Building2, Send, CheckCircle2, AlertCircle } from "lucide-react";

export function PartnerProposalForm() {
  const [formData, setFormData] = useState({
    organizationName: "",
    contactName: "",
    contactEmail: "",
    partnerType: "company",
    proposalType: "project_partnership",
    summary: "",
    targetTechnologies: "",
    estimatedStudentCapacity: 15,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const techArray = formData.targetTechnologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/partners/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimatedStudentCapacity: Number(formData.estimatedStudentCapacity),
          targetTechnologies: techArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proposal");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-4 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold font-mono text-white">
          Proposal Received
        </h3>
        <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Thank you for proposing a collaboration with TechNexusOrg. Our
          engineering team reviews incoming institutional proposals weekly. We
          will reach out to{" "}
          <span className="font-mono text-emerald-400">
            {formData.contactEmail}
          </span>{" "}
          with next steps.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setFormData({
              organizationName: "",
              contactName: "",
              contactEmail: "",
              partnerType: "company",
              proposalType: "project_partnership",
              summary: "",
              targetTechnologies: "",
              estimatedStudentCapacity: 15,
            });
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-mono text-slate-200 hover:bg-slate-700"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bento-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white font-mono">
            Submit Partnership Proposal
          </h2>
          <p className="text-xs text-slate-400">
            Collaborate on student projects, sponsored cohorts, or hiring
            pipelines.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Organization / University Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Acme Cloud Corp or Tech Institute"
            value={formData.organizationName}
            onChange={(e) =>
              setFormData({ ...formData, organizationName: e.target.value })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Contact Person Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dr. Jane Smith or Rahul Sharma"
            value={formData.contactName}
            onChange={(e) =>
              setFormData({ ...formData, contactName: e.target.value })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Contact Work Email *
          </label>
          <input
            type="email"
            required
            placeholder="jane@organization.org"
            value={formData.contactEmail}
            onChange={(e) =>
              setFormData({ ...formData, contactEmail: e.target.value })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Organization Category *
          </label>
          <select
            value={formData.partnerType}
            onChange={(e) =>
              setFormData({ ...formData, partnerType: e.target.value })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
          >
            <option value="company">Technology Company / Startup</option>
            <option value="university">University / Engineering College</option>
            <option value="open_source_collective">
              Open Source Collective / Foundation
            </option>
            <option value="other">Other Community / Non-profit</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Collaboration Focus *
          </label>
          <select
            value={formData.proposalType}
            onChange={(e) =>
              setFormData({ ...formData, proposalType: e.target.value })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
          >
            <option value="project_partnership">
              Project Partnership (Propose Open Source Project)
            </option>
            <option value="cohort_sponsorship">
              Sponsored 8-Week Internship Cohort
            </option>
            <option value="mentorship_program">
              Staff Mentorship &amp; Guest Code Reviews
            </option>
            <option value="hiring_pipeline">
              Direct Hiring Pipeline &amp; Talent Scouting
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Target Student Capacity
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={formData.estimatedStudentCapacity}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedStudentCapacity: Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
          Target Technologies (comma separated)
        </label>
        <input
          type="text"
          placeholder="e.g. Go, Rust, Next.js, Linux, Docker, PostgreSQL"
          value={formData.targetTechnologies}
          onChange={(e) =>
            setFormData({ ...formData, targetTechnologies: e.target.value })
          }
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
          Proposal Overview &amp; Goals *
        </label>
        <textarea
          required
          rows={4}
          placeholder="Describe your initiative, expected engineering deliverables, timeline, or student support mechanisms..."
          value={formData.summary}
          onChange={(e) =>
            setFormData({ ...formData, summary: e.target.value })
          }
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 focus:outline-none disabled:opacity-50 transition-all shadow-md shadow-sky-500/20"
      >
        <Send className="h-4 w-4" />
        <span>
          {loading ? "Submitting Proposal..." : "Submit Institutional Proposal"}
        </span>
      </button>
    </form>
  );
}
