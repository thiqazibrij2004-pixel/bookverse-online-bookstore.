# BookVerse restoration report

Latest authentication follow-up: see [LOCAL_AUTH_SETUP.md](LOCAL_AUTH_SETUP.md) for verified local login URLs and private password setup. Existing passwords were preserved; separate `dev_admin` and `dev_customer` accounts now use salted PBKDF2-HMAC-SHA256. Both correct-password/dashboard checks and wrong-password rejection passed on live Tomcat 9. The documented admin remains valid; documented customer `user1` is absent. No plaintext development credentials are included in this report. Current authentication WAR: **2,472,403 bytes**, clean Maven build passed, Tomcat startup **1,898 ms**.

Verified on 12 November 2026 (Asia/Colombo).

## Result

The existing JSP/Servlet application builds successfully and runs at:

http://localhost:8080/onlinebookstore/

Server: Apache Tomcat **9.0.102**, JDK **17.0.12**. After the frontend verification below, the deployed artifact is `onlinebookstore/target/onlinebookstore.war` (2,470,989 bytes). No framework migration, database, dependency upgrade, or UI redesign was introduced.

## Backup and data preservation

There is no Git repository in the workspace or project directory. Before source changes, a filesystem checkpoint was created at:

`.restoration-backups/20261112-115342/`

It contains the original `src`, `pom.xml`, `README.md`, a copy of the earlier running application's data, and SHA-256 hashes of the ten source data files. All ten source files and all ten live runtime files matched their backups after the final build and server restart. Existing books, users, administrators, carts, wishlists, reviews, orders, order items, and payments were preserved. Sample-book initialization detected existing books and skipped creating sample records.

Live data: `.runtime/bookstore-data/`

Live uploaded covers: `.runtime/bookstore-covers/`

These directories are outside the deployed WAR and are seeded only when absent. Subsequent builds and redeployments do not replace them. Back up both directories before moving the project or changing records. The original source data remains in `onlinebookstore/src/main/webapp/WEB-INF/data/`; it is an initial snapshot, not the current runtime database.

Automated write tests ran exclusively on port 8081 with `.runtime/test-data/` and `.runtime/test-covers/`. Temporary test accounts and orders exist only in that copied test dataset. The test server was stopped afterward.

## Environment findings

| Item | Finding |
| --- | --- |
| Default Java / javac | Oracle JDK 22.0.2, through Oracle's `javapath` |
| Other installed JDK | `C:\Program Files\Java\jdk-17` (17.0.12), selected by the runner |
| Maven | 3.9.11, bundled under the downloaded Maven mvnd distribution |
| `mvn` on PATH | Missing; plain `mvn -version` fails |
| Initial JAVA_HOME / CATALINA_HOME | Unset |
| Earlier server | XAMPP Tomcat 8.5.96; replaced for this project with workspace-local Tomcat 9.0.102 |
| Original IntelliJ Smart Tomcat configuration | References an unavailable old relative Tomcat installation; not a VS Code configuration |
| VS Code | Added build/run and stop tasks at the workspace root |

The runner sets environment variables for its process without changing Windows-wide settings. It accepts `-JavaHome`, `-MavenHome`, `-TomcatHome`, and `-Port` overrides. No changes were made to XAMPP or another original Tomcat installation.

## Problems, root causes, and fixes

1. **Full Maven build failed despite successful compilation.** Missing Surefire and packaging dependencies needed downloading; the restricted process could not write Maven's user cache. After downloading with approved access, `clean package` succeeded. This was an environment/cache issue, not a Java compilation error.
2. **Java target and source encoding depended on Maven defaults.** Added explicit UTF-8 source encoding and Java 8 release targeting, using the compiler and WAR plugin versions already used by the installed Maven build. Final compilation reports `release 8` and runs using JDK 17.
3. **Deployment configuration did not match the servlet API.** Replaced the old Servlet 2.3 DTD descriptor with a Servlet 4.0 descriptor, retaining annotation scanning and existing mappings. The application continues to use `javax.servlet`, compatible with Tomcat 9.
4. **Data and uploaded covers were stored in the expanded deployment.** A replacement WAR could lose runtime changes. Added `StoragePaths`, honoring `bookstore.data.dir` and `bookstore.covers.dir`. Updated the seven record managers and image manager to use it in servlet contexts. Legacy deployment-local paths remain available without overrides; an unresolved `getRealPath()` now produces a clear configuration error. The runner supplies persistent external paths and UTF-8 JVM encoding.
5. **My Reviews returned 404.** `UserReviewsServlet` forwarded to `user-reviews.jsp`, while the existing file is `user-review.jsp`. Corrected the forward and verified the authenticated page.
6. **Search and genre filters conflicted.** Both catalog/search servlets replaced search results with all matching-genre books. Changed genre filtering to intersect with existing results. The catalog JSP also ignored the search servlet's `searchQuery` attribute; it now reads that attribute first. Regression requests with a nonexistent title plus a real genre correctly return no matching book cards.
7. **Missing default cover produced broken images.** No `default_cover.jpg` was included; the old helper could create an empty file. The cover servlet now serves a bundled dark/purple SVG fallback when the requested image and default cover are missing or empty. Existing covers are unchanged; uploaded JPEG serving was also verified.

