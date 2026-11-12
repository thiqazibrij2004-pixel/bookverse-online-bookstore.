# BookVerse local authentication

The live runtime files are `.runtime/bookstore-data/admins.txt` and `users.txt`. Source files under `WEB-INF/data` are initial snapshots, not the current live database.

The documented `admin` account exists, is active, and its documented password still works. The documented customer `user1` is absent. No existing password was changed.

Two separate local development accounts were created and verified on Tomcat 9:

| Account | Username | Login URL | After login |
| --- | --- | --- | --- |
| Admin | `dev_admin` | http://localhost:8080/onlinebookstore/admin/login | `/onlinebookstore/admin/dashboard` |
| Customer | `dev_customer` | http://localhost:8080/onlinebookstore/login | `/onlinebookstore/user/profile.jsp` |

The development admin has the ordinary `ADMIN` role, not `SUPER_ADMIN`; administrator-account management remains restricted to the existing super-admin.

## Use the generated passwords without displaying them

From the workspace root, run one of these in a local PowerShell terminal:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\copy-dev-password.ps1 -Role Admin
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\copy-dev-password.ps1 -Role Customer
```

Paste into the matching local login form. Then clear the clipboard:

```powershell
Set-Clipboard -Value ''
```

The helper copies the password without printing it. It reads the latest `.runtime/local-auth/accounts-*.json` file, whose password values are encrypted with Windows DPAPI for the Windows user who created them. This file is local-only, excluded from Git, and cannot be decrypted just by opening its JSON text or copying it to another Windows account. Do not upload it, the runtime data, or backups.

## Choose your own passwords securely

The following creates another development pair using masked prompts. It never resets an existing account; names must be new and begin with `dev_`.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\stop.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\setup-dev-accounts.ps1 -AdminUsername dev_admin_me -CustomerUsername dev_customer_me
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\run.ps1 -SkipBuild
```

Enter each password twice at the masked prompts: 16–20 printable ASCII characters, uppercase, lowercase, a number, and at least one of `@ # $ % ^ & + =`. Passwords are not command-line arguments, shell-history entries, or console output. The helper uses salted PBKDF2-HMAC-SHA256 with 600,000 iterations and stores only hashes in account records. It backs up both live account files before appending records and refuses duplicate names or provisioning while port 8080 is serving.

Do not type passwords into chat or put them in command arguments, scripts, screenshots, Git, or logs. Existing profile/admin reset flows were not redesigned in this task; use this provisioning helper for securely hashed development pairs rather than relying on those legacy plaintext-setting flows.

## Verification and preservation

- Both new logins and their authenticated pages passed on the live Tomcat 9 deployment. Wrong-password rejection passed for both.
- The documented admin login passed on the separate copied-data Tomcat server, without updating the original admin's live last-login record.
- All original admin/customer record lines remain unchanged. Each live account file has exactly one appended development record; all source data files and all eight unrelated live data files are unchanged.
- Hashing checks passed for random salts, correct/incorrect/null passwords, malformed hashes, bounded iteration counts, both models, and legacy plaintext compatibility.
- New generated passwords were not found in the current server transcript or Tomcat logs.
- Runtime data, backups, source data snapshots and uploads are excluded from version control. Publishing the source/screenshots does not publish the private password vault or account records; ignore rules do not remove files already tracked in a future/external Git repository.

Existing accounts still use legacy plaintext comparison. The project previously had an unused unsalted SHA-256 helper; it was not used for these new accounts. PBKDF2 verification was added using the JDK, with no new dependency and no automatic rehash or migration of existing users.

For a fresh GitHub checkout there are no published account records or default passwords. The first admin provisioned into an empty admin file receives `SUPER_ADMIN`; subsequent development admins receive `ADMIN`. The ordinary-role description above records the original restored workspace, where a super-admin already existed.

To repeat verification locally without printing passwords:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\verify-dev-logins.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\verify-auth-logs.ps1
```

The login verifier updates only the latest generated development pair's last-login fields. Results without secrets are saved in `.runtime/auth-login-results.json`.
