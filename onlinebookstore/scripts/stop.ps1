$ErrorActionPreference = 'Stop'
$runtime = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.runtime'
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$env:CATALINA_HOME = Join-Path $runtime 'apache-tomcat-9.0.102'
$env:CATALINA_BASE = Join-Path $runtime 'tomcat9-base'
& "$env:CATALINA_HOME/bin/catalina.bat" stop
