# Run from Windows PowerShell within a trusted copy of your BoreSight repository.
# Open the project as the current working directory; this script also locates itself.
# Prerequisite: Codex CLI installed and authenticated; Node/npm available.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
if (!(Test-Path (Join-Path $root 'package.json'))) { throw 'No package.json found. Put these files in the ROOT of BoreSight first.' }
if (!(Test-Path (Join-Path $root 'OVERNIGHT-MISSION.md'))) { throw 'OVERNIGHT-MISSION.md missing.' }
if (!(Get-Command codex -ErrorAction SilentlyContinue)) { throw 'Codex CLI missing. Install it and sign in before running this script.' }
$logDir = Join-Path $root '.codex-logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $logDir "overnight-$stamp.log"
Write-Host "Starting Codex overnight build. Log: $log"
Write-Host 'Workspace-write sandbox, unattended approvals, network enabled for public docs/npm/Gemini. Not unrestricted system access.'
Write-Host 'Do not close this PowerShell terminal or let the computer sleep.'
$mission = 'Read AGENTS.md and OVERNIGHT-MISSION.md in full. Execute every implementation and verification phase autonomously; do not stop after planning or one milestone. Preserve existing UI work, switch to the specified premium dark modern design, finish the complete non-P4 BoreSight MVP and optional non-P4 work when feasible. Do not work on ElevenLabs or Photon. Create SOLO-PROGRESS.md and OVERNIGHT-RESULTS.md. Continue until the acceptance criteria are satisfied or a genuine blocker prevents further productive work.'
& codex exec --full-auto -c 'sandbox_workspace_write.network_access=true' $mission 2>&1 | Tee-Object -FilePath $log
$code = $LASTEXITCODE
Write-Host "Codex process exited with code $code. Log: $log"
if ($code -ne 0) { exit $code }
