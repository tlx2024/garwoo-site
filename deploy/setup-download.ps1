# One-time setup (safe to rerun) of the download host on the web host.
#   powershell -NoProfile -File deploy/setup-download.ps1
# Uploads deploy/download.conf, installs it as download.garwoo.conf, takes download.garwoo.com
# out of garwoo-cloud.conf's reserved 404 block and reloads nginx after `nginx -t` passes.
# Installers and manifests are uploaded later by the product repo's release tool (publish-server).
param(
    [string]$Remote = 'betterme-prod',
    [string]$Root = '/var/www/garwoo-download',
    [string]$Origin = 'https://download.garwoo.com'
)
$ErrorActionPreference = 'Stop'

function Invoke-Native([string]$What, [scriptblock]$Block) {
    & $Block
    if ($LASTEXITCODE -ne 0) { throw "$What failed with exit code $LASTEXITCODE" }
}

$stage = "/tmp/garwoo-download-setup-$(Get-Date -Format yyyyMMddHHmmss)"
$files = @((Join-Path $PSScriptRoot 'download.conf'), (Join-Path $PSScriptRoot 'download-install.sh'))
Invoke-Native 'ssh mkdir' { ssh $Remote "mkdir -p $stage" }
Invoke-Native 'scp' { scp @files "${Remote}:$stage/" }
Invoke-Native 'remote install' { ssh $Remote "bash $stage/download-install.sh $stage $Root" }

foreach ($path in @('/', '/releases/windows.json', '/robots.txt')) {
    $code = curl.exe -s -o NUL -w '%{http_code}' --max-time 20 "$Origin$path"
    Write-Host "$path -> $code"
}
