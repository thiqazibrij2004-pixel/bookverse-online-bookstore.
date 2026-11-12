param([Parameter(Mandatory=$true)][ValidateSet('Admin','Customer')][string]$Role)
$ErrorActionPreference='Stop'
$runtime=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.runtime'
$file=Get-ChildItem (Join-Path $runtime 'local-auth/accounts-*.json') | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if(!$file){throw 'No private development accounts have been provisioned.'}
$records=Get-Content $file.FullName -Raw | ConvertFrom-Json
$entry=$records | Where-Object Role -eq $Role
$secure=ConvertTo-SecureString $entry.ProtectedPassword
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try{Set-Clipboard -Value ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr))}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
Write-Output "Password copied for $($entry.Username). Paste into the local login form, then clear the clipboard with: Set-Clipboard -Value ''"
