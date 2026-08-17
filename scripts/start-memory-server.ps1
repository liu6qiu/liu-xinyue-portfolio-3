$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$watchdog = Join-Path $PSScriptRoot "memory-server-watchdog.ps1"

$existing = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Output "Portfolio server is already running at http://127.0.0.1:4173/"
  exit 0
}

$process = Start-Process powershell.exe -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", "`"$watchdog`""
) -WindowStyle Hidden -WorkingDirectory $projectRoot -PassThru
Write-Output "Started portfolio memory-server watchdog (PID $($process.Id))."
