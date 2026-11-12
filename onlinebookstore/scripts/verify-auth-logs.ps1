$ErrorActionPreference='Stop'
$runtime=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.runtime'
$entries=Get-Content (Get-ChildItem "$runtime/local-auth/accounts-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName -Raw | ConvertFrom-Json
$logs=@((Get-Item "$runtime/auth-live-server.log")) + @(Get-ChildItem "$runtime/tomcat9-base/logs" -File)
foreach($entry in $entries){
 $secure=ConvertTo-SecureString $entry.ProtectedPassword
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try{
  $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  foreach($file in $logs){
   $stream=[IO.File]::Open($file.FullName,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::ReadWrite)
   $reader=New-Object IO.StreamReader($stream)
   try{if($reader.ReadToEnd().Contains($plain)){throw 'A generated development password was found in a server log.'}}finally{$reader.Dispose();$stream.Dispose()}
  }
 }finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr);$plain=$null}
}
Write-Output 'PASS: generated development passwords absent from current Tomcat and server transcript logs.'
