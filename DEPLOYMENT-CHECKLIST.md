# Mantle deployment checklist

Prepared 24 October 2026. **Instructions only: nothing was pushed, merged or deployed.** Local verification does not certify a host configuration. See FINAL-RELEASE-REPORT.md for outstanding live-source and browser checks.

## Configuration

| Variable | Required | Where / meaning |
|---|---|---|
| GEMINI_API_KEY | For PDF/unstructured document extraction and vision only | Server runtime secret. Never NEXT_PUBLIC_, browser storage, source control or printed logs. Snapshot import, deterministic tables and scenario calculations do not need it. |
| GEMINI_MODEL | Optional override | Existing tested configuration: gemini-3.1-flash-lite. Model capability/availability is verified at runtime; do not blindly change to an unsupported model. |
| NODE_ENV | Production runtime | Set production on a persistent host; next build/start already use production behavior. |
| PORT | Persistent Node host | Your assigned listening port; example 3000. |
| BORESIGHT_INGESTION_CHECK | Local isolation only | Set to 1 for local .next-ingestion-check build/start. Leave unset in a normal deployment, using .next. |
| BORESIGHT_TEST_URL | QA scripts only | Origin of the running application, e.g. http://127.0.0.1:3100 or the deployed HTTPS origin. No credentials or query strings. |

No database, authentication service, Photon or ElevenLabs credentials are required. Do not configure or enable the excluded integrations. Check environment variable names without printing their values. Configure the Gemini secret through the host's secret settings; restart the runtime after changes. The server needs outbound HTTPS to Google Gemini.

## Exact persistent Node deployment procedure (manual)

Use a Node 22 host and the project's locked dependencies. These are future operator actions, not executed deployment steps. Select a specific reviewed local release revision and transfer it through your approved release process; this sprint's local checkpoint was not pushed. Preserve uncommitted work, and do not assume a fresh remote checkout includes it.

1. Before transferring source, review git status and git diff. Include the approved app source, public assets/local fonts, package.json, package-lock.json and Next/TypeScript configuration. Exclude .env*, node_modules, local build directories and diagnostic/private files. Keep authorized public demo fixtures available locally for the presenter.
2. In the chosen host directory, install the locked dependencies with npm ci, including development dependencies for type/lint/build. Configure server environment variables as above. Leave BORESIGHT_INGESTION_CHECK unset.
3. Run the release checks and build in sequence. POSIX shell example:

~~~sh
npm ci
npm run typecheck
npm test
npm run lint
npm run build
NODE_ENV=production PORT=3000 npm run start -- --hostname 0.0.0.0
~~~

On Windows use npm.cmd, and set runtime variables separately:

~~~powershell
Remove-Item Env:BORESIGHT_INGESTION_CHECK -ErrorAction SilentlyContinue
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
npm.cmd run build
$env:NODE_ENV='production'
$env:PORT='3000'
npm.cmd run start -- --hostname 0.0.0.0
~~~

The ordinary build output and start command must match. Do not deploy only static HTML: ingestion and analytics require Node route handlers. A local .next-ingestion-check build cannot be started using the ordinary .next setting.

4. Keep the process running with the host's existing process manager. Place it behind the host's existing HTTPS reverse proxy; do not expose the Gemini key through client configuration. Keep request/response streaming enabled and use no-store behavior on ingestion.
5. Configure ingress/body limits for at least the app's 8 MB file limit plus multipart overhead, and request/proxy timeouts that allow the 240-second application budget plus response overhead. This is a host configuration requirement, not a reason to raise application deadlines. Disable proxy buffering for /api/ingest; its response already sends X-Accel-Buffering: no. Confirm the host honors it.
6. Run the production smoke gate below. Keep the previous working release available through the host's ordinary rollback mechanism. A rollback does not restore in-memory browser reports: export JSON before refreshing.

