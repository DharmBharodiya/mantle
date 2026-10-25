# CLAUDE.md

All design, UI and code rules for this repo live in AGENTS.md. Follow it exactly.

@AGENTS.md

## Claude-specific notes

- Before writing or editing any file under `app/`, `components/` or `styles/`, re-read the relevant sections of AGENTS.md (§1 non-negotiables, §3 colour, §4 type, §12 banned patterns).
- Prefer extending an existing `components/mantle/*` component with a prop over creating a new one.
- After a UI change, run `npm run build` and fix every type error before saying you're done.
- When a request would break a rule, build the compliant version and say which rule you followed.
