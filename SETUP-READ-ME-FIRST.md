# Running BoreSight overnight with local VS Code + Codex

This kit is an INSTRUCTION PACK, not an already-completed application. It does not run anything from ChatGPT. Place these four files in the **root** of YOUR existing local BoreSight project next to `package.json`:

- `AGENTS.md` (replace your old multi-person one; make a Git backup/checkpoint first)
- `OVERNIGHT-MISSION.md`
- `RUN-OVERNIGHT.ps1`
- `SETUP-READ-ME-FIRST.md` (optional reference)

The script launches the **Codex CLI**, which uses the same local project folder you open in VS Code. If you use Codex ONLY through the VS Code extension and do not have CLI installed, paste the short prompt below into its Codex chat in Agent mode and select a workspace-edit mode. Note: IDE sessions may still pause for permissions or limits, so CLI is preferable for unattended runs.

## One-time preflight (PowerShell, in BoreSight)

```powershell
git status
git branch --show-current
# If necessary, first SAVE any modified P3 files with a careful git add/commit.
# Create a solo branch from the P3 work, unless you already have one:
git switch -c feat/solo-overnight
codex --version
node --version
npm --version
```

If the branch already exists, don't run `git switch -c` again; use `git switch feat/solo-overnight`. Never discard existing work. Confirm you are on the right branch and `.env.local` is ignored by Git.

## Google Gemini

Check your real `.env.local` contains the server-side key:

```dotenv
GEMINI_API_KEY=your_existing_key
GEMINI_MODEL=gemini-2.5-flash
```

Do not commit/share this file or put the key in Codex chat. API use requires network access, may incur quotas/charges based on your account settings and might still be blocked by the OS or Codex sandbox. Without a valid key, Codex should complete the offline path and report live test as blocked, not invent results.

## Install/update Codex CLI if needed

```powershell
npm install -g @openai/codex
codex --version
codex login
```

Follow the browser sign-in prompt. If already authenticated, skip login. Run `codex exec --help` to confirm your installed version supports `--full-auto` and `-c`.

## Start the overnight run

Use PowerShell and run from the repository root:

```powershell
.\RUN-OVERNIGHT.ps1
```

If Windows execution policy prevents running your *reviewed local script*, instead invoke Codex directly (also useful if the script is unavailable):

```powershell
codex exec --full-auto -c 'sandbox_workspace_write.network_access=true' "Read AGENTS.md and OVERNIGHT-MISSION.md. Implement every phase end-to-end, test, fix failures, make local checkpoint commits, write SOLO-PROGRESS.md and OVERNIGHT-RESULTS.md, and continue until all feasible non-P4 work is completed. No Photon or ElevenLabs."
```

For the extension instead of CLI, paste:

> Read `AGENTS.md` and `OVERNIGHT-MISSION.md` in full. Execute ALL phases autonomously, including code edits, UI redesign, tests and bug fixes. Do not stop after planning or a milestone; continue to the next phase until the acceptance criteria are met or genuinely blocked. Work only inside this repository. Make safe local checkpoint commits, write `SOLO-PROGRESS.md` and `OVERNIGHT-RESULTS.md`. Do not implement Photon or ElevenLabs. Do not push or deploy.

## Before you sleep

- Plug your laptop/desktop into power and configure Windows **Settings > System > Power & battery > Screen, sleep & hibernate timeouts** so the PC does NOT sleep while plugged in. Locking the screen is fine; sleeping/stopping the process is not. Do not close the terminal.
- Ensure enough disk space, your project dependencies are installed (`npm install` if needed), and Codex authentication is working.
- Make sure `feat/solo-overnight` contains your latest dashboard work. Use `git status` and keep backup commits. Avoid running any other AI agent editing the same workspace simultaneously.
- Turn off unnecessary VPN/proxies if they break npm/Gemini, but do not disable OS security protections. The script enables network access only within Codex's workspace-write sandbox, rather than granting unrestricted system access.
- Set any API budget/rate caps in the provider dashboard before unattended Gemini tests; the agent cannot promise to avoid provider charges.

## After waking

1. Read `OVERNIGHT-RESULTS.md` and `SOLO-PROGRESS.md`.
2. Inspect `git status`, `git log --oneline -8`, and `git diff`.
3. Run `npm run typecheck; npm test; npm run lint; npm run build` yourself.
4. Run `npm run dev` and test upload, demo reset, KPI assumptions, depth chart, event inspection, scenario slider, export and mobile layout manually. Check genuine imports against real source excerpts.
5. Review design, code, auth safety and any API costs before pushing, merging or deploying. P4 should be visibly absent or disabled.

**Important limitation:** No prompt or Codex setting can guarantee an overnight completion. Execution can pause or fail from network authentication, rate limits, missing keys, system sleep, security checks, or a CLI/model session ending. The log and checkpoint files make any partial work reviewable. The agent is instructed to keep working, but completion must be verified in the morning.
