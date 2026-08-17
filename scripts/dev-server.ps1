$ErrorActionPreference = "Continue"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$viteEntry = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$logFile = Join-Path $projectRoot ".dev-server.log"

if (-not (Test-Path -LiteralPath $viteEntry)) {
  Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Vite entry not found: $viteEntry"
  exit 1
}

$existing = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Port 4173 is already listening; watchdog not duplicated."
  exit 0
}

Set-Location -LiteralPath $projectRoot
Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Watchdog started."

while ($true) {
  Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Starting Vite on http://127.0.0.1:4173/"
  & node $viteEntry --host 127.0.0.1 --port 4173 --strictPort *>> $logFile
  Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Vite stopped; restarting in 2 seconds."
  Start-Sleep -Seconds 2
}
