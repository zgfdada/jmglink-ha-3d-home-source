[CmdletBinding()]
param(
    [switch]$Build
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$credentialInput = "protocol=https`nhost=gitea.700117.xyz:16666`n`n"
$previousInteractive = $env:GCM_INTERACTIVE
$env:GCM_INTERACTIVE = "Never"

try {
    $credentialLines = $credentialInput | git credential fill 2>$null
    $credential = @{}
    foreach ($line in $credentialLines) {
        $pair = $line -split "=", 2
        if ($pair.Count -eq 2) {
            $credential[$pair[0]] = $pair[1]
        }
    }
    if ($credential.username -ne "zgf" -or -not $credential.password) {
        throw "Windows 凭证管理器没有返回已授权的 zgf Gitea 凭证。"
    }

    $env:HA3D_MODEL_LIBRARY_GITEA_URL = "https://gitea.700117.xyz:16666"
    $env:HA3D_MODEL_LIBRARY_GITEA_API_URL = "http://gitea-host-proxy:16667"
    $env:HA3D_MODEL_LIBRARY_OWNER = "zgf"
    $env:HA3D_MODEL_LIBRARY_REPO = "jmglink-ha-3d-model-library"
    $env:HA3D_MODEL_LIBRARY_BRANCH = "main"
    $env:HA3D_MODEL_LIBRARY_MODE = "direct"
    $env:HA3D_MODEL_LIBRARY_USERNAME = $credential.username
    $env:HA3D_MODEL_LIBRARY_PASSWORD = $credential.password

    $composeArguments = @("compose", "-f", "docker-compose.source.yml", "up", "-d")
    if ($Build) {
        $composeArguments += "--build"
    }
    & docker @composeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose 启动失败。"
    }
    Write-Host "HA 3D Home 已启动；在线模型库使用服务端凭证，未写入源码或配置文件。"
}
finally {
    $env:GCM_INTERACTIVE = $previousInteractive
    Remove-Item Env:HA3D_MODEL_LIBRARY_GITEA_URL -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_GITEA_API_URL -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_OWNER -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_REPO -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_BRANCH -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_MODE -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_USERNAME -ErrorAction SilentlyContinue
    Remove-Item Env:HA3D_MODEL_LIBRARY_PASSWORD -ErrorAction SilentlyContinue
}
