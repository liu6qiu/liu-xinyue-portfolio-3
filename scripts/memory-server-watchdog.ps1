$ErrorActionPreference = "Continue"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$serverEntry = Join-Path $PSScriptRoot "memory-static-server.mjs"
$logFile = Join-Path $projectRoot ".memory-server.log"

Set-Location -LiteralPath $projectRoot
while ($true) {
  Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Starting memory server."
  & node $serverEntry *>> $logFile
  Add-Content -LiteralPath $logFile -Value "[$(Get-Date -Format s)] Memory server stopped; restarting in 2 seconds."
  Start-Sleep -Seconds 2
}