## Files changed or added

- `onlinebookstore/pom.xml`
- `onlinebookstore/src/main/webapp/WEB-INF/web.xml`
- `onlinebookstore/src/main/java/com/bookstore/util/StoragePaths.java` (new)
- Managers under `model/admin`, `model/book` (including `BookImageManager`), `model/cart`, `model/order`, `model/review`, `model/user`, and `model/wishlist`
- `servlet/book/BookListServlet.java`, `SearchBookServlet.java`, `BookCoverServlet.java`
- `servlet/review/UserReviewsServlet.java`
- `onlinebookstore/src/main/webapp/book/book-catalog.jsp`
- `onlinebookstore/src/main/webapp/WEB-INF/default-cover.svg` (new)
- `onlinebookstore/scripts/run.ps1`, `stop.ps1`, `audit.mjs`, `smoke-test.mjs` (new)
- `.vscode/tasks.json` (new)
- `onlinebookstore/README.md` (local run instructions)
- This report

Generated runtime artifacts and backups live in `.runtime/` and `.restoration-backups/` at the workspace root. No source files or original records were deleted.

## Build and deployment verification

- Final runner executed a clean Maven package build with JDK 17: **BUILD SUCCESS**.
- Maven compiled 78 Java files and generated the WAR.
- Maven reports **No tests to run** because the original project contains no Java unit-test sources. The README's original claim of included unit tests was inaccurate; the new Node HTTP integration tests provide separate verification.
- An existing unchecked-operation warning remains in `AddToCartServlet`; it does not prevent compilation.
- Static audit found no duplicate servlet mappings or missing literal JSP/servlet forwards.
- Tomcat 9 deployed the final WAR successfully; final startup completed in 1,856 ms, with no SEVERE startup errors.
- Final homepage verification: **HTTP 200**, title `BookVerse - Your Online Bookstore`.
- Stopping and restarting through the supplied scripts was verified, including preservation of live data hashes.
- Build/startup transcript: `.runtime/final-server.log`. Other Tomcat logs: `.runtime/tomcat9-base/logs/`.

## Features verified

The HTTP integration suite uses cookies, follows page redirects, checks successful JSP rendering, and checks persisted records for write workflows. It passed against the final WAR on the separate test server.

| Area | Verified |
| --- | --- |
| Books | Homepage, catalog, search, genre page, top books, details, existing covers, fallback cover, combined search/genre regression |
| Users | Registration, login, profile page, profile update persisted, logout and protected-page redirect |
| Cart | Add, increase, decrease, remove, and cart page rendering |
| Wishlists | Create, list, view, edit, add/remove book, delete; creation/item/deletion persistence checked |
| Reviews | Add, book review display, My Reviews, edit, delete; record persistence checked |
| Orders | Checkout, shipping/contact form submission, payment form, demo card payment, confirmation, history, details, cancellation persisted |
| Admin | Anonymous access guard, existing admin login, dashboard, book list, order list/details, administrator-management page |
| Admin books | Add physical book, upload JPEG cover, serve cover, edit book, delete test book; persistence checked |

## Remaining verification and limitations

