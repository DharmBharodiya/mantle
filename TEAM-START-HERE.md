# BoreSight — Team-start checklist

## Do this first (team lead only)
1. Install Node.js **22** and Git, then create an empty private GitHub repo called `boresight` (don't auto-initialize README).
2. Unzip these files into the local `boresight` directory. Open `preview.html` now if you only want to see the look of the app.
3. Run:

```powershell
cd boresight
npm install
Copy-Item .env.example .env.local
npm run dev
```

4. Visit `http://localhost:3000`. The synthetic dashboard works without keys. Edit `.env.local` with real credentials only if needed.
5. Once `npm install` succeeds, run `npm run typecheck; npm test; npm run build`. Fix problems before inviting others. The ZIP deliberately does not include `node_modules` or `package-lock.json`; commit the generated lockfile.
6. Set up git on the lead machine:

```powershell
git init
git branch -M main
git add .
git commit -m "chore: initialize BoreSight hackathon starter"
git remote add origin https://github.com/YOUR-ORG/boresight.git
git push -u origin main
```

## Each teammate (on their own laptop)

```powershell
git clone https://github.com/YOUR-ORG/boresight.git
cd boresight
npm ci
Copy-Item .env.example .env.local
# choose your OWN feature branch, then push:
git switch -c feat/p1-ingestion
# OR feat/p2-analytics, feat/p3-dashboard, feat/p4-field-comms
git push -u origin HEAD
```

## Four agent entry points
- P1 Gemini: `agent-prompts/ROLE-P1-GEMINI-INGESTION.md`
- P2 analytics: `agent-prompts/ROLE-P2-ANALYTICS.md`
- P3 UI: `agent-prompts/ROLE-P3-DASHBOARD.md`
- P4 ElevenLabs + Photon: `agent-prompts/ROLE-P4-VOICE-PHOTON.md`

**All agents must read `AGENTS.md` (Codex) or `CLAUDE.md` (Claude Code), which itself points to `AGENTS.md`.** Each role's files are exclusive. Read `docs/03-TEAM-AND-GIT.md` before starting.

## Required demo walk-through
`synthetic dashboard → open shift evidence → change benchmark/rate scenario → upload a real historical report if Gemini configured → generate ElevenLabs briefing if configured → optional authorized Photon test conversation`.

**A note on verification:** This project has an interactive offline HTML preview that was browser-tested, but the downloadable Next.js application has not been installed/built in the packaging environment due to npm registry connectivity restrictions. The team lead must run the first-install checklist above before treating it as demo-ready. Provider integrations require working credentials and live SDK validation.
