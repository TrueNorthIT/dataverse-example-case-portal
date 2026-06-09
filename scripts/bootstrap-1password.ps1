# Bootstrap 1Password items in the "LA stack" vault from .env.
# Idempotent — items that already exist are skipped.
#
# Why PowerShell? 1Password desktop integration on Windows trusts the
# immediate parent process. Running this script means `op` sees PowerShell
# as its parent on every call, so desktop biometric approval works for the
# whole session. (A Node wrapper would put `node` as parent, which fails.)
#
# Usage (from PowerShell, after `op signin`):
#   .\scripts\bootstrap-1password.ps1
#
# NOTE: the portal currently has no real secrets — every value in .env.tpl
# is a public Entra/SPA identifier or an HTTPS URL, kept literal in the
# template so it's self-documenting. The $Items list is empty for now and
# this script is a no-op; add an entry when the portal grows a secret
# (e.g. a Vite-baked Application Insights connection string).

$ErrorActionPreference = 'Stop'

$Vault = 'LA stack'
$EnvFile = '.env'

# Map: 1Password item name → .env variable name → required
# Example for when a secret gets added:
#   @{ Name = 'dataverse-example-case-portal-app-insights-conn'; EnvVar = 'VITE_APPINSIGHTS_CONNECTION_STRING'; Required = $false }
$Items = @()

function Load-EnvFile($path) {
  if (-not (Test-Path $path)) {
    Write-Error "$path not found. Run this from the repo root."
    exit 1
  }
  $env = @{}
  foreach ($line in Get-Content $path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $eq = $trimmed.IndexOf('=')
    if ($eq -lt 0) { continue }
    $key = $trimmed.Substring(0, $eq).Trim()
    $value = $trimmed.Substring($eq + 1)
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $env[$key] = $value
  }
  return $env
}

function Create-Item($name, $value) {
  $opArgs = @(
    'item', 'create',
    '--category=password',
    "--title=$name",
    "--vault=$Vault",
    "password=$value"
  )
  $result = & op @opArgs 2>&1 | Out-String
  return @{ ExitCode = $LASTEXITCODE; Output = $result }
}

Write-Host "Bootstrapping 1Password items in vault '$Vault' from $EnvFile`n"

if ($Items.Count -eq 0) {
  Write-Host "No items configured for bootstrap -- the portal currently has no secrets."
  Write-Host "Edit scripts/bootstrap-1password.ps1 and add to `$Items when a secret is introduced."
  exit 0
}

$envVars = Load-EnvFile $EnvFile

$created = 0
$skipped = 0
$missing = 0

foreach ($item in $Items) {
  $name = $item.Name
  $envVar = $item.EnvVar
  $required = $item.Required
  $value = $envVars[$envVar]

  if (-not $value) {
    if ($required) {
      Write-Host "FAIL  $name -- required env var $envVar missing from $EnvFile" -ForegroundColor Red
      $missing++
    } else {
      Write-Host "SKIP  $name -- optional env var $envVar not set"
    }
    continue
  }

  $result = Create-Item $name $value
  if ($result.ExitCode -eq 0) {
    Write-Host "OK    $name -- created" -ForegroundColor Green
    $created++
  } elseif ($result.Output -match 'duplicate|already exists') {
    Write-Host "EXIST $name -- already in vault, skipping"
    $skipped++
  } else {
    Write-Host "FAIL  $name -- $($result.Output.Trim())" -ForegroundColor Red
    $missing++
  }
}

Write-Host "`nDone. Created: $created, already existed: $skipped, failed/missing: $missing"
if ($missing -gt 0) { exit 1 }
Write-Host "`nNext: run 'npm run env:pull' to verify the templates render."
