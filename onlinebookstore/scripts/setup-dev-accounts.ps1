param([switch]$Generate, [string]$AdminUsername='dev_admin', [string]$CustomerUsername='dev_customer')
$ErrorActionPreference='Stop'
$project=Split-Path $PSScriptRoot -Parent
$runtime=Join-Path (Split-Path $project -Parent) '.runtime'
$data=Join-Path $runtime 'bookstore-data'
$private=Join-Path $runtime 'local-auth'
$probe=New-Object Net.Sockets.TcpClient
$listening=$false
try{$pending=$probe.ConnectAsync('127.0.0.1',8080);if($pending.Wait(500)){$listening=$probe.Connected}}catch{}finally{$probe.Dispose()}
if($listening){throw 'Stop BookVerse with scripts/stop.ps1 before adding accounts, to prevent concurrent file writes.'}
foreach($name in @($AdminUsername,$CustomerUsername)){if($name -notmatch '^dev_[A-Za-z0-9_]{1,16}$'){throw 'Development usernames must start with dev_ and be at most 20 characters.'}}
$adminFile=Join-Path $data 'admins.txt'; $customerFile=Join-Path $data 'users.txt'
if((Get-Content $adminFile | Where-Object {($_ -split ',')[1] -eq $AdminUsername}) -or (Get-Content $customerFile | Where-Object { $parts=$_ -split ','; $index=1; if($parts[0] -in @('REGULAR','PREMIUM')){$index=2}; $parts[$index] -eq $CustomerUsername })){throw 'An account with this name exists. Choose new development usernames; existing passwords will not be changed.'}
$java='C:\Program Files\Java\jdk-17\bin'
$classes=Join-Path $project 'target/classes';$cli=Join-Path $project 'target/local-tools'
New-Item -ItemType Directory -Force $cli,$private | Out-Null
& "$java/javac.exe" -cp $classes -d $cli "$PSScriptRoot/LocalDevPasswordHash.java"
if($LASTEXITCODE -ne 0){throw 'Build the project before provisioning.'}
function New-PrivatePassword([string]$label){
 if(!$Generate){$first=Read-Host "$label password (16-20 characters, upper/lower/number and @ # $ % ^ & + =)" -AsSecureString; $second=Read-Host "Confirm $label password" -AsSecureString;return @($first,$second)}
 $bytes=New-Object byte[] 18; $rng=[Security.Cryptography.RandomNumberGenerator]::Create();try{$rng.GetBytes($bytes)}finally{$rng.Dispose()};$value='Aa1@'+[Convert]::ToBase64String($bytes).Substring(0,16);$secure=ConvertTo-SecureString $value -AsPlainText -Force;return @($secure,$secure)
}
function Get-Plain([Security.SecureString]$secret){$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret);try{[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}}
$entries=@();foreach($role in @('Admin','Customer')){
 $pair=New-PrivatePassword $role;$plain=Get-Plain $pair[0];$confirmation=Get-Plain $pair[1]
 if($plain -cne $confirmation -or $plain.Length -lt 16 -or $plain.Length -gt 20 -or $plain -cnotmatch '[A-Z]' -or $plain -cnotmatch '[a-z]' -or $plain -notmatch '[0-9]' -or $plain -notmatch '[@#$%^&+=]' -or $plain -match '[^\x21-\x7E]'){throw 'Use matching 16-20 character printable ASCII passwords with uppercase, lowercase, a number and @ # $ % ^ & + =.'}
 $hash=$plain | & "$java/java.exe" -cp "$classes;$cli" LocalDevPasswordHash
 if($LASTEXITCODE -ne 0 -or $hash -notmatch '^pbkdf2-sha256\$600000\$'){throw 'Hashing failed.'}
 $entries+=@{Role=$role;Username=$(if($role -eq 'Admin'){$AdminUsername}else{$CustomerUsername});Hash=$hash;ProtectedPassword=(ConvertFrom-SecureString $pair[0])}
 $plain=$null;$confirmation=$null
}
$stamp=Get-Date -Format yyyyMMdd-HHmmssfff;$backup=Join-Path $private "backup-$stamp";New-Item -ItemType Directory $backup | Out-Null
Copy-Item $adminFile,$customerFile $backup
$now=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();$utf8=New-Object Text.UTF8Encoding($false)
foreach($entry in $entries){$id=[guid]::NewGuid().ToString();$name=$entry.Username;$hash=$entry.Hash
 if($entry.Role -eq 'Admin'){$file=$adminFile;$adminRole='ADMIN';if([string]::IsNullOrWhiteSpace([IO.File]::ReadAllText($adminFile))){$adminRole='SUPER_ADMIN'};$line="$id,$name,$hash,Local Development Admin,$name@example.invalid,$adminRole,$now,0,true"}
 else{$file=$customerFile;$line="REGULAR,$id,$name,$hash,$name@example.invalid,Local Development Customer,$now,0,0"}
 $existing=[IO.File]::ReadAllText($file);$prefix='';if($existing.Length -gt 0 -and !$existing.EndsWith("`n")){$prefix="`r`n"};[IO.File]::AppendAllText($file,$prefix+$line+"`r`n",$utf8)
}
$secrets=$entries | ForEach-Object {@{Role=$_.Role;Username=$_.Username;ProtectedPassword=$_.ProtectedPassword}}
$secretFile=Join-Path $private "accounts-$stamp.json";$secrets | ConvertTo-Json | Set-Content $secretFile -Encoding UTF8
Write-Output "Created $AdminUsername and $CustomerUsername with salted PBKDF2 hashes. Existing accounts were not overwritten."
Write-Output "Private Windows-user-encrypted password file: $secretFile"