- No browser automation was available. Actual browser JavaScript behavior, validation messages, mobile breakpoints, visual layout, CDN CSS/icons, and interactive navigation still need manual verification. HTTP-rendered pages alone cannot establish these.
- Exact cart arithmetic, every validation/error branch, guest-cart merging, account upgrades, premium tiers, administrator-account CRUD, and admin order-status changes were not exhaustively tested.
- No dedicated admin user-management servlet/page was found in the existing project. User profile management exists; a separate admin user-management screen was not added.
- Existing payment processing is explicitly a demo that marks payments successful. No real payment provider was introduced or tested.
- Existing managers load snapshots and rewrite text files. Concurrent writes, atomic recovery after interruption, and delimiter/newline handling across every record type remain limitations of the original storage implementation. This restoration did not redesign that storage system or change existing record formats.
- Automatic sample initialization and default-admin creation remain original behavior for empty datasets. The preserved dataset was nonempty; no live sample records or new live accounts were created during restoration.
- Tomcat must expand the WAR for legacy paths when storage overrides are omitted. The supplied runner provides external paths and uses normal expanded deployment.

## Run again from VS Code

Open the workspace folder `C:\Users\THIQA ZIBRIJ\Downloads\onlinebookstore (4)`.

Run **Terminal > Run Task > BookVerse: build and run Tomcat 9**, or execute:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\run.ps1
```

Keep that terminal running. Open http://localhost:8080/onlinebookstore/.

Stop the server with the **BookVerse: stop Tomcat 9** task, Ctrl+C in its terminal, or:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\stop.ps1
```

If port 8080 is occupied, stop the existing BookVerse server first, or use `-Port 8082` and visit that port. `-SkipBuild` reuses the existing WAR and must not be used after source changes.

### Make Maven available in a terminal

No installation is needed on this machine. For the current PowerShell session:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$mavenDirectory = Join-Path $env:USERPROFILE 'Downloads\maven-mvnd-1.0.3-windows-amd64\maven-mvnd-1.0.3-windows-amd64\mvn'
$env:Path = "$env:JAVA_HOME\bin;$mavenDirectory\bin;$env:Path"
java -version
javac -version
mvn -version
where.exe java
where.exe mvn
Set-Location .\onlinebookstore
mvn clean package
```

For a permanent setup, add that Maven `bin` directory to your user `Path` in Windows **Edit environment variables for your account**, set user `JAVA_HOME` to the JDK directory, and reopen VS Code. The runner handles Tomcat variables itself.

On another machine, install JDK 17 and extract Maven and Apache Tomcat 9.0.102 ZIP distributions. Point the runner at their installation directories with its parameters. The workspace-local Tomcat used here is `.runtime/apache-tomcat-9.0.102/`.

### Reproduce the automated tests

Requires Node.js (verified with installed v24.14.0). Start the isolated test server in a separate terminal:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\run.ps1 -TestMode -SkipBuild
```

Wait for Tomcat's `Server startup` message before running:

```powershell
node .\onlinebookstore\scripts\audit.mjs
node .\onlinebookstore\scripts\smoke-test.mjs
```

Stop the test server with Ctrl+C. The smoke test intentionally uses only port 8081 and copied test records. Do not point live deployments at `.runtime/test-data/`.

## Final frontend and functional verification — 12 November 2026

This follow-up was completed after the restoration above. Results here supersede the earlier untested status only for the specific checks listed. **No browser-based visual or interaction test was performed.** No browser automation tools, Playwright/Puppeteer packages, or browser drivers were available. The manual checklist is [FRONTEND_MANUAL_TEST_CHECKLIST.md](FRONTEND_MANUAL_TEST_CHECKLIST.md); its items remain unchecked.

### Scope and evidence

