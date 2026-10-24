# 03 — Four-person parallel plan with Codex and Claude Code

## One-time team lead bootstrap (do this BEFORE launching 4 agents)

1. Create private GitHub repo `boresight`. Enable branch protection and required checks if your plan supports it.
2. Extract this starter package, make sure `README.md`, `AGENTS.md`, `CLAUDE.md`, `src/types/telemetry.ts` and `.env.example` are committed.
3. Run `npm install` ONCE to generate lockfile; verify `npm run typecheck`, `npm run test`, `npm run build` on the lead computer. Commit **both** `package.json` and `package-lock.json` (the supplied zip lacks a lockfile because network installation was not available when it was authored).
4. First PR not required: push protected base `main`. Team members clone AFTER this point.
5. Write a pinned GitHub Issue / Discord message `Contract v1.0`: report schema location, API endpoints, scenario fields, shared CSS tokens, and ownership table below.
6. Copy and paste `agent-prompts/ROLE-P*.md` into each coding agent AFTER its person reads `AGENTS.md`.

## Single-writer per file rule

| Person | Branch | Exclusive ownership | Required output |
| --- | --- | --- | --- |
| P1 **Gemini Ingestion & data** | `feat/p1-ingestion` | `src/lib/ingestion/**`, `src/app/api/ingest/**`, `demo-fixtures/real-source/**` | Working PDF/XLSX/CSV path, evidence markers, QA warnings, 2 real sample days |
| P2 **Metrics & analytics** | `feat/p2-analytics` | `src/lib/analytics/**`, `src/app/api/analytics/**`, `src/components/analytics/**`, `tests/analytics.*` | Reliable NPT/ILT math, scenario inputs, root causes, event inspector |
| P3 **UI and integration shell** | `feat/p3-dashboard` | `src/app/page.tsx`, `src/app/globals.css`, `src/components/dashboard/**`, `public/ui/**` | Stunning responsive bento dashboard, charts, upload states, well selector |
| P4 **Voice + Photon** | `feat/p4-field-comms` | `src/lib/comms/**`, `src/app/api/briefing/**`, `src/app/api/dispatch/**`, `src/components/comms/**`, `tests/comms.*` | Real MP3 playback, accurate transcript, Photon 2.0 messaging to opted-in test conversation |
| **Team lead only** | `main` contract PRs | `src/types/**`, `src/data/**`, package files, next/tailwind configs, `AGENTS.md`, `CLAUDE.md`, `.env.example`, shared project docs | Handles dependency, data contract and infrastructure changes |

**No exceptions without written owner approval.** If P3 wants P2's bar chart changed, P3 opens an Issue and tells P2; P3 does not edit P2's folder. If an agent wants a dependency, it creates an Issue/request for the lead. All agents must check `git diff --name-only` before committing. **Zero merge conflicts cannot be guaranteed**, but these boundaries drastically reduce them.

## PowerShell commands for each developer

```powershell
# Clone only AFTER the lead pushes the frozen scaffold including lockfile
 git clone https://github.com/ORG/boresight.git
 cd boresight
 npm ci
 Copy-Item .env.example .env.local
 git switch -c feat/p1-ingestion # CHANGE for your role
 # Tell Codex/Claude: "Read AGENTS.md and agent-prompts/ROLE-P1.md."
 # Code only in owned folders
 git status --short
 npm run typecheck
 npm run test
 git add src/lib/ingestion src/app/api/ingest
 git commit -m "feat(ingestion): parse PDF and spreadsheet reports"
 git push -u origin HEAD
 # Open a GitHub PR targeting main, and assign another human reviewer
```

## Important: do NOT share one working directory among four agents
- Each developer clones **their own copy** on their laptop and works only on their own branch. If one person uses BOTH Codex and Claude Code, don't run both write-capable agents simultaneously in one checkout.
- If one teammate wants independent parallel agents, use **`git worktree`** with dedicated branches and directories, but owner folders still cannot overlap.
- GitHub is the central artifact; **GitHub Issues + PR comments** are the authoritative task status and contract decisions. A Discord channel can help coordinate, but decisions must get added to docs/Issues.
- Avoid pushing half-working code directly to `main`. Use PR drafts for early visibility. Keep each change small.
- Avoid long-lived divergence: as soon as an upstream PR merges, `git fetch origin` and `git rebase origin/main` on your personal feature branch, only if your team is comfortable with rebase. Alternative: `git merge origin/main`.
- Never rewrite another teammate's remote branch; never run `git push --force` to shared branches.

## Review & merge order
1. Before opening PR: `git diff --name-only origin/main...HEAD` must show **only** owned paths.
2. Required checks: typecheck, tests, build (and lint if configured); no `.env.local`, secrets, binaries or huge public datasets.
3. Reviewer spot-checks source citation, no silent fake API successes, and no regressions.
4. Merge P2 analytics first, P1 ingestion second, P4 comms third. P3 dashboard integrates their exported components by **pulling updated main**; P3 merges last. The actual order is flexible if contracts and checks hold.
5. Team lead runs full smoke test against final `main`, not P3's old branch.
6. Create demo tag `demo-v1`, and avoid risky changes after successful rehearsal.

## If a shared file MUST change
- Open `CHANGE: ...` GitHub Issue listing old field, proposed new field, consumer impacts, migration, test cases.
- Team lead creates a 10-minute **contract change window**, edits locked file, increments schema version and updates fixture(s); opens short PR.
- All members fetch the new contract and adjust **only their owned files**. Update `AGENTS.md` and API contract in one controlled commit.

## Simple daily sync, no overhead
Every 60–90 minutes paste one line: `P2 | branch feat/p2-analytics | ✅ math tests | 🔄 ILT chart | 🛑 needs source day sample | PR #3`. Report blockers early. Mention if an agent tried to modify another folder. Keep an owner, priority and acceptance check on every Issue.

## Working with AI agents safely
- Provide each tool the same root instructions (`AGENTS.md` for Codex, `CLAUDE.md` for Claude Code) plus the role prompt.
- Tell it to inspect repo, then propose a tiny plan and implement one bounded task, run local tests, list files modified, and stop if it needs shared files.
- **Review every generated diff.** An agent can plausibly change a contract, fabricate provider response shapes or hide errors for the demo. Do not accept those changes solely because a screenshot looks correct.
- Run coding agents with limited tool permissions; NEVER give an agent permission to message real recipients as part of a test without explicit human confirmation.
