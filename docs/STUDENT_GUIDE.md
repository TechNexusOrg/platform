# TechNexusOrg Student & Contributor Guide

Welcome to **TechNexusOrg**.

Our core philosophy is simple and direct:

> **Build real software. Make real contributions. Build public proof of work.**

This guide is written for students and early-career developers. Even if you have never used Git, GitHub, or contributed to an open-source project before, this guide will walk you through the entire journey step by step.

---

## 1. What TechNexusOrg Is (and What It Is Not)

### What TechNexusOrg Is:
- A GitHub-native engineering platform that guides you from zero to making verified open-source pull requests.
- A platform with real repositories, real issues, code reviews from maintainers, and publicly verifiable contribution records.
- A permanent home for your **Contributor Passport** that demonstrates what code you actually wrote and merged.

### What TechNexusOrg Is Not:
- **It is NOT a certificate-selling website.** You cannot buy credentials, and you cannot earn them merely by clicking buttons or completing quizzes.
- **It is NOT an automated spam machine.** Low-effort typo PRs, duplicate issues, and bot spam are rejected and disqualify users from progression.
- **It does NOT guarantee employment, internships, or recruiter placement.** Real open-source experience is valuable because it proves competence, not because of empty promises.

---

## 2. Why GitHub Is the Source of Truth

In professional software engineering, **code repositories and Git commit histories are canonical evidence of competence**.

TechNexusOrg connects directly to GitHub OAuth and ingests real-time GitHub Webhook events. When your pull request is merged into an official repository:
1. GitHub cryptographically signs the webhook delivery (`X-Hub-Signature-256`).
2. TechNexusOrg verifies the delivery and records your merge commit SHA, pull request number, repository, and timestamp.
3. Your Contributor Passport and verifiable credentials update automatically based on this immutable evidence.

---

## 3. Core Terminology: The Open Source Vocabulary

- **Repository ("Repo"):** A project's storage location on GitHub containing all its code, history, and configuration files.
- **Issue:** A reported bug, feature request, or task that needs to be addressed in the codebase.
- **Fork:** Your personal copy of someone else's repository on your own GitHub account.
- **Clone:** Downloading a local copy of the repository onto your personal computer.
- **Branch:** An isolated workspace within Git where you write changes without affecting the main code.
- **Commit:** A saved snapshot of code changes accompanied by a descriptive message.
- **Pull Request ("PR"):** A formal request asking project maintainers to review and pull your branch into the official repository.
- **Code Review:** Feedback provided by maintainers on your PR to ensure code quality, test coverage, and security.
- **Merge:** When maintainers accept and incorporate your code into the project's main branch.

---

## 4. The 10-Step Contributor Lifecycle

```text
Visitor
   ↓
1. Join with GitHub (/join)
   ↓
2. Complete Profile Onboarding (/onboarding)
   ↓
3. Get Matched with Curated Open Issues (/issues)
   ↓
4. Claim an Issue (7-day lease)
   ↓
5. Fork, Clone & Build Locally
   ↓
6. Open Pull Request referencing "Fixes #<number>"
   ↓
7. Participate in Maintainer Code Review
   ↓
8. PR Merged by Repository Maintainers
   ↓
9. Verified Proof of Work Recorded
   ↓
10. Contributor Passport & Credentials Minted
```

---

## 5. Step-by-Step Tutorial: Making Your First Contribution

### Step A: Claiming Your Issue
1. Navigate to `/issues` and filter for **Beginner** or **Good First Issue**.
2. Click on the issue title to open the **Contribution Workspace**.
3. Click **"Claim this issue"**. This reserves the issue for you for **7 days**, preventing others from duplicating your work.

### Step B: Forking the Repository
1. Open the repository on GitHub (e.g. `https://github.com/TechNexusOrg/platform`).
2. Click the **Fork** button in the upper right corner of the GitHub interface.
3. This creates a copy under your account: `https://github.com/<your-username>/<repo>`.

### Step C: Cloning to Your Computer
Open your terminal (macOS/Linux) or PowerShell/WSL (Windows) and run:

```bash
# Clone your personal fork
git clone https://github.com/<your-username>/<repo>.git

# Change into the project directory
cd <repo>
```

### Step D: Creating a Feature Branch
Never make changes directly on `main`. Always create a descriptive branch:

```bash
# Create and switch to a new branch
git checkout -b fix/issue-123
```

### Step E: Installing Dependencies & Running Tests
Before writing any new code, verify that the existing project builds and passes tests:

```bash
# Install packages
npm install

# Run the test suite
npm test

# Check TypeScript types
npm run typecheck
```