- Inspected all **38 JSP source files**, including shared fragments, forms, buttons, tables, inline styles/scripts, and referenced links/resources. There are no separate project CSS or JS files: styling and custom JavaScript are embedded in JSPs, with shared libraries loaded from CDNs.
- Checked syntax of **20 inline script blocks** after normalizing JSP expressions. Also checked actual inline JavaScript in the HTTP-rendered pages with the Node/V8 parser. This establishes syntax validity, not a clean browser console.
- Final static route/form-target scan found **zero missing targets** among the literal routes it could resolve. Dynamic/template-generated routes were separately exercised in the HTTP workflows where listed below. The audit does not claim to exhaust every possible data-dependent URL.
- Final HTTP verification made **43 rendered page checks across 36 distinct route/query combinations**, with **29 explicit workflow/validation assertions**. All passed. Scanning those rendered responses found no duplicate HTML IDs, missing Bootstrap `data-bs-target` IDs, or missing nonempty fragment targets.
- **27 focused JavaScript function checks** passed using lightweight DOM stubs in Node. They cover password visibility, registration password/confirmation rules, revalidation after editing the original password, stock-bounded quantity controls, billing-address toggling, all four payment selectors, card/expiry formatting, wishlist priority controls, and ISBN/cover-size validators. They do not establish native browser validation, layout, focus management, Bootstrap modal behavior, or DataTables behavior.
- Retrieved all four existing book covers under `/onlinebookstore/book-covers/`: **HTTP 200**, nonempty JPEG responses. The existing integration suite additionally checked the fallback SVG and an uploaded JPEG cover.
- Retrieved **30 external resources**: linked library CSS/JS, static images, and fonts referenced by the icon CSS. All returned **HTTP 200** with nonempty bodies after the broken bank image was replaced. Downloaded JavaScript parsed successfully. This is a point-in-time server-side resource check; browser CORS/CSP behavior, offline availability, and dynamically generated avatar URLs remain unverified.
- The existing smoke suite passed again against the final WAR, including login/logout, profile changes, cart updates, wishlist CRUD, review CRUD, demo payment, orders/cancellation, and admin book CRUD/cover upload.
- A clean Maven package build passed with the final source. WAR deployment on live Tomcat 9.0.102 succeeded; the restarted server reported startup in **2,086 ms**, with no SEVERE startup entries in the new transcript. Final live homepage returned **HTTP 200**.

### Issues found and corrected

| Issue | Change and verification |
| --- | --- |
| Old `/view-cart`, `/view-recommendations`, `/profile`, and `/admin/manage-orders.jsp` links | Pointed to existing `/cart`, `/top-books`, `/user/profile.jsp`, and `/admin/orders`. Source target scan and corresponding HTTP routes passed. Recommendations now open the existing Top Books screen; no personalized recommendation system was added. |
| Links to nonexistent admin Users/Profile/System Settings screens and password recovery | Removed the actionable `href`, added `aria-disabled`, removed from tab order, and supplied an unavailable tooltip. Existing text and styles remain. These features remain unimplemented; they are not marked functional. |
| `/contact` links returned 404 | Pointed them to the Contact Information already present in each affected footer using `#contact-information`. Rendered fragment-target checks passed. No new contact screen or invented contact information was added. |
| Bank-transfer image URL returned HTTP 404 | Replaced the image with the bank/university icon from the already-loaded Font Awesome library. No new image dependency or stylesheet was introduced. The old failing URL is no longer referenced. Actual icon appearance awaits browser inspection. |
| Admin order detail page omitted the mobile viewport declaration | Added the same viewport setting used by other full pages. All full JSP pages now declare a viewport; shared fragments are excluded. Mobile layout is not claimed verified. |
| Registration UI treated special characters differently from the server | Aligned the client strength/submit checks with the existing 8–20 character server rule and supported `@ # $ % ^ & + =` characters. Node checks confirmed invalid passwords/confirmation are prevented and a server-compatible password is accepted; HTTP tests confirmed server rejection cases. |
| Profile password confirmation became stale when the original password changed | Revalidate on input in both new-password fields. Node tests confirmed the error appears after changing the original field and clears once corrected. |
| Missing payment method threw a caught exception; an invalid value silently defaulted to credit card | `ProcessPaymentServlet` now rejects missing/invalid methods with a normal validation message and redirects back to the form. Both cases were submitted over HTTP; no payment records were added. Valid demo card payment still passed. |

### Functional and error handling checks actually executed

- Anonymous requests to wishlist, checkout, order history, and My Reviews redirected to login.
- Registration rejected missing fields, mismatched passwords, invalid email, weak passwords, and duplicate usernames. Rejected registrations created no records. Valid registration and wrong-password handling were tested.
- Empty-cart checkout redirected to cart; missing book parameters were handled without HTTP errors.
- Missing checkout shipping/contact fields displayed the existing required-fields error and created no order. Valid same-address checkout and demo payment passed.
- Empty wishlist name created no record. Wishlist selection, item-edit page, note/priority persistence, and the original suite's create/view/edit/remove/delete flow passed.
- Out-of-range rating and empty review comments were rejected without adding reviews. Valid review, My Reviews, edit/delete confirmation pages, and the original edit/delete workflow passed.
- Missing card details and missing/invalid payment methods produced validation feedback and no payment record. Successful demo payment rendered confirmation, history, and details.
- User logout removed protected access. Wrong admin credentials were rejected; valid admin login rendered dashboard, book management, administrator management, and order list/details.
- Invalid admin order status showed an error and left the order record unchanged. Updating a test order to Processing persisted and appeared in the refreshed admin pages.
- The original smoke suite also passed its cart increase/decrease/remove sequence, order cancellation, and admin add/edit/delete book with uploaded cover.

