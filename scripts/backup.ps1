param(
  [string]$OutputDirectory = "",
  [string]$Container = "rattib-postgres",
  [string]$Database = "rattib",
  [string]$DbUser = "rattib",
  [string]$EnvironmentFile = "",
  [string]$StorageEndpoint = "http://127.0.0.1:59000"
)

$ErrorActionPreference = "Stop"
if ($Container -notmatch '^[a-zA-Z0-9_.-]+$' -or $Database -notmatch '^[a-zA-Z0-9_]+$' -or $DbUser -notmatch '^[a-zA-Z0-9_]+$') { throw "Unsafe database backup parameter" }
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputDirectory = Join-Path $ProjectRoot "backups\rattib-$Stamp"
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$DatabaseFile = Join-Path $OutputDirectory "database.dump"
if (-not [string]::IsNullOrWhiteSpace($EnvironmentFile)) { $env:DOTENV_CONFIG_PATH = [System.IO.Path]::GetFullPath($EnvironmentFile) }
if (-not [string]::IsNullOrWhiteSpace($StorageEndpoint)) { $env:S3_ENDPOINT = $StorageEndpoint }

$StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
$StartInfo.FileName = "docker"
$StartInfo.UseShellExecute = $false
$StartInfo.RedirectStandardOutput = $true
$StartInfo.RedirectStandardError = $true
$StartInfo.Arguments = "exec -i $Container pg_dump -U $DbUser -d $Database --schema=public --format=custom --no-owner --no-acl"
$Process = [System.Diagnostics.Process]::new()
$Process.StartInfo = $StartInfo
$File = [System.IO.File]::Create($DatabaseFile)
try {
  if (-not $Process.Start()) { throw "Could not start pg_dump" }
  $Copy = $Process.StandardOutput.BaseStream.CopyToAsync($File)
  $ErrorRead = $Process.StandardError.ReadToEndAsync()
  $Process.WaitForExit()
  $null = $Copy.GetAwaiter().GetResult()
  if ($Process.ExitCode -ne 0) { throw "pg_dump failed: $($ErrorRead.GetAwaiter().GetResult())" }
} finally {
  $File.Dispose()
  $Process.Dispose()
}

& node (Join-Path $PSScriptRoot "storage-backup.mjs") backup $OutputDirectory
if ($LASTEXITCODE -ne 0) { throw "Document storage backup failed" }

$Metadata = [ordered]@{
  version = 1
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  database = $Database
  databaseFile = "database.dump"
  sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $DatabaseFile).Hash.ToLowerInvariant()
}
$Metadata | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $OutputDirectory "backup-manifest.json") -Encoding utf8
Write-Output $OutputDirectory
