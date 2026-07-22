param(
    [switch]$Reload
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot "venv\Scripts\python.exe"
$backendPath = Join-Path $projectRoot "backend"

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Python virtual environment not found at $pythonPath"
}

# Avoid launching a second server into an occupied port. This also makes
# repeated `npm run dev:api` calls harmless when RetailPulse is already up.
try {
    $existingApi = Invoke-RestMethod -Uri "http://127.0.0.1:8001/" -TimeoutSec 2
}
catch {
    $existingApi = $null
}

if ($null -ne $existingApi) {
    if ($existingApi.application -eq "RetailPulse Analytics") {
        Write-Host "RetailPulse API is already running at http://127.0.0.1:8001."
        exit 0
    }

    throw "Port 8001 is already in use by another application. Stop it or configure a different API port."
}

Push-Location $backendPath
try {
    # Run a single Uvicorn process by default. On Windows the reload supervisor
    # is a second parent process; IDE/task-runner terminal restarts can stop that
    # parent and take the healthy API child down with it. Reloading remains an
    # explicit opt-in for developers who need it.
    $uvicornArguments = @(
        "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8001"
    )

    if ($Reload) {
        $uvicornArguments += @("--reload", "--reload-dir", $backendPath)
    }

    & $pythonPath @uvicornArguments

    if ($LASTEXITCODE -ne 0) {
        throw "The API exited unexpectedly with code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
