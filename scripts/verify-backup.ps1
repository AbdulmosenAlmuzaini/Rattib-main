param(
  [Parameter(Mandatory = $true)][string]$BackupDirectory,
  [string]$Container = "rattib-postgres",
  [string]$DbUser = "rattib"
)

$ErrorActionPreference = "Stop"
if ($Container -notmatch '^[a-zA-Z0-9_.-]+$' -or $DbUser -notmatch '^[a-zA-Z0-9_]+$') { throw "Unsafe database verification parameter" }
$BackupDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
$ManifestPath = Join-Path $BackupDirectory "backup-manifest.json"
$DatabaseFile = Join-Path $BackupDirectory "database.dump"
if (-not (Test-Path -LiteralPath $ManifestPath) -or -not (Test-Path -LiteralPath $DatabaseFile)) { throw "Backup files are incomplete" }
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$ActualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $DatabaseFile).Hash.ToLowerInvariant()
if ($ActualHash -ne $Manifest.sha256) { throw "Database backup checksum mismatch" }

& node (Join-Path $PSScriptRoot "storage-backup.mjs") restore $BackupDirectory --verify-only
if ($LASTEXITCODE -ne 0) { throw "Document storage integrity verification failed" }

$VerificationDatabase = "rattib_restore_check"
try {
  & docker exec $Container dropdb -U $DbUser --if-exists $VerificationDatabase
  if ($LASTEXITCODE -ne 0) { throw "Could not prepare verification database" }
  & docker exec $Container createdb -U $DbUser $VerificationDatabase
  if ($LASTEXITCODE -ne 0) { throw "Could not create verification database" }

  $StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $StartInfo.FileName = "docker"
  $StartInfo.UseShellExecute = $false
  $StartInfo.RedirectStandardInput = $true
  $StartInfo.RedirectStandardError = $true
  $StartInfo.Arguments = "exec -i $Container pg_restore -U $DbUser -d $VerificationDatabase --clean --if-exists --no-owner --no-acl"
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

  $TableCount = (& docker exec $Container psql -U $DbUser -d $VerificationDatabase -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';").Trim()
  if ([int]$TableCount -lt 10) { throw "Restored database is missing expected tables" }
  Write-Output "Backup verified successfully ($TableCount tables restored)."
} finally {
  & docker exec $Container dropdb -U $DbUser --if-exists $VerificationDatabase | Out-Null
}
