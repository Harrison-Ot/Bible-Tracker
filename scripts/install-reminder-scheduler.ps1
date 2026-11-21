param(
    [string]$PhpPath = 'php',
    [string]$TaskName = 'BibleTracker-ReadingReminders'
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runnerPath = Join-Path $PSScriptRoot 'run-scheduler.ps1'
$phpExecutable = (Get-Command $PhpPath -CommandType Application -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath $runnerPath -PathType Leaf)) { throw 'Scheduler runner script was not found.' }
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing -and -not ($existing.Actions.Arguments -like ('*' + $runnerPath + '*'))) {
    throw 'This task name belongs to another project. Choose a different TaskName.'
}
$launcherPath = Join-Path $PSScriptRoot 'run-scheduler-hidden.wsf'
$windowlessHost = Join-Path $env:SystemRoot 'System32/wscript.exe'
if (-not (Test-Path -LiteralPath $launcherPath -PathType Leaf) -or -not (Test-Path -LiteralPath $windowlessHost -PathType Leaf)) {
    throw 'The windowless scheduler launcher or Windows Script Host was not found.'
}
$arguments = '//B //NoLogo "{0}" "{1}" "{2}"' -f $launcherPath, $runnerPath, $phpExecutable
$action = New-ScheduledTaskAction -Execute $windowlessHost -Argument $arguments -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3)
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Runs this Bible Tracker workspace scheduler every minute while the current Windows user is logged in and the PC is awake.'
Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
Write-Output ('Installed {0}; PHP: {1}' -f $TaskName, $phpExecutable)
Write-Output 'The task is hidden, persists across restarts, and runs while this user is logged in and the PC is awake.'
Write-Output ('Runner output: {0}' -f (Join-Path $projectRoot 'storage/logs/scheduler.log'))