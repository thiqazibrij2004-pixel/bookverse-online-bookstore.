import fs from'node:fs';import path from'node:path';
const root=path.resolve(import.meta.dirname,'../..'),dir=path.join(root,'.runtime/browser-results');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const main=read('results'),extra=read('extra-results'),admin=read('admin-results'),live=read('live-results'),navigation=read('navigation-results');
const checks=[...main.results,...extra.results.filter(r=>r.name!=='Extra workflow continuation'),...admin.results,...navigation.results,...live.results,
 {name:'Edge/Firefox and physical touch-device testing',status:'NOT TESTED'},
 {name:'Exact cart/tax/shipping arithmetic in browser',status:'NOT TESTED'},
 {name:'All registration and checkout browser validation branches',status:'NOT TESTED'}];
const counts=checks.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{});const war=fs.statSync(path.join(root,'onlinebookstore/target/onlinebookstore.war')).size;
const table=checks.map(r=>`| ${r.name.replaceAll('|','/')} | ${r.status} |`).join('\n');
const section=`

## Phase 3: actual Chrome browser verification - 12 November 2026

This section supersedes the earlier absence of browser testing. Chrome **157.0.8103.39** was available locally and was controlled in headless mode through its built-in DevTools Protocol, using Node's built-in WebSocket. No Playwright, Puppeteer, application framework, or other dependency was installed.

### Results and scope

Final recorded scenario totals: **${counts.PASS} PASS**, **${counts.FAIL??0} outstanding application FAIL**, **${counts['NOT TESTED']} NOT TESTED**. Each scenario is recorded in the table below and in the JSON evidence. These are specific assertions, not a claim that every interaction or visual detail has been tested.

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
- Final clean Maven build: **PASS**, BUILD SUCCESS; WAR size **${war.toLocaleString('en-US')} bytes**. Rebuilt WAR deployed to Tomcat **9.0.102 / JDK 17**, startup **1,664 ms**, with no SEVERE startup entries in browser-live-server.log.
- Pre-change checkpoint: **.restoration-backups/browser-20261112-122202/** (source, reports and SHA-256 hashes). All **20 source/live data files** matched their Phase 3 hashes after final deployment and browser checks. Earlier backup folders were retained.
- Live BookVerse remains running on port 8080. The copied-data test server and dedicated headless browser were stopped after recording results.

### Per-test record

| Browser scenario | Final status |
| --- | --- |
${table}

### Remaining limits and reproduction

NOT TESTED rows are intentional. In particular, simulated payment passing does not establish a real payment integration. Exact arithmetic, complete keyboard/focus behavior, 200% zoom, every invalid form branch, admin-account mutation, other browsers, and physical touch devices remain unverified. The existing manual checklist remains useful for those gaps; its broad checkboxes were not automatically marked complete based on narrower assertions.

Evidence: .runtime/browser-results/results.json (main suite); extra-results.json (user additions and preserved driver timeout); admin-results.json (independent admin retest); navigation-results.json; live-results.json. The same directory contains the 51 main viewport screenshots, before/after admin order screenshots, cover-preview screenshot, and final live screenshots. Build/startup logs: .runtime/browser-build.log and .runtime/browser-live-server.log.

Automation helpers are in onlinebookstore/scripts/browser-cdp.mjs, browser-tests.mjs, browser-extra-tests.mjs, browser-admin-tests.mjs, browser-navigation-check.mjs, and browser-live-check.mjs. They require a separately launched Chrome with remote debugging on port 9222 and the copied-data server on port 8081. This debugging interface is for a dedicated test profile only. No debugging flag was added to BookVerse or Tomcat. restore-backgrounds.mjs records the one-time asset restoration; it is not needed to run the application.
`;
const report=path.join(root,'PROJECT_RESTORATION_REPORT.md');let text=fs.readFileSync(report,'utf8');if(text.includes('## Phase 3: actual Chrome'))throw Error('Phase 3 already recorded');text=text.replace(/\([\d,]+ bytes\)/,`(${war.toLocaleString('en-US')} bytes)`);fs.writeFileSync(report,text+section);
const checklist=path.join(root,'FRONTEND_MANUAL_TEST_CHECKLIST.md');let manual=fs.readFileSync(checklist,'utf8');manual=manual.replace('Status: **Not yet executed in a browser.** HTTP tests and Node function tests are recorded separately in `PROJECT_RESTORATION_REPORT.md`.','Status: **Partially completed through actual headless Chrome browser automation.** See the Phase 3 per-test PASS/FAIL/NOT TESTED record in `PROJECT_RESTORATION_REPORT.md`. Broad checklist items below remain unchecked where only some subchecks were exercised; this does not invalidate the narrower recorded passes. Remaining manual checks include cross-browser/physical-device behavior, full keyboard/focus and 200% zoom, exact arithmetic, and exhaustive validation branches.');fs.writeFileSync(checklist,manual);
fs.writeFileSync(path.join(dir,'final-statuses.json'),JSON.stringify({counts,checks},null,2));console.log(JSON.stringify(counts));