### Changes made in this follow-up

Source changes are confined to **24 existing JSP files** and `servlet/order/ProcessPaymentServlet.java`. Affected JSP groups: admin navigation and order viewport; book/catalog and footer contact links; cart and order navigation/footer links; user login/profile/register/update/upgrade navigation and validation. No CSS palette, page layout, framework, Maven dependency, or record format was changed.

New support files:

- `onlinebookstore/scripts/frontend-audit.mjs` — source inventory, route/form-target and normalized JavaScript syntax checks.
- `onlinebookstore/scripts/check-resources.mjs` — external resource/font fetches and library JavaScript parsing.
- `onlinebookstore/scripts/frontend-functional.mjs` — rendered-response checks and isolated negative/positive workflow assertions.
- `onlinebookstore/scripts/frontend-js-checks.mjs` — explicitly labeled DOM-stub function tests.
- `onlinebookstore/scripts/fix-navigation.mjs` — one-time, idempotent navigation repair used for the JSP edits.
- `FRONTEND_MANUAL_TEST_CHECKLIST.md` — remaining browser checks; no items marked passed.

Pre-change source/report backup and data hashes:

`.restoration-backups/frontend-20261112-120912/`

All **20 source/live data files** matched that checkpoint after testing and live redeployment. No live login, order, review, or admin write tests were performed; test records were created only in `.runtime/test-data/`. Existing data was not deleted or reset. The live server remains on port 8080; the isolated test server was stopped after verification.

### Remaining manual checks and limitations

Use the manual checklist on the isolated test server. Browser Console/Network checks, actual navigation clicks, native form validation, hover/focus states, Bootstrap dropdowns/collapses/modals, DataTables sorting/search/pagination, mobile/zoom layout, and visual preservation remain **unverified in a browser**. The DOM-stub tests do not replace them.

Exact cart/tax/shipping arithmetic, every error branch, account-upgrade billing behavior, admin-account changes, invalid checkout email sent directly to the server, real payment processing, and concurrent text-file writes were not exhaustively verified. Links using `href="#"` for legal documents or placeholder activities remain original placeholders; no missing feature was invented to fill them. The original admin order-detail screen's light styling was retained.

### Reproduce and review evidence

Start the copied-data server as documented above, wait for startup, then run from the workspace root:

```powershell
node .\onlinebookstore\scripts\frontend-audit.mjs
node .\onlinebookstore\scripts\check-resources.mjs
node .\onlinebookstore\scripts\frontend-js-checks.mjs
node .\onlinebookstore\scripts\frontend-functional.mjs
node .\onlinebookstore\scripts\smoke-test.mjs
```

`check-resources.mjs` requires internet access for the existing CDN URLs. The HTTP suites intentionally target only port 8081 and the copied test dataset. They add test records and must not be pointed at live data.

Machine-readable results: `.runtime/frontend-audit.json`, `.runtime/frontend-resources.json`, and `.runtime/frontend-functional.json`. Build output: `.runtime/frontend-build.log`. Live deployment transcript: `.runtime/frontend-live-server.log`.


## Phase 3: actual Chrome browser verification - 12 November 2026

This section supersedes the earlier absence of browser testing. Chrome **157.0.8103.39** was available locally and was controlled in headless mode through its built-in DevTools Protocol, using Node's built-in WebSocket. No Playwright, Puppeteer, application framework, or other dependency was installed.

### Results and scope

Final recorded scenario totals: **88 PASS**, **0 outstanding application FAIL**, **7 NOT TESTED**. Each scenario is recorded in the table below and in the JSON evidence. These are specific assertions, not a claim that every interaction or visual detail has been tested.

The main browser suite passed 69 checks. Five additional user workflows passed (review edit/delete, wishlist edit/delete, and order cancellation), seven focused admin/preview/responsive checks passed, one remaining sidebar link check passed, and six final live-homepage checks passed. A supplemental combined runner encountered a **CDP Runtime.evaluate timeout** after completing its user workflows; that FAIL is retained in extra-results.json as a driver-continuation event. The affected admin workflows were subsequently tested successfully in the separate admin runner. It is not hidden or classified as a confirmed application defect.

