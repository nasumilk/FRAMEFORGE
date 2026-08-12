$ErrorActionPreference = "Stop"
$studioRoot = "C:\Promptmaker\minimax-mobile-studio"
$backendPython = Join-Path $studioRoot "backend\.venv\Scripts\python.exe"
$backendRoot = Join-Path $studioRoot "backend"
$frontendRoot = Join-Path $studioRoot "frontend"

$apiListener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $apiListener) {
  Start-Process -FilePath $backendPython -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $backendRoot -WindowStyle Hidden
}

Set-Location -LiteralPath $frontendRoot
& npm.cmd run start -- --hostname 127.0.0.1 --port 3300