### Step F: Implementing Your Changes
- Make your code edits using your code editor (e.g., VS Code).
- Write or update unit tests to verify your fix.
- Re-run `npm test` and `npm run typecheck` to confirm zero regressions.

### Step G: Committing Your Work
Write clear, meaningful Git commit messages:

```bash
# Stage modified files
git add .

# Commit with descriptive message
git commit -m "fix: resolve issue #123 by handling nullish values"
```

### Step H: Pushing Your Branch
Push your branch to your GitHub fork:

```bash
git push -u origin fix/issue-123
```

### Step I: Opening the Pull Request
1. Go to the original TechNexusOrg repository on GitHub.
2. You will see a banner: *"fix/issue-123 had recent pushes"*. Click **"Compare & pull request"**.
3. Use the following standard PR template:

```markdown
## Summary
Resolves issue #123 by ensuring undefined properties fall back to safe defaults.

## Changes
- Updated src/lib/example.ts to guard against null inputs
- Added unit tests in src/lib/example.test.ts

## Testing
- npm test passed (55/55 tests)
- npm run typecheck passed

Fixes #123
```

> **Crucial Rule:** The phrase **`Fixes #123`** (or `Closes #123`) is essential! It enables TechNexusOrg and GitHub to link your PR directly to your active claim.

---

## 6. Code Review & How to Respond to Feedback

Receiving review comments is standard in professional software engineering. It is not criticism—it is how maintainers maintain high software standards and mentor early developers.

- **Changes Requested:** Maintainers will leave comments explaining adjustments needed (e.g., *"Please add a test for edge case X"*).
- **How to Update:** Make the changes in your local branch, commit them, and run `git push origin fix/issue-123`. The existing Pull Request updates automatically. Never open a second PR for the same issue!
- **Approved:** Once approved, maintainers will merge your PR.

---

## 7. What Happens After Merge?

1. Within seconds of maintainers merging your pull request on GitHub, a secure webhook notifies TechNexusOrg.
2. Your active claim is marked as **completed**.
3. Your pull request is recorded as a **verified contribution**.
4. If this was your first pull request, you earn the **First PR Merged** verifiable credential.
5. Your **Contributor Passport** (`/people/<your-username>`) updates immediately with your public proof of work.

---

## 8. Contributor Progression Model

Progression reflects genuine engineering experience, not arbitrary numbers:

| Level | Criteria |
| :--- | :--- |
| **Explorer** | Completed onboarding profile. Ready to claim first task. |
| **Contributor** | Merged at least 1 legitimate, reviewed PR on an official project. |
| **Active Contributor** | Merged 3+ legitimate PRs across official projects. |
| **Core Contributor** | Merged 5+ PRs, completed 2+ peer code reviews, contributed across 2+ projects, and resolved 2+ issues. |
| **Maintainer** | Explicit stewardship appointment by organization leaders. |
| **Project Lead** | Technical lead driving repository architecture and releases. |
| **Mentor** | Experienced engineer recognized for guiding new contributors. |

---

## 9. The Founding 1,000 Cohort

The **Founding 1,000** registry honors the first 1,000 qualifying contributors who make a legitimate, reviewed, and merged open-source contribution to official TechNexusOrg repositories.

- Registration alone **never** reserves a slot.
- Slot allocation is strictly sequential (1 to 1000) and atomic upon your first verified PR merge.
- Founding members receive a permanent verifiable credential and distinctive badge on their Contributor Passport.

---

## 10. Getting Help & Mentorship

If you are stuck on an issue you claimed:
1. Re-read the issue description and error stack traces.
2. Check the repository's `CONTRIBUTING.md` and documentation.
3. Navigate to **`/dashboard/mentorship`** on TechNexusOrg.
4. Select your active issue and explain your blocker clearly.
5. A maintainer or mentor will reply with guidance directly in your thread.

---

## 11. Anti-Gaming Rules & Community Etiquette

To protect the integrity of our platform and maintainers' time:
- **No Plagiarism:** Never copy another contributor's code or PR.
- **No AI Slop:** Do not copy-paste unverified, hallucinations from LLMs without understanding the code and verifying it locally.
- **No Spam PRs:** Trivial typo PRs or cosmetic whitespace changes solely to game numbers are rejected and subject to account suspension.
- **Respect Maintainer Time:** Read existing issues before asking questions already documented in READMEs.

---

## 12. Security Reporting

If you discover a security vulnerability in any TechNexusOrg repository or platform service, please do not file a public issue. Report it responsibly to `security@technexus.org` or via GitHub Security Advisories.
