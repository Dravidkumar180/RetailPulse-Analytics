param(
    [ValidateRange(1, 600)]
    [int]$StartupTimeoutSeconds = 120,
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot "venv\Scripts\python.exe"
$backendPath = Join-Path $projectRoot "backend"
$stdoutPath = Join-Path $projectRoot "backend-dev.stdout.log"
$stderrPath = Join-Path $projectRoot "backend-dev.stderr.log"

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Python virtual environment not found at $pythonPath"
}

$apiProcess = $null
$ownsApiProcess = $false

try {
    $existingApi = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/" -TimeoutSec 2
}
catch {
    $existingApi = $null
}

if ($null -eq $existingApi -or $existingApi.StatusCode -ne 200) {
    $apiProcess = Start-Process `
        -FilePath $pythonPath `
        -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" `
        -WorkingDirectory $backendPath `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru
    $ownsApiProcess = $true
}

try {
    $apiReady = $false
    $startupTimer = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "Waiting up to $StartupTimeoutSeconds seconds for the API..."
    while ($startupTimer.Elapsed.TotalSeconds -lt $StartupTimeoutSeconds) {
        if ($ownsApiProcess) { $apiProcess.Refresh() }
        if ($ownsApiProcess -and $apiProcess.HasExited) {
            throw "The API stopped during startup with exit code $($apiProcess.ExitCode)."
        }

        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/" -TimeoutSec 1
            if ($response.StatusCode -eq 200) {
                $apiReady = $true
                break
            }
        }
        catch {
            Start-Sleep -Milliseconds 250
        }
    }

    if (-not $apiReady) {
        throw "The API did not become ready at http://127.0.0.1:8000 within $StartupTimeoutSeconds seconds."
    }

    Write-Host "RetailPulse API is ready at http://127.0.0.1:8000."
    if ($CheckOnly) { return }
    Write-Host "Starting the frontend..."
    & npm.cmd --prefix (Join-Path $projectRoot "frontend") run dev:vite
    if ($LASTEXITCODE -ne 0) {
        throw "The frontend exited with code $LASTEXITCODE."
    }
}
catch {
    if ($ownsApiProcess) {
        foreach ($logPath in @($stderrPath, $stdoutPath)) {
            if (Test-Path -LiteralPath $logPath) {
                Write-Host "Backend log: $logPath"
                Get-Content -LiteralPath $logPath -Tail 40 | Out-Host
            }
        }
    }
    throw
}
finally {
    if ($ownsApiProcess -and $null -ne $apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id
    }
}
