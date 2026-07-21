param(
  [Parameter(Mandatory = $true)][string]$BackupDirectory,
  [Parameter(Mandatory = $true)][string]$Database,
  [switch]$ConfirmDatabaseOverwrite,
  [string]$Container = "rattib-postgres",
  [string]$DbUser = "rattib",
  [string]$EnvironmentFile = "",
  [string]$StorageEndpoint = "http://127.0.0.1:59000"
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmDatabaseOverwrite) { throw "Restore replaces the target database. Re-run with -ConfirmDatabaseOverwrite." }
if ($Database -notmatch '^[a-zA-Z0-9_]+$' -or $Database -in @('postgres', 'template0', 'template1') -or $Container -notmatch '^[a-zA-Z0-9_.-]+$' -or $DbUser -notmatch '^[a-zA-Z0-9_]+$') { throw "Unsafe restore parameter" }
$BackupDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
if (-not [string]::IsNullOrWhiteSpace($EnvironmentFile)) { $env:DOTENV_CONFIG_PATH = [System.IO.Path]::GetFullPath($EnvironmentFile) }
if (-not [string]::IsNullOrWhiteSpace($StorageEndpoint)) { $env:S3_ENDPOINT = $StorageEndpoint }
& (Join-Path $PSScriptRoot "verify-backup.ps1") -BackupDirectory $BackupDirectory -Container $Container -DbUser $DbUser
if ($LASTEXITCODE -ne 0) { throw "Backup verification failed" }

$DatabaseFile = Join-Path $BackupDirectory "database.dump"
& docker exec $Container dropdb -U $DbUser --if-exists --force $Database
if ($LASTEXITCODE -ne 0) { throw "Could not replace target database" }
& docker exec $Container createdb -U $DbUser $Database
if ($LASTEXITCODE -ne 0) { throw "Could not create target database" }

$StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
$StartInfo.FileName = "docker"
$StartInfo.UseShellExecute = $false
$StartInfo.RedirectStandardInput = $true
$StartInfo.RedirectStandardError = $true
$StartInfo.Arguments = "exec -i $Container pg_restore -U $DbUser -d $Database --clean --if-exists --no-owner --no-acl"
$Process = [System.Diagnostics.Process]::new()
$Process.StartInfo = $StartInfo
if (-not $Process.Start()) { throw "Could not start pg_restore" }
$InputFile = [System.IO.File]::OpenRead($DatabaseFile)
try {
  $Copy = $InputFile.CopyToAsync($Process.StandardInput.BaseStream)
  $null = $Copy.GetAwaiter().GetResult()
  $Process.StandardInput.Close()
  $Process.WaitForExit()
  if ($Process.ExitCode -ne 0) { throw "pg_restore failed: $($Process.StandardError.ReadToEnd())" }
} finally {
  $InputFile.Dispose()
  $Process.Dispose()
}

& node (Join-Path $PSScriptRoot "storage-backup.mjs") restore $BackupDirectory
if ($LASTEXITCODE -ne 0) { throw "Document storage restore failed" }
Write-Output "Restore completed for database '$Database'."
