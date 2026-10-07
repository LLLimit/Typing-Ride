$ErrorActionPreference = 'Stop'
$rideDirectory = $PSScriptRoot
Set-Location -LiteralPath $rideDirectory
$rideServerInfo = Join-Path $rideDirectory '.ride-server.json'
if (Test-Path -LiteralPath $rideServerInfo) {
  try {
    $rideExistingServer = Get-Content -LiteralPath $rideServerInfo -Raw | ConvertFrom-Json
    if ($rideExistingServer.url -match '^http://127\.0\.0\.1:[0-9]{4,5}/$') {
      $rideResponse = Invoke-WebRequest -Uri $rideExistingServer.url -UseBasicParsing -TimeoutSec 2
      if ($rideResponse.Content.Contains('TYPE &amp; RIDE') -or $rideResponse.Content.Contains('TYPE & RIDE')) {
        Start-Process $rideExistingServer.url
        exit 0
      }
    }
  } catch { }
}
$rideNodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($rideNodeCommand) {
  $rideNodePath = $rideNodeCommand.Source
} else {
  $rideNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $rideNodePath)) {
  Write-Host 'Node.js is required. Install Node.js 22 or newer, then try again.'
  Read-Host 'Press Enter to close'
  exit 1
}
& $rideNodePath (Join-Path $rideDirectory 'scripts\serve.mjs') --open
