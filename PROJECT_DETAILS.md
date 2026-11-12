# BookVerse project details

## Purpose

BookVerse is a university Online Bookstore Management System. Customers can discover books, manage a reading wishlist, maintain a cart, complete a simulated purchase, track orders, and write reviews. Administrators manage the catalog and orders through the existing administration interface.

This repository contains the restored application, its supporting scripts, verification documentation, and real module screenshots. The original Java web architecture and styling are retained.

## Modules

| Module | Main screens and behavior |
| --- | --- |
| Home | Featured books, genres, top-book links, shared navigation/footer |
| Books | Catalog, search results, genre listing, details, top books, cover images |
| Customer accounts | Registration, login/logout, profile editing, premium upgrade form |
| Cart | Add, increase/decrease quantities, remove items, display order totals |
| Wishlist | Create, list, view, edit, delete, select a list, edit item notes/priority |
| Checkout and orders | Address/contact form, payment form, confirmation, history, details, cancellation |
| Reviews | Add, display, My Reviews, edit, delete confirmation |
| Admin | Login, dashboard, catalog CRUD, cover previews/uploads, administrator management, order list/details/status |

Some original templates are legacy standalone files. A dedicated admin customer-management screen and password-recovery flow were not found and were not invented during restoration. Unavailable navigation is disabled where repaired. Screenshot captions identify the legacy update-order template and shared fragments.

## Architecture and storage

Requests reach annotated `javax.servlet` controllers, which use the existing manager/model classes and forward to JSP views. `WEB-INF/web.xml` uses Servlet 4.0 and leaves annotation scanning enabled. Tomcat 9 provides the compatible Servlet/JSP container.

Managers persist records in text files for users, admins, books, carts, wishlists/items, reviews, orders/items, and payments. `StoragePaths` supports external data/cover directories so redeployment can preserve records. These private runtime files are excluded from the repository. Clean seed files support a fresh checkout.

Custom generic/user/book linked lists, inheritance for customer and book types, and QuickSort remain in the code. No database or additional application framework was introduced.

## Source map

```text
onlinebookstore/
  pom.xml                  Maven WAR build
  src/main/java/com/bookstore/
    model/                 Managers and domain models
    servlet/               Request controllers
    filter/                Admin access filter
    util/                  Structures, validation, hashing, storage paths
  src/main/webapp/          JSP views and public assets
  scripts/                 Run/stop, private account setup, verification/capture tools
  demo-data/               Empty, non-sensitive development seed files
docs/SCREENSHOTS.md         Module-by-module screenshot viewer
artifacts/                 Actual screenshot gallery, PNGs, and ZIP
```

## Authentication and local setup

New development accounts provisioned by the supplied helper store PBKDF2-HMAC-SHA256 hashes using 600,000 iterations and random salts. Verification remains compatible with unchanged legacy plaintext records. Private generated-password storage uses Windows DPAPI and remains outside Git. There is no shipped default password; optional empty-store admin initialization reads `BOOKVERSE_INITIAL_ADMIN_PASSWORD` from the process environment and hashes it.

Existing production-like data, original local users, password files, logs, backups, IDE caches, installed Tomcat binaries, and build outputs are intentionally not published. The first locally provisioned administrator in a clean checkout becomes super-admin. Follow the root README for setup and `LOCAL_AUTH_SETUP.md` for password handling.

## Restoration and verification

Restoration addressed build/environment configuration, persistent storage paths, missing JSP forwards, search/filter intersections, navigation/resource issues, mobile order layouts, payment-method validation, and cover-preview JavaScript that conflicted with JSP expression processing.

Verification used Maven, HTTP workflows, focused JavaScript function checks, real headless Chrome browser interactions, desktop/tablet/mobile viewports, and console/network inspection. The historical report includes individual PASS/FAIL/NOT TESTED results and evidence locations. It does not claim exhaustive validation or cross-browser/accessibility coverage.

The screenshot set has 45 captures covering all 38 JSP files (including two shared fragments) plus search/dialog states. Normal pages are full-page desktop captures; dialogs use viewport captures. All write operations for capturing/verification used separate copied datasets, preserving the live records.

## Known limitations

- Payment processing is a simulation, not an actual payment-gateway integration.
- Text-file managers rewrite snapshots; concurrent writes and crash recovery are not fully hardened.
- Legacy registration/profile/reset code paths should be reviewed before production use; secure development provisioning does not constitute a complete authentication migration.
- Some UI entries and templates remain historical placeholders.
- Cross-browser testing, physical-device behavior, a complete accessibility/keyboard audit, and every validation branch remain outside the completed checks.

## Attribution and screenshots

The original README retains its university-project attribution. Restoration work preserves the existing application rather than replacing its author or design. Replacement background photos came from the same existing Unsplash image provider; source photo IDs are documented in the restoration report. Book covers and other third-party visual assets retain their respective ownership.

See [the screenshot index](docs/SCREENSHOTS.md), [the restoration report](PROJECT_RESTORATION_REPORT.md), and [the manual checklist](FRONTEND_MANUAL_TEST_CHECKLIST.md) for details.
