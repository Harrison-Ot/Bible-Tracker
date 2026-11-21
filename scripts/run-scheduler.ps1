param([string]$PhpPath = 'php')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$artisanPath = Join-Path $projectRoot 'artisan'
if (-not (Test-Path -LiteralPath $artisanPath -PathType Leaf)) { throw 'The Laravel artisan file was not found.' }
$phpExecutable = (Get-Command $PhpPath -CommandType Application -ErrorAction Stop).Source
$logPath = Join-Path $projectRoot 'storage/logs/scheduler.log'
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $phpExecutable
$processInfo.Arguments = '"{0}" schedule:run --no-interaction --no-ansi' -f $artisanPath
$processInfo.WorkingDirectory = $projectRoot
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
try {
    if (-not $process.Start()) { throw 'Could not start the Laravel scheduler.' }
    $standardOutput = $process.StandardOutput.ReadToEndAsync()
    $standardError = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit(150000)) {
        $process.Kill()
        throw 'Scheduler execution exceeded 150 seconds. Inspect pending reminder deliveries before retrying.'
    }
    $record = '[{0}] exit={1}{2}{3}{4}' -f [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'), $process.ExitCode, [Environment]::NewLine, $standardOutput.Result, $standardError.Result
    Add-Content -LiteralPath $logPath -Value $record -Encoding UTF8
    exit $process.ExitCode
} catch {
    Add-Content -LiteralPath $logPath -Value ('[{0}] Scheduler runner failed: {1}' -f [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'), $_.Exception.GetType().FullName) -Encoding UTF8
    throw
} finally { $process.Dispose() }