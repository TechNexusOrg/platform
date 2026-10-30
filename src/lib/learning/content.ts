export interface LessonSeed {
  slug: string;
  title: string;
  estimatedMinutes: number;
  orderIndex: number;
  content: string;
  assignment?: {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    submissionType: "github_pr" | "text_submission" | "terminal_output";
  };
}

export interface ModuleSeed {
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: LessonSeed[];
}

export interface TrackSeed {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  isPublished: boolean;
  orderIndex: number;
  prerequisites: string[];
  objectives: string[];
  modules: ModuleSeed[];
}

export const PILOT_LEARNING_TRACKS: TrackSeed[] = [
  {
    slug: "linux-fundamentals",
    title: "Linux Fundamentals and Administration",
    description:
      "Master POSIX system architecture, shell navigation, process management, storage operations, and systemd service administration through practical hands-on exercises.",
    difficulty: "beginner",
    estimatedHours: 12,
    isPublished: true,
    orderIndex: 1,
    prerequisites: [
      "Basic terminal familiarity",
      "Access to a modern Linux distribution (Ubuntu 22.04+, Debian, Fedora) or WSL2",
    ],
    objectives: [
      "Understand the POSIX filesystem hierarchy and execute standard shell operations with pipes and streams",
      "Manage Linux file permissions (rwx), ownership, and special security bits (SUID, SGID, Sticky bit)",
      "Inspect, monitor, and signal processes using ps, top, htop, and kill",
      "Work with block devices, filesystems, and persistent mounts via /etc/fstab",
      "Perform network diagnostics and configure hardened SSH key-based access",
      "Write, manage, and debug systemd services, timers, and inspect system journals",
    ],
    modules: [
      {
        slug: "sys-navigation-basics",
        title: "System Navigation & Shell Basics",
        description:
          "Explore the Linux Filesystem Hierarchy Standard, standard I/O redirection, pipeline mechanics, and file inspection tools.",
        orderIndex: 1,
        lessons: [
          {
            slug: "posix-shell-hierarchy",
            title: "Introduction to POSIX Shell & File Hierarchy",
            estimatedMinutes: 20,
            orderIndex: 1,
            content: `## 1. The POSIX Shell Environment

The POSIX shell is the unified interface between the developer and the operating system kernel. Unlike graphical interfaces that obscure internal system state, the shell gives you direct control over process execution, input/output streams, and system configuration.

### Standard I/O Streams
Every Linux process starts with three default file descriptors:
- **\`stdin\` (Descriptor 0)**: Standard input (default: keyboard)
- **\`stdout\` (Descriptor 1)**: Standard output (default: terminal screen)
- **\`stderr\` (Descriptor 2)**: Standard error (default: terminal screen)

#### Redirection & Pipelines
- \`command > file.txt\`: Redirect stdout, overwriting file.txt
- \`command >> file.txt\`: Redirect stdout, appending to file.txt
- \`command 2> error.log\`: Redirect stderr only
- \`command > output.log 2>&1\`: Redirect both stdout and stderr to the same file
- \`cmd1 | cmd2\`: Connect stdout of cmd1 directly to stdin of cmd2 via an anonymous kernel buffer

\`\`\`bash
# Example: Filter active SSH listening sockets and count them
ss -tulpn | grep ":22" | wc -l
\`\`\`

---

## 2. The Filesystem Hierarchy Standard (FHS)

Linux treats everything as a file (or byte stream). The directory structure follows the standardized FHS:
- \`/bin\`, \`/sbin\`: Essential binaries for all users and system administration (often symlinked to \`/usr/bin\`)
- \`/etc\`: System-wide configuration files (plain text, human editable)
- \`/home\`: User home directories containing personal configs and projects
- \`/var\`: Variable data such as logs (\`/var/log\`), spools, and databases
- \`/proc\`: Virtual filesystem exposing live kernel and process data (e.g., \`/proc/cpuinfo\`, \`/proc/[pid]/\`)
- \`/sys\`: Virtual filesystem representing kernel subsystems, hardware, and device drivers
- \`/tmp\`: Temporary files, often cleared on reboot

---

## 3. Essential Navigation & Search Commands

\`\`\`bash
# List directory contents with permissions, sizes in human-readable format
ls -lah /var/log

# Create nested directory trees
mkdir -p ~/projects/technexus/pilot

# Fast searching by file name in directory tree
find /etc -name "*.conf" -type f 2>/dev/null

# Search inside file contents recursively with line numbers
grep -rn "ListenAddress" /etc/ssh/
\`\`\`

---

## Hands-On Exercise
1. In your terminal, inspect your kernel version and architecture using \`uname -a\`.
2. Find all \`.conf\` files inside \`/etc/systemd/\` and count the total number using a single piped command:
   \`\`\`bash
   find /etc/systemd -name "*.conf" | wc -l
   \`\`\`
3. Verify that your standard streams work as expected by redirecting a directory listing to \`/tmp/test_fhs.log\`.`,
          },
          {
            slug: "file-permissions-security",
            title: "File Permissions, Ownership, and Security",
            estimatedMinutes: 25,
            orderIndex: 2,
            content: `## 1. The Linux Permission Model

Linux enforces multi-user access security through discretionary access control (DAC). Every file and directory has an **Owner**, a **Group**, and an **Others** category.

### The Permission Bits
- **Read (\`r\` / \`4\`)**: View file contents or list directory contents.
- **Write (\`w\` / \`2\`)**: Modify file contents or create/delete files in a directory.
- **Execute (\`x\` / \`1\`)**: Run file as binary/script or traverse (\`cd\`) into a directory.

\`\`\`
- rwx r-x r-- 1 alice developers 4096 Oct 30 10:00 deploy.sh
  ^^^ ^^^ ^^^   ^^^^^ ^^^^^^^^^^
   |   |   |      |       |
   |   |   |      |       +-- Group ownership
   |   |   |      +---------- User ownership
   |   |   +----------------- Others permissions (4 = read-only)
   |   +--------------------- Group permissions (5 = read + execute)
   +------------------------- User permissions (7 = read + write + execute)
\`\`\`

---

## 2. Modifying Permissions & Ownership

### Symbolic vs Octal Notation
\`\`\`bash
# Octal mode: 755 (User: rwx, Group: rx, Others: rx)
chmod 755 deploy.sh

# Symbolic mode: Add execute for user only
chmod u+x build.sh

# Restrict sensitive configuration file to owner read/write only
chmod 600 ~/.ssh/id_ed25519

# Change owner and group recursively
sudo chown -R alice:developers /opt/apps/backend
\`\`\`

---

## 3. Special Permissions: SUID, SGID, and Sticky Bit

1. **SUID (Set User ID - \`4000\`)**: The executable runs with the privileges of the file owner, not the caller (e.g., \`/usr/bin/passwd\`).
2. **SGID (Set Group ID - \`2000\`)**:
   - On files: runs with group privileges.
   - On directories: newly created files inherit the parent directory's group instead of the creator's primary group.
3. **Sticky Bit (\`1000\`)**:
   - On directories: only the file owner or root can delete or rename files within it (e.g., \`/tmp\`).

\`\`\`bash
# Setting SGID on a shared project directory
chmod 2775 /var/www/shared

# Setting Sticky bit on a shared scratch directory
chmod 1777 /tmp/scratch
\`\`\`

---

## Hands-On Exercise
1. Create a directory \`/tmp/perm_test\` and set permissions such that only your user can read and write files inside it (\`chmod 700\`).
2. Verify that creating a file inside it inherits proper default permissions derived from your \`umask\`.`,
          },
        ],
      },
      {
        slug: "process-and-storage",
        title: "Process Management & Storage",
        description:
          "Monitor running workloads, manage process signals, inspect storage devices, and configure persistent filesystem mounts.",
        orderIndex: 2,
        lessons: [
          {
            slug: "processes-signals-monitoring",
            title: "Processes, Signals, and System Monitoring",
            estimatedMinutes: 25,
            orderIndex: 1,
            content: `## 1. Process Lifecycle and States

Every task running in Linux is a process identified by a unique **Process ID (PID)**. Every process (except \`systemd\` at PID 1) is spawned by a **Parent Process (PPID)** via the \`fork()\` and \`exec()\` system calls.

### Primary Process States
- **R (Running / Runnable)**: Actively computing or in the CPU scheduler queue.
- **S (Interruptible Sleep)**: Waiting for an event or I/O operation.
- **D (Uninterruptible Sleep)**: Waiting for device I/O (cannot be killed with signals).
- **Z (Zombie)**: Terminated, but parent has not yet read exit status via \`wait()\`.
- **T (Stopped)**: Paused by job control signal (\`SIGTSTP\` / \`Ctrl+Z\`).

---

## 2. Inspecting and Monitoring Workloads

\`\`\`bash
# Standard snapshot of all running processes with user attribution
ps aux | head -n 15

# View tree representation of parent-child hierarchy
pstree -p

# Real-time process monitor
top -b -n 1 | head -n 20
\`\`\`

---

## 3. Signals and Termination

Linux communicates events to processes using POSIX signals:
- **\`SIGTERM\` (Signal 15)**: Graceful shutdown request. The application cleans up connections, commits state, and exits.
- **\`SIGKILL\` (Signal 9)**: Immediate kernel-level destruction. The application cannot intercept or handle this signal.
- **\`SIGHUP\` (Signal 1)**: Hangup signal, conventionally used to trigger configuration reload without process restart.
- **\`SIGINT\` (Signal 2)**: Interrupt sent by terminal when typing \`Ctrl+C\`.

\`\`\`bash
# Send graceful SIGTERM to process with PID 1420
kill -15 1420

# Forcefully kill runaway process by name
pkill -9 -f "bad_worker"
\`\`\`

---

## 4. Background and Foreground Job Control

\`\`\`bash
# Start a long-running process in background
python3 worker.py > worker.log 2>&1 &

# View active background jobs in current shell
jobs -l

# Bring background job 1 to foreground
fg %1
\`\`\``,
          },
          {
            slug: "storage-filesystems-mounts",
            title: "Storage, Filesystems, and Mounts",
            estimatedMinutes: 30,
            orderIndex: 2,
            content: `## 1. Block Devices and Filesystems

Linux accesses physical and virtual storage through block special devices located in \`/dev/\` (e.g., \`/dev/sda\`, \`/dev/nvme0n1\`, \`/dev/vda\`).

Before storage can store files, it must be formatted with a filesystem (such as **ext4** or **xfs**), which manages metadata, directories, inodes, and data blocks.

\`\`\`bash
# List all block devices, sizes, and mount points
lsblk -f

# View filesystem disk space usage in human-readable units
df -hT

# Check size of specific directory tree
du -sh /var/log/
\`\`\`

---

## 2. Mounting Devices & Inodes

A storage partition must be attached to an existing directory (mount point) in the root tree.

\`\`\`bash
# Mount a partition read-write
sudo mount /dev/sdb1 /mnt/data

# Unmount cleanly
sudo umount /mnt/data
\`\`\`

### Inodes and Links
An **inode** is a data structure storing file metadata (permissions, owner, size, timestamps, block pointers), excluding the file name.
- **Hard Link (\`ln target link\`)**: Creates a second directory entry pointing to the same inode. Both have identical permissions and cannot cross filesystem boundaries.
- **Symbolic (Soft) Link (\`ln -s target link\`)**: A special file containing the path string to the target file. Can point across filesystems and to directories.

---

## 3. Persistent Mounts with /etc/fstab

On boot, \`systemd\` reads \`/etc/fstab\` to mount persistent volumes automatically. Modern best practice uses the filesystem **UUID** rather than device names (which may change on hardware re-enumeration).

\`\`\`bash
# Obtain filesystem UUID
sudo blkid /dev/sdb1
\`\`\`

Example entry in \`/etc/fstab\`:
\`\`\`
UUID=3b8f67e0-91a2-4a5c-897b-891d4e123456  /mnt/data  ext4  defaults,noatime  0  2
\`\`\`

---

## Hands-On Exercise
1. Run \`lsblk\` and identify the filesystem type of your root mount \`/\`.
2. Inspect inode usage on your system with \`df -i\`.`,
          },
        ],
      },
      {
        slug: "networking-service-admin",
        title: "Networking & Service Administration",
        description:
          "Diagnose network interfaces, configure hardened SSH access, and author production systemd service units.",
        orderIndex: 3,
        lessons: [
          {
            slug: "network-diagnostics-ssh",
            title: "Network Diagnostics and SSH Hardening",
            estimatedMinutes: 25,
            orderIndex: 1,
            content: `## 1. Modern Network Diagnostics

Linux provides the \`iproute2\` suite for inspecting and manipulating network interfaces, routing tables, and ARP caches.

\`\`\`bash
# List all network interfaces and assigned IP addresses
ip -br addr

# View kernel routing table
ip route show

# Inspect listening TCP and UDP sockets with process names
sudo ss -tulpn

# Test endpoint connectivity and port availability
nc -zv 1.1.1.1 53
curl -Iv https://github.com
\`\`\`

---

## 2. SSH Architecture and Key-Based Authentication

SSH (Secure Shell) provides encrypted transport for remote administration. Using Ed25519 public-key cryptography replaces vulnerable password authentication.

### Key Generation and Deployment
\`\`\`bash
# Generate modern Ed25519 keypair with comments
ssh-keygen -t ed25519 -C "contributor@technexus.org"

# Copy public key to remote server authorized_keys
ssh-copy-id -i ~/.ssh/id_ed25519.pub student@server.internal
\`\`\`

---

## 3. Hardening /etc/ssh/sshd_config

Production servers must enforce strict SSH daemon settings:
\`\`\`ini
# /etc/ssh/sshd_config.d/99-hardened.conf
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
\`\`\`

Always test SSH configuration before restarting the daemon:
\`\`\`bash
sudo sshd -t
sudo systemctl reload sshd
\`\`\``,
          },
          {
            slug: "systemd-services-journald",
            title: "Systemd Services, Logging, and Journald",
            estimatedMinutes: 35,
            orderIndex: 2,
            content: `## 1. Systemd Architecture

\`systemd\` is the init system and service manager for modern Linux (PID 1). It manages dependencies, mounts, sockets, and daemon lifecycles through declarative **Unit files**.

### Systemctl Command Suite
\`\`\`bash
# Check service health and recent logs
systemctl status nginx

# Start / Stop / Restart
sudo systemctl start myapp
sudo systemctl restart myapp

# Enable automatic startup on boot
sudo systemctl enable myapp

# Reload configuration files after editing unit definitions
sudo systemctl daemon-reload
\`\`\`

---

## 2. Authoring a Production Service Unit

Service unit definitions reside in \`/etc/systemd/system/<name>.service\`:

\`\`\`ini
[Unit]
Description=TechNexus Health Monitoring Service
After=network.target

[Service]
Type=simple
User=technexus
Group=technexus
WorkingDirectory=/opt/technexus/monitor
ExecStart=/usr/bin/python3 /opt/technexus/monitor/health.py
Restart=always
RestartSec=5s
Environment=NODE_ENV=production
LimitNOFILE=65535

# Hardening directives
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
\`\`\`

---

## 3. System Logging with Journald

\`journald\` collects structured logs from the kernel, services, and stdout/stderr of managed processes.

\`\`\`bash
# Tail live logs for a specific service unit
journalctl -u myapp.service -f

# Filter logs since previous boot with error priority or higher
journalctl -b -p err

# Export logs in JSON format for telemetry pipelines
journalctl -u myapp.service -n 50 -o json-pretty
\`\`\``,
            assignment: {
              title: "Linux System Health Monitor Daemon",
              description:
                "Author a bash or python health monitoring script and create a managed systemd service unit. Submit the terminal output showing systemctl status and journalctl logs proving successful execution.",
              acceptanceCriteria: [
                "Service unit file contains proper [Unit], [Service], and [Install] sections",
                "Service executes under a non-root user account with Restart=always policy",
                "Health script logs CPU and memory usage to stdout/journald every 10 seconds",
                "Terminal output verifies active (running) status and clean journald logs",
              ],
              submissionType: "terminal_output",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "git-open-source",
    title: "Git and Professional Open-Source Development",
    description:
      "Learn production-grade Git workflows, commit hygiene, conflict resolution, rebase mechanics, semantic PRs, and open-source contribution standards.",
    difficulty: "intermediate",
    estimatedHours: 14,
    isPublished: true,
    orderIndex: 2,
    prerequisites: [
      "Basic command-line and terminal navigation skills",
      "An active GitHub account with SSH or PAT credentials configured",
    ],
    objectives: [
      "Understand the Git Directed Acyclic Graph (DAG) and internal object storage",
      "Apply professional branching models and differentiate merge versus rebase strategies",
      "Master interactive rebasing (git rebase -i) and squash messy histories into atomic commits",
      "Resolve complex 3-way merge conflicts accurately using standard Git tools",
      "Author atomic commits adhering to the Conventional Commits specification",
      "Integrate automated linting and testing checks via GitHub Actions CI",
    ],
    modules: [
      {
        slug: "git-foundations",
        title: "Version Control Foundations & Architecture",
        description:
          "Dive into Git internal objects, Directed Acyclic Graph structure, and branching mechanics.",
        orderIndex: 1,
        lessons: [
          {
            slug: "git-internals-dag-objects",
            title: "Git Internals, DAG, and Object Storage",
            estimatedMinutes: 25,
            orderIndex: 1,
            content: `## 1. What Git Really Is

Git is not merely a file history tracker; it is a **content-addressable filesystem** with a VCS user interface built on top of a **Directed Acyclic Graph (DAG)** of immutable objects.

### The Four Object Types
Every object stored in \`.git/objects/\` is compressed with zlib and identified by the SHA-1 (or SHA-256) hash of its type, size, and content:
1. **Blob**: Raw file contents (does not store file name or permissions).
2. **Tree**: Represents a directory. Stores file names, permissions, and references to blob or child tree SHA hashes.
3. **Commit**: Contains a pointer to a root tree, author and committer metadata, timestamps, a log message, and zero or more parent commit hashes.
4. **Annotated Tag**: A permanent pointer to a specific commit object with a cryptographic signature and message.

\`\`\`bash
# Inspect the type of an object from its hash
git cat-file -t HEAD

# Print formatted contents of the root tree
git cat-file -p HEAD^{tree}
\`\`\`

---

## 2. The Three Trees
- **Working Directory**: The active sandbox where you edit files on disk.
- **Index (Staging Area)**: The binary cache at \`.git/index\` representing the exact snapshot destined for the next commit.
- **HEAD (Committed Snapshot)**: A pointer referencing the current branch commit.

---

## 3. Plumbing vs Porcelain

Git commands divide into user-friendly **Porcelain** (\`git commit\`, \`git status\`, \`git checkout\`) and low-level **Plumbing** (\`git hash-object\`, \`git write-tree\`, \`git commit-tree\`). Understanding plumbing gives you complete control when debugging repository corruption or detached HEAD states.`,
          },
          {
            slug: "branching-merge-vs-rebase",
            title: "Branching Strategies and Merge vs Rebase",
            estimatedMinutes: 25,
            orderIndex: 2,
            content: `## 1. Branches are Lightweight Pointers

In Git, a branch is not a copy of code. A branch is simply a 41-byte plain-text file in \`.git/refs/heads/<name>\` containing the 40-character SHA hash of its tip commit. Creating or deleting a branch is instantaneous.

\`\`\`bash
# Create and switch to a feature branch
git switch -c feat/telemetry-agent

# View tracking relationships between local and remote branches
git branch -vv
\`\`\`

---

## 2. Merge vs Rebase: Mechanical Differences

### 3-Way Merge
A standard merge finds the **Common Ancestor** of two branch tips and creates a new **Merge Commit** with two parents.
- **Pros**: Preserves complete chronological history exactly as it occurred.
- **Cons**: Creates cluttered "railroad track" commit graphs and non-linear history.

### Rebase
A rebase calculates the commits on your current branch that do not exist on the target base branch, stores them as temporary patches, resets the current branch to the target base, and replays each patch sequentially.
- **Pros**: Produces a clean, linear, bisectable commit history.
- **Cons**: Rewrites commit hashes; should never be run on shared public branches.

\`\`\`bash
# Update local feature branch onto latest upstream main linearly
git fetch origin
git rebase origin/main
\`\`\``,
          },
        ],
      },
      {
        slug: "collaborative-pr-hygiene",
        title: "Collaborative Workflows & PR Hygiene",
        description:
          "Author atomic Conventional Commits, master interactive rebasing, and resolve 3-way merge conflicts.",
        orderIndex: 2,
        lessons: [
          {
            slug: "atomic-commits-clean-prs",
            title: "Crafting Atomic Commits and Clean PRs",
            estimatedMinutes: 30,
            orderIndex: 1,
            content: `## 1. The Principle of Atomic Commits

An **Atomic Commit** encapsulates one single logical change. It must:
1. Compile and pass tests independently.
2. Not bundle unrelated refactorings or styling fixes with feature logic.
3. Be reversible with \`git revert <hash>\` without side effects on other functionality.

---

## 2. Conventional Commits Specification

TechNexusOrg enforces the Conventional Commits v1.0.0 format:

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

### Standard Types:
- \`feat\`: A new feature for the user or platform.
- \`fix\`: A bug fix.
- \`docs\`: Documentation only changes.
- \`style\`: Formatting, white-space, missing semi-colons (no code logic change).
- \`refactor\`: Code change that neither fixes a bug nor adds a feature.
- \`test\`: Adding missing tests or correcting existing tests.
- \`chore\`: Maintenance tasks, dependency bumps, build tool configurations.

### Real Example:
\`\`\`
feat(auth): require constant-time comparison for service tokens

Replace direct string equality checks with crypto.timingSafeEqual in the
internal sync endpoint to prevent timing side-channel attacks.

Closes #11
\`\`\``,
          },
          {
            slug: "conflicts-interactive-rebasing",
            title: "Resolving Conflicts and Interactive Rebasing",
            estimatedMinutes: 35,
            orderIndex: 2,
            content: `## 1. Interactive Rebasing (\`git rebase -i\`)

Interactive rebasing lets you curate your commit history before submitting a Pull Request.

\`\`\`bash
# Rebase the last 4 commits interactively
git rebase -i HEAD~4
\`\`\`

The editor displays commands for each commit:
- \`pick\`: Use commit as-is.
- \`reword\`: Change commit message.
- \`edit\`: Pause rebase to amend files or split commit.
- \`squash\`: Meld commit into previous commit; combine commit messages.
- \`fixup\`: Meld commit into previous commit; discard this commit message.
- \`drop\`: Remove commit entirely.

---

## 2. Resolving 3-Way Merge Conflicts

When Git encounters divergent changes to the same lines, it halts and injects conflict markers:

\`\`\`diff
<<<<<<< HEAD
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in production
=======
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // Extended to 14 days
>>>>>>> feat/extend-session
\`\`\`

### Resolution Steps:
1. Open conflicted files and decide the intended combined logic.
2. Remove all markers (\`<<<<<<<\`, \`=======\`, \`>>>>>>>\`).
3. Run tests to confirm zero regressions.
4. Stage resolved files: \`git add <file>\`.
5. Continue the rebase: \`git rebase --continue\` (never \`git commit\`).

---

## 3. Safe Remote Updates with \`--force-with-lease\`

After rewriting local history via rebase, updating your remote branch requires force pushing. Never use \`git push --force\` as it blindly overwrites remote changes. Always use:

\`\`\`bash
git push --force-with-lease
\`\`\`

\`--force-with-lease\` verifies that nobody else has pushed commits to the remote branch since your last fetch.`,
          },
        ],
      },
      {
        slug: "governance-ci-integration",
        title: "Open-Source Governance & CI Integration",
        description:
          "Conduct professional code reviews, understand community governance, and enforce GitHub Actions CI pipelines.",
        orderIndex: 3,
        lessons: [
          {
            slug: "code-review-semantic-prs",
            title: "Code Review Etiquette and Semantic PRs",
            estimatedMinutes: 25,
            orderIndex: 1,
            content: `## 1. Constructive Code Reviews

In open-source engineering, code reviews are collaborative mentorship sessions, not gatekeeping hurdles.

### Best Practices for Reviewers:
- **Be specific**: Reference line numbers and explain the architectural reasoning.
- **Distinguish suggestions from blockers**: Prefix non-critical advice with \`nit:\` (nitpick).
- **Use GitHub Suggestions**: Provide concrete code diffs that the author can apply with one click.
- **Praise good solutions**: Acknowledge clean abstractions and thorough test cases.

### Best Practices for Authors:
- Keep PRs small (< 400 lines of diff where possible).
- Fill in all sections of the Pull Request template.
- Test your changes locally before opening the PR.
- Link relevant issues using GitHub keywords (\`Fixes #12\`, \`Closes #15\`).`,
          },
          {
            slug: "github-actions-ci-integration",
            title: "GitHub Actions CI Integration",
            estimatedMinutes: 35,
            orderIndex: 2,
            content: `## 1. Automated Continuous Integration (CI)

Continuous Integration ensures that code pushed to branches meets rigorous quality standards before maintainers review it.

### Core CI Pipeline Stages:
1. **Linting**: Enforces code style, unused variables, and formatting standards.
2. **Type Checking**: Validates static TypeScript types across all source files.
3. **Unit & Integration Tests**: Runs test suites using Vitest/Jest to prevent regressions.
4. **Production Build**: Compiles production artifacts to detect SSR/SSG errors early.

---

## 2. A Production GitHub Actions Workflow

\`\`\`yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Run Test Suite
        run: npm test

      - name: Production Build
        run: npm run build
\`\`\`

---

## 3. Branch Protection Invariants
Production repositories should configure branch protection rules on \`main\`:
- Require a pull request before merging.
- Require status checks to pass before merging (\`validate\` job).
- Require linear history (squash or rebase merging).
- Require review from repository maintainers.`,
            assignment: {
              title: "Open-Source Pull Request and CI Verification",
              description:
                "Fork a TechNexusOrg repository, create a feature branch, author atomic commits following Conventional Commits, push to your fork, and submit a PR with passing CI verification.",
              acceptanceCriteria: [
                "Feature branch created from latest upstream main",
                "Commits adhere to the Conventional Commits standard (e.g., feat, fix, docs)",
                "Interactive rebase applied to eliminate extraneous WIP commits",
                "PR opened against main with descriptive summary and passing CI status checks",
              ],
              submissionType: "github_pr",
            },
          },
        ],
      },
    ],
  },
];
