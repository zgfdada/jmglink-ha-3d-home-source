param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9A-Za-z][0-9A-Za-z._-]+$')]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$registry = 'ghcr.io'
$image = "$registry/zgfdada/jmglink-ha-3d-home-custom"
$builder = 'ha-multiarch'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$addonRoot = Join-Path $repositoryRoot 'jmglink-ha-3d-home'
$configPath = Join-Path $addonRoot 'config.yaml'
$configuredVersion = (Select-String -LiteralPath $configPath -Pattern '^version:\s*(.+)$').Matches[0].Groups[1].Value.Trim()

if ($configuredVersion -ne $Version) {
    throw "config.yaml version is $configuredVersion, expected $Version"
}

docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop is not available'
}

docker run --privileged --rm tonistiigi/binfmt --install arm64
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to enable ARM64 emulation'
}

$builderExists = docker buildx ls | Select-String "^$builder\s"
if ($builderExists) {
    docker buildx use $builder
} else {
    docker buildx create --name $builder --driver docker-container --use | Out-Null
}
docker buildx inspect $builder --bootstrap | Out-Null

$armTag = "${image}:${Version}-aarch64"
$amdTag = "${image}:${Version}-amd64"
$releaseTag = "${image}:${Version}"

Push-Location $addonRoot
try {
    docker buildx build --builder $builder --platform linux/arm64 --provenance=false --build-arg BUILD_ARCH=aarch64 --build-arg BUILD_VERSION=$Version --tag $armTag --load .
    if ($LASTEXITCODE -ne 0) { throw 'ARM64 image build failed' }
    docker push $armTag
    if ($LASTEXITCODE -ne 0) { throw 'ARM64 image push failed' }

    docker build --provenance=false --build-arg BUILD_ARCH=amd64 --build-arg BUILD_VERSION=$Version --tag $amdTag .
    if ($LASTEXITCODE -ne 0) { throw 'AMD64 image build failed' }
    docker push $amdTag
    if ($LASTEXITCODE -ne 0) { throw 'AMD64 image push failed' }

    docker buildx imagetools create --tag $releaseTag $armTag $amdTag
    if ($LASTEXITCODE -ne 0) { throw 'Multi-architecture manifest publish failed' }
    docker buildx imagetools inspect $releaseTag
    if ($LASTEXITCODE -ne 0) { throw 'Published image verification failed' }
} finally {
    Pop-Location
}
