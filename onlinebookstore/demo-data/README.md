# Clean development data

The text files here intentionally contain no accounts, orders, payments, or personal records. On a fresh checkout the runner copies them into `.runtime/bookstore-data/` once. BookVerse's existing initializer supplies demo books when the catalog is empty. Covers without uploaded images use the bundled fallback.

Create your own local accounts with `scripts/setup-dev-accounts.ps1`. No default password is shipped. The first account provisioned into an empty admin file receives `SUPER_ADMIN`; subsequent development admins receive `ADMIN`.

Original local data and backups are excluded from version control and are never overwritten by this seed directory.