The installed Next.js 15 app uses standard next build / next start deployment; [official Next.js self-hosting guidance](https://nextjs.org/docs/15/app/guides/self-hosting) explains streaming/proxy configuration. No standalone build, Docker setup or new hosting infrastructure was added.

## Optional managed Next.js hosting

If the maintainer chooses Vercel, use the Next.js preset, repository root as root directory, npm ci and npm run build, standard output settings and server-only environment variables. Leave BORESIGHT_INGESTION_CHECK unset. Review the specific release revision before manually triggering deployment; this document does not authorize an automatic push or production release.

Vercel currently documents a **4.5 MB function request/response payload limit**, lower than Mantle's 8 MB upload ceiling. The host may reject an upload before app validation runs. Keep the demo files small; these FORGE excerpts are approximately 0.11 MB. Do not promise full 8 MB ingestion on that host. [Official function limits](https://vercel.com/docs/functions/limitations).

The same official page currently lists a 300-second Fluid Compute default, with a 300-second Hobby maximum; plan/runtime configuration can differ. Mantle's ingestion route advertises maxDuration 270 and enforces 240 internally. Verify the actual account's settings before deployment; streaming is still subject to the host duration cap. Do not add storage or queues to work around limits during this release check. [Official function limits](https://vercel.com/docs/functions/limitations).

## Ingestion behavior and provider failure rehearsal

- Application limits: 8 MB; 24 PDF pages; normal two-page sections; two concurrent workers; bounded model output; at most two generation attempts. Multiple report days reject instead of choosing one silently. Split by report day before upload.
- Generation attempts are limited to 45 seconds, model verification to 10 seconds and the total request budget to 240 seconds. Existing busy retries remain bounded. These limits were not increased for this sprint.
- Observed successful full-day extractions in the prior sprint took about 12.5-13.4 seconds. Today's fresh request returned PROVIDER_BUSY after 8,158 ms. These are observations, not latency guarantees; do not schedule a live call inside the pitch.
- Missing key, invalid model, quota/busy errors, invalid extraction, timeline errors, timeouts and cancellation must retain the prior selected report. Correlate diagnostics using X-Request-Id and the terminal NDJSON envelope. Never infer success from streaming HTTP 200 alone.
- A valid import requires type=result and a complete validated report. A terminal type=error, closed connection or incomplete response must not be imported. Avoid logging keys or raw uploads.
- Keep the original real snapshot and synthetic CSV backup available. Public inputs may be sent to Gemini; do not use private field reports in a public demonstration.

## Production smoke gate (not performed here)

Set the origin after the maintainer manually deploys:

~~~powershell
$env:BORESIGHT_TEST_URL='https://[actual-deployment-host]'
node scripts/verify-release-http.mjs
~~~

Run from a checkout with the public fixtures and installed dependencies. This makes 21 deterministic assertions and **no Gemini calls**, and saves docs/qa/final-release-http.json. It includes homepage/console, analytics, real-report scenario/provenance, CSV/XLSX uploads, malformed-source rejection and PDF page limits. The script checks actual pass results and exits nonzero on failure. Protected previews may need the maintainer's approved access method; a login page is not a passing app check.

Then manually:

- Verify / and /console load over HTTPS with local fonts, assets and no hydration errors. Confirm no secret appears in delivered JavaScript.
- Import the saved real snapshot; inspect 17 events and exact evidence. Apply 100 ft/h / $240,000/day to a scenario copy: expect 34.2 minutes and $5,700 ILT scenario, no NPT, unknown carbon. Test comparison, switching and export/reimport.
- At desktop, tablet and 390px: check page overflow, keyboard focus, reduced motion, chart hover and controls. Print real report and scenario copy to PDF; inspect all pages for clipping and missing evidence.
- If provider quota permits, make one authorized public full-day PDF request. Require a result envelope, verify all 17 intervals/end depths, nonempty exact quotes without invented omissions, and the 4.0 h versus 3.5 h source warning. If it returns busy, retain the cached report and mark live verification unverified; do not falsely close the evidence gate.
- Test invalid uploads and cancellation with a previous valid report selected. Confirm proxy limits/errors are understandable and do not replace it. Review host logs for request IDs, not credentials.

Proceed with a public release only after the maintainer reviews the remaining gates. No production smoke, rollback or host-configuration result is claimed here.