Desktop **1440x900**, tablet **768x1024**, and mobile **375x812** were exercised for 17 page types: home, profile, catalog, book details, cart, wishlist details, checkout, payment, confirmation, order history, user order details, reviews, admin dashboard, admin books, admin accounts, admin orders, and admin order details. Each layout PASS means the browser measured no page-wide horizontal overflow, found no broken HTML images, and captured a screenshot. It does not substitute for a full visual/accessibility review. The existing light admin order-detail page was deliberately preserved; other tested BookVerse pages retained their dark/purple styling.

The live homepage was tested read-only on **http://localhost:8080/onlinebookstore/**. All registrations, login writes, cart/wishlist/review/order changes, and admin mutations used **port 8081** and copied test data. New books, reviews, wishlists and orders were created specifically for these tests; delete actions targeted only those generated records. No original source/live records were deleted or reset.

### Browser-confirmed defects fixed

1. **Background images blocked in Chrome:** obsolete source.unsplash.com random-image URLs produced net::ERR_BLOCKED_BY_ORB. Replaced them in index.jsp, book/genre-books.jsp, and book/top-books.jsp with three local JPEG assets from the same existing Unsplash photo provider. Existing hero/category structure, overlays, typography, and branding remain. Final live browser checks decoded all three CSS background images successfully. The old random images were not deterministic; no claim is made that these are the exact historical photos.
2. **Favicon 404:** added the BookVerse purple-book favicon.svg and context-relative icon links to full JSP pages. The final live browser recorded no favicon request failure.
3. **Admin order list unusable on narrow screens:** the fixed 250px sidebar squeezed content and caused horizontal overflow. Below 992px it now flows above the content; menu items and header wrap, and statistics can wrap on smaller widths. Desktop positioning is retained. Retests passed at all three widths; before/after screenshots are preserved.
4. **Mobile order-detail overflow:** long email/identifier text forced user/admin summary tables beyond the viewport. Added overflow-wrap and small-screen header wrapping in order/order-details.jsp and admin/order/order-details.jsp. Both pages passed mobile retests. No palette change was made.
5. **Low-contrast order-search placeholder:** applied the existing secondary-text color to the admin order search placeholder. Chrome confirmed rgb(176, 176, 176); the mobile screenshot was inspected.
6. **Admin cover preview blank:** JSP consumed the JavaScript template expression for e.target.result, leaving an empty image src in the rendered script. add-book.jsp and edit-book.jsp now create an img node and set its src directly. Chrome selected actual JPEG files, decoded both add/edit previews, saved the book changes, and deleted only the newly created test book.
7. **Remaining unimplemented Users link in admin order sidebar:** this page used a contextPath variable and still linked to the nonexistent user-management JSP. Made it non-clickable with the same unavailable semantics already used elsewhere. Chrome confirmed the entry has no href and has aria-disabled=true. No new user-management screen was invented.

Application changes: existing JSP favicon declarations; the three background-image JSPs; admin add/edit book preview JavaScript; the admin order-list responsive/placeholder/sidebar rules; user/admin order-detail wrapping; favicon.svg; assets/images/library.jpg, books.jpg, and reading.jpg. Java source, record formats, dependencies, Servlet/JSP architecture, and Tomcat 9 compatibility were unchanged in Phase 3.

Image source IDs (images.unsplash.com): library 1507842217343-583bb7270b66; books 1481627834876-b7833e8f5570; reading 1491841550275-ad7854e35ca6. Files are served locally under /onlinebookstore/assets/images/.

### Console, network, build, and preservation

