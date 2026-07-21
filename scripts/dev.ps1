$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot "venv\Scripts\python.exe"
$backendPath = Join-Path $projectRoot "backend"

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Python virtual environment not found at $pythonPath"
}

$apiProcess = $null
$ownsApiProcess = $false

try {
    $existingApi = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8001/" -TimeoutSec 2
}
catch {
    $existingApi = $null
}

if ($null -eq $existingApi -or $existingApi.StatusCode -ne 200) {
    $apiProcess = Start-Process `
        -FilePath $pythonPath `
        -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001" `
        -WorkingDirectory $backendPath `
        -NoNewWindow `
        -PassThru
    $ownsApiProcess = $true
}

try {
    $apiReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($ownsApiProcess -and $apiProcess.HasExited) {
            throw "The API stopped during startup with exit code $($apiProcess.ExitCode)."
        }

        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8001/" -TimeoutSec 1
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
        throw "The API did not become ready at http://127.0.0.1:8001."
    }

    & npm.cmd --prefix (Join-Path $projectRoot "frontend") run dev
}
finally {
    if ($ownsApiProcess -and $null -ne $apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id
    }
}
