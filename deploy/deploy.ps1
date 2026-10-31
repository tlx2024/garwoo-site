# NOT VERIFIED. Do not use before the domain and ICP filing are ready (G0) and a server is chosen.
# Usage (from the garwoo-site repo root):
#   powershell -NoProfile -File deploy/deploy.ps1 -DryRun    # build + gates only, no upload
#   powershell -NoProfile -File deploy/deploy.ps1            # build + deploy
# Builds the www site (SITE_MODE=www), uploads it to the web host, swaps the web root with one
# rollback copy and reloads nginx only after `nginx -t` passes.
param(
    [string]$Remote = '',
    [string]$WebRoot = '/var/www/garwoo-www',
    [string]$WwwOrigin = $(if ($env:WWW_ORIGIN) { $env:WWW_ORIGIN } else { 'https://www.garwoo.cn' }),
    [string]$AccountOrigin = $env:ACCOUNT_ORIGIN,
    [string]$DownloadOrigin = $env:DOWNLOAD_ORIGIN,
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'

function Invoke-Native([string]$What, [scriptblock]$Block) {
    & $Block
    if ($LASTEXITCODE -ne 0) { throw "$What failed with exit code $LASTEXITCODE" }
}

$repo = Split-Path -Parent $PSScriptRoot
$site = Join-Path $repo 'site'
$dist = Join-Path $site 'dist/www'
$archive = Join-Path $PSScriptRoot 'www.tgz'

Write-Host "www=$WwwOrigin account=$AccountOrigin download=$DownloadOrigin"
$env:SITE_MODE = 'www'
$env:WWW_ORIGIN = $WwwOrigin
$env:ACCOUNT_ORIGIN = $AccountOrigin
$env:DOWNLOAD_ORIGIN = $DownloadOrigin

Push-Location $site
try {
    Invoke-Native 'npm test' { npm.cmd test }
    # build:www runs astro build, font subsetting, the sensitive-content gate and the site gate.
    Invoke-Native 'npm run build:www' { npm.cmd run build:www }
} finally {
    Pop-Location
}

if (-not (Test-Path (Join-Path $dist 'index.html'))) { throw "build output missing: $dist" }
if ($DryRun) {
    Write-Host "DryRun: built $dist, nothing uploaded."
    exit 0
}
if (-not $Remote) { throw 'Pass -Remote <ssh host>; no default host is configured.' }

if (Test-Path $archive) { Remove-Item $archive }
Invoke-Native 'tar' { tar -czf $archive -C $dist . }

$stage = "/tmp/garwoo-www-deploy-$(Get-Date -Format yyyyMMddHHmmss)"
try {
    Invoke-Native 'ssh mkdir' { ssh $Remote "mkdir -p $stage" }
    $files = @($archive, (Join-Path $PSScriptRoot 'remote-install.sh'))
    Invoke-Native 'scp' { scp @files "${Remote}:$stage/" }
    Invoke-Native 'remote install' { ssh $Remote "bash $stage/remote-install.sh $stage $WebRoot" }
} finally {
    if (Test-Path $archive) { Remove-Item $archive }
}

# Smoke check from this machine.
foreach ($path in @('/', '/docs/')) {
    $code = curl.exe -s -o NUL -w '%{http_code}' --max-time 20 "$WwwOrigin$path"
    Write-Host "$path -> $code"
}
Write-Host "Done: $WwwOrigin/"