- Final live Chrome console: **PASS**, no recorded JavaScript exceptions or error-level log entries.
- Final live Chrome network: **PASS**, no recorded HTTP 4xx/5xx or non-cancelled failed requests. This is the observed final session, not a promise of future CDN availability.
- The main copied-data browser run and the final independent admin run also recorded no console errors or failed requests on port 8081.
- Initial failures and driver issues were retained separately in results-before-fixes.json, results-after-first-fixes.json, extra-results-before-preview-fix.json, and the run transcripts. Smooth scrolling, incomplete input clearing, modal-transition timing, uppercase cancellation text, and a missing book-type selection caused initial driver assertions; these were corrected in the test driver rather than changing valid application behavior.
- Final clean Maven build: **PASS**, BUILD SUCCESS; WAR size **2,470,989 bytes**. Rebuilt WAR deployed to Tomcat **9.0.102 / JDK 17**, startup **1,664 ms**, with no SEVERE startup entries in browser-live-server.log.
- Pre-change checkpoint: **.restoration-backups/browser-20261112-122202/** (source, reports and SHA-256 hashes). All **20 source/live data files** matched their Phase 3 hashes after final deployment and browser checks. Earlier backup folders were retained.
- Live BookVerse remains running on port 8080. The copied-data test server and dedicated headless browser were stopped after recording results.

### Per-test record

| Browser scenario | Final status |
| --- | --- |
| Live homepage dark-purple branding | PASS |
| home layout desktop | PASS |
| home layout tablet | PASS |
| home layout mobile | PASS |
| Mobile navbar opens and closes | PASS |
| Native empty registration validation | PASS |
| Browser registration and login | PASS |
| profile layout desktop | PASS |
| profile layout tablet | PASS |
| profile layout mobile | PASS |
| Delete-account modal cancels without deletion | PASS |
| catalog layout desktop | PASS |
| catalog layout tablet | PASS |
| catalog layout mobile | PASS |
| Browser book search | PASS |
| book-details layout desktop | PASS |
| book-details layout tablet | PASS |
| book-details layout mobile | PASS |
| Quantity controls and add to cart | PASS |
| cart layout desktop | PASS |
| cart layout tablet | PASS |
| cart layout mobile | PASS |
| Cart increase and decrease buttons | PASS |
| Create wishlist in browser | PASS |
| wishlist layout desktop | PASS |
| wishlist layout tablet | PASS |
| wishlist layout mobile | PASS |
| Wishlist priority and add selection | PASS |
| checkout layout desktop | PASS |
| checkout layout tablet | PASS |
| checkout layout mobile | PASS |
| Checkout billing toggle and browser submission | PASS |
| payment layout desktop | PASS |
| payment layout tablet | PASS |
| payment layout mobile | PASS |
| Payment selectors and card preview | PASS |
| Demo payment using browser form | PASS |
| confirmation layout desktop | PASS |
| confirmation layout tablet | PASS |
| confirmation layout mobile | PASS |
| orders layout desktop | PASS |
| orders layout tablet | PASS |
| orders layout mobile | PASS |
| order-details layout desktop | PASS |
| order-details layout tablet | PASS |
| order-details layout mobile | PASS |
| Browser review submission | PASS |
| reviews layout desktop | PASS |
| reviews layout tablet | PASS |
| reviews layout mobile | PASS |
| Browser logout | PASS |
| Admin browser login | PASS |
| admin-dashboard layout desktop | PASS |
| admin-dashboard layout tablet | PASS |
| admin-dashboard layout mobile | PASS |
| admin-books layout desktop | PASS |
| admin-books layout tablet | PASS |
| admin-books layout mobile | PASS |
| Admin DataTables search and clearing | PASS |
| Admin delete modal cancellation | PASS |
| admin-accounts layout desktop | PASS |
| admin-accounts layout tablet | PASS |
| admin-accounts layout mobile | PASS |
| admin-orders layout desktop | PASS |
| admin-orders layout tablet | PASS |
| admin-orders layout mobile | PASS |
| admin-order-details layout desktop | PASS |
| admin-order-details layout tablet | PASS |
| admin-order-details layout mobile | PASS |
| Browser zoom 200% | NOT TESTED |
| Full keyboard focus audit | NOT TESTED |
| Admin account mutation | NOT TESTED |
| Real payment provider | NOT TESTED |
| Browser edit own review | PASS |
| Browser delete own review | PASS |
| Browser edit own wishlist | PASS |
| Browser delete own wishlist through modal | PASS |
| Browser cancel own order through modal | PASS |
| Admin creates new test book with working cover preview | PASS |
| Admin edits test book and previews replacement cover | PASS |
| Admin deletes only newly created test book using modal | PASS |
| Admin order search placeholder visible | PASS |
| Final admin order layout 1440 | PASS |
| Final admin order layout 768 | PASS |
| Final admin order layout 375 | PASS |
| Unimplemented admin Users sidebar entry is non-clickable | PASS |
| Final live homepage 1440 | PASS |
| Final live homepage 768 | PASS |
| Final live homepage 375 | PASS |
| Final live CSS background images decode | PASS |
| Final live browser console | PASS |
| Final live browser network | PASS |
| Edge/Firefox and physical touch-device testing | NOT TESTED |
| Exact cart/tax/shipping arithmetic in browser | NOT TESTED |
| All registration and checkout browser validation branches | NOT TESTED |

### Remaining limits and reproduction

NOT TESTED rows are intentional. In particular, simulated payment passing does not establish a real payment integration. Exact arithmetic, complete keyboard/focus behavior, 200% zoom, every invalid form branch, admin-account mutation, other browsers, and physical touch devices remain unverified. The existing manual checklist remains useful for those gaps; its broad checkboxes were not automatically marked complete based on narrower assertions.

Evidence: .runtime/browser-results/results.json (main suite); extra-results.json (user additions and preserved driver timeout); admin-results.json (independent admin retest); navigation-results.json; live-results.json. The same directory contains the 51 main viewport screenshots, before/after admin order screenshots, cover-preview screenshot, and final live screenshots. Build/startup logs: .runtime/browser-build.log and .runtime/browser-live-server.log.

Automation helpers are in onlinebookstore/scripts/browser-cdp.mjs, browser-tests.mjs, browser-extra-tests.mjs, browser-admin-tests.mjs, browser-navigation-check.mjs, and browser-live-check.mjs. They require a separately launched Chrome with remote debugging on port 9222 and the copied-data server on port 8081. This debugging interface is for a dedicated test profile only. No debugging flag was added to BookVerse or Tomcat. restore-backgrounds.mjs records the one-time asset restoration; it is not needed to run the application.

## Authentication inspection and private development access

Inspected both live account files and source snapshots without displaying stored passwords. Each initially contained one admin and two customers. The documented admin exists, is active, and matches its README default; the documented customer `user1` does not exist. The default admin's Tomcat login was verified on copied data so the original live admin record stayed unchanged.

Original `Admin.authenticate` and `User.authenticate` used direct plaintext equality. The existing SHA-256 helper was unused and was not a secure password-storage facility. Added JDK-only PBKDF2-HMAC-SHA256 verification: 600,000 iterations, random 16-byte salt, 32-byte key, versioned storage prefix, constant-time comparison, bounded parser, and fail-closed handling for malformed encoded hashes. Legacy plaintext values remain supported without being rewritten or automatically migrated. This is not a claim that all legacy registration/reset flows now hash passwords.

Created separate `dev_admin` (ordinary ADMIN role) and `dev_customer` (regular customer) records. Original source files were not seeded with these accounts. Random passwords were never printed: their only recoverable local storage is a Windows-user-DPAPI-encrypted file under ignored `.runtime/local-auth/`. New commands offer masked prompts for choosing passwords for another new pair and copying the generated passwords to the clipboard without console output. Existing usernames cause provisioning to abort; it never resets them. The existing default-admin password logging statement was removed.

Verified results:

| Check | Result |
| --- | --- |
| New admin correct password and authenticated dashboard on live Tomcat 9 | PASS |
| New customer correct password and authenticated profile on live Tomcat 9 | PASS |
| Wrong passwords rejected for both new accounts | PASS |
| Documented admin login on copied-data Tomcat 9 | PASS |
| PBKDF2 random salts, valid/wrong/null passwords, malformed hashes, iteration bounds, model integration, legacy compatibility | PASS |
| Original admin/customer record lines unchanged; exactly one new record appended to each live account file | PASS |
| All source data and eight unrelated live data files unchanged | PASS |
| Generated development passwords absent from current Tomcat/server logs | PASS |
| Clean Maven build and redeployment on Tomcat 9.0.102 / JDK 17 | PASS |

Files changed: PasswordUtil.java, Admin.java, User.java, AdminManager.java (removed password output), root/project .gitignore files, and documentation. Added private provisioning/clipboard/verification helpers under `onlinebookstore/scripts/`; no dependencies or framework changes. Backups before source/data changes are recorded in `.runtime/auth-backup-path.txt`; the checkpoint is `.restoration-backups/auth-20261112-151419/`. Additional account-file backups were made before appending records. Existing backup folders were retained.

Detailed password handling and URLs are in LOCAL_AUTH_SETUP.md. Sanitized verification output is `.runtime/auth-login-results.json`; build/server logs are `.runtime/auth-build.log` and `.runtime/auth-live-server.log`. No commit, push, or GitHub update was performed. Existing plaintext records were preserved as required; this task did not perform a bulk password migration or an exhaustive authentication/security audit.
