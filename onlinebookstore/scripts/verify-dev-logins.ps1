$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Net.Http
$runtime=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.runtime'
$file=Get-ChildItem (Join-Path $runtime 'local-auth/accounts-*.json') | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$entries=Get-Content $file.FullName -Raw | ConvertFrom-Json
$results=@()
foreach($entry in $entries){
 $handler=New-Object Net.Http.HttpClientHandler;$handler.AllowAutoRedirect=$false
 $client=New-Object Net.Http.HttpClient($handler)
 $ptr=[IntPtr]::Zero
 try{
  $secure=ConvertTo-SecureString $entry.ProtectedPassword
  $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $route='/login';$target='/index.jsp';$dashboard='/user/profile.jsp'
  if($entry.Role -eq 'Admin'){$route='/admin/login';$target='/admin/dashboard';$dashboard=$target}
  foreach($valid in @($false,$true)){
   $form=New-Object 'Collections.Generic.Dictionary[string,string]';$form.Add('username',$entry.Username)
   $attempt=$password;if(!$valid){$attempt=[guid]::NewGuid().ToString()};$form.Add('password',$attempt)
   $content=New-Object Net.Http.FormUrlEncodedContent($form)
   $response=$client.PostAsync('http://localhost:8080/onlinebookstore'+$route,$content).GetAwaiter().GetResult()
   if(!$valid){if([int]$response.StatusCode -ne 200){throw 'Incorrect-password rejection failed'}}
   else{
    if([int]$response.StatusCode -ne 302 -or !$response.Headers.Location.ToString().EndsWith($target)){throw 'Correct-password login failed'}
    $page=$client.GetAsync('http://localhost:8080/onlinebookstore'+$dashboard).GetAwaiter().GetResult()
    if([int]$page.StatusCode -ne 200){throw 'Authenticated dashboard inaccessible'}
    if($entry.Role -eq 'Customer' -and !$page.Content.ReadAsStringAsync().GetAwaiter().GetResult().Contains($entry.Username)){throw 'Customer identity missing'}
   }
   $results+=@{Role=$entry.Role;Username=$entry.Username;Check=$(if($valid){'Correct password and dashboard'}else{'Wrong password rejected'});Status='PASS'}
   $content.Dispose();$response.Dispose()
  }
 }finally{
  $password=$null;$attempt=$null
  if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
  $client.Dispose();$handler.Dispose()
 }
}
$results | ConvertTo-Json | Set-Content (Join-Path $runtime 'auth-login-results.json') -Encoding UTF8
$results | ForEach-Object {Write-Output "PASS $($_.Role): $($_.Check)"}
