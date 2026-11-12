param(
    [string]$JavaHome = 'C:\Program Files\Java\jdk-17',
    [string]$MavenHome,
    [string]$TomcatHome,
    [int]$Port = 8080,
    [switch]$SkipBuild,
    [switch]$TestMode
)
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
$workspace = Split-Path $project -Parent
$runtime = Join-Path $workspace '.runtime'
if ($TestMode -and !$PSBoundParameters.ContainsKey('Port')) { $Port = 8081 }
if (!$TomcatHome) { $TomcatHome = Join-Path $runtime 'apache-tomcat-9.0.102' }
if (!(Test-Path "$JavaHome/bin/java.exe")) { throw "JDK missing: $JavaHome. Pass -JavaHome with your JDK directory." }
if (!(Test-Path "$TomcatHome/bin/bootstrap.jar")) { throw "Tomcat 9 missing: $TomcatHome. Extract Tomcat 9.0.102 there or pass -TomcatHome." }
$portProbe = New-Object System.Net.Sockets.TcpClient
$occupied = $false
try {
    $pending = $portProbe.ConnectAsync('127.0.0.1', $Port)
    if ($pending.Wait(1000)) { $occupied = $portProbe.Connected }
} catch {
    # Connection refused means no local server is listening.
} finally { $portProbe.Dispose() }
if ($occupied) {
    throw "Port $Port is already in use. Stop the existing server or pass -Port 8081."
}
$env:JAVA_HOME = $JavaHome
$env:PATH = "$JavaHome/bin;$env:PATH"
if (!$SkipBuild) {
    $maven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($MavenHome) { $maven = Join-Path $MavenHome 'bin/mvn.cmd' }
    elseif ($maven) { $maven = $maven.Source }
    else {
        $maven = Join-Path $env:USERPROFILE 'Downloads/maven-mvnd-1.0.3-windows-amd64/maven-mvnd-1.0.3-windows-amd64/mvn/bin/mvn.cmd'
    }
    if (!(Test-Path $maven)) { throw 'Maven missing. Add its bin folder to PATH or pass -MavenHome.' }
    Push-Location $project
    try {
        & $maven --batch-mode --no-transfer-progress clean package
        if ($LASTEXITCODE -ne 0) { throw "Maven build failed ($LASTEXITCODE)." }
    } finally { Pop-Location }
}
$base = Join-Path $runtime 'tomcat9-base'
if ($TestMode) { $base = Join-Path $runtime 'test-tomcat9' }
New-Item -ItemType Directory -Force "$base/conf", "$base/logs", "$base/temp", "$base/work", "$base/webapps" | Out-Null
if (!(Test-Path "$base/conf/server.xml")) {
    Copy-Item "$TomcatHome/conf/*" "$base/conf" -Recurse
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
$server = [IO.File]::ReadAllText("$base/conf/server.xml")
$server = [regex]::Replace($server, 'port="\d+" protocol="HTTP/1.1"', ('port="' + $Port + '" protocol="HTTP/1.1"'))
if ($TestMode) { $server = $server.Replace('port="8005"', 'port="-1"') }
[IO.File]::WriteAllText("$base/conf/server.xml", $server, $utf8)
# Seed once; later builds never replace live records or uploaded covers.
$data = Join-Path $runtime 'bookstore-data'
if ($TestMode) { $data = Join-Path $runtime 'test-data' }
if (!(Test-Path $data)) {
    $seed = Join-Path $runtime 'tomcat/webapps/onlinebookstore/WEB-INF/data'
    if (!(Test-Path $seed)) { $seed = Join-Path $project 'src/main/webapp/WEB-INF/data' }
    if (!(Test-Path $seed)) { $seed = Join-Path $project 'demo-data' }
    Copy-Item $seed $data -Recurse
}
$covers = Join-Path $runtime 'bookstore-covers'
if ($TestMode) { $covers = Join-Path $runtime 'test-covers' }
if (!(Test-Path $covers)) {
    $coverSeed = Join-Path $project 'src/main/webapp/WEB-INF/uploads/book-covers'
    if (Test-Path $coverSeed) { Copy-Item $coverSeed $covers -Recurse }
    else { New-Item -ItemType Directory -Force $covers | Out-Null }
}
$war = Join-Path $project 'target/onlinebookstore.war'
if (!(Test-Path $war)) { throw 'WAR missing. Run without -SkipBuild.' }
Copy-Item $war "$base/webapps/onlinebookstore.war" -Force
$env:CATALINA_HOME = $TomcatHome
$env:CATALINA_BASE = $base
$env:CATALINA_OPTS = '-Dfile.encoding=UTF-8 "-Dbookstore.data.dir=' + $data + '" "-Dbookstore.covers.dir=' + $covers + '"'
Write-Host "BookVerse: http://localhost:$Port/onlinebookstore/"
Write-Host "Persistent records: $data"
& "$TomcatHome/bin/catalina.bat" run
