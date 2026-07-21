$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot "venv\Scripts\python.exe"
$backendPath = Join-Path $projectRoot "backend"

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Python virtual environment not found at $pythonPath"
}

Push-Location $backendPath
try {
    & $pythonPath -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
}
finally {
    Pop-Location
}
