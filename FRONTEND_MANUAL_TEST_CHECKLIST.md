# BookVerse manual browser verification

Status: **Partially completed through actual headless Chrome browser automation.** See the Phase 3 per-test PASS/FAIL/NOT TESTED record in `PROJECT_RESTORATION_REPORT.md`. Broad checklist items below remain unchecked where only some subchecks were exercised; this does not invalidate the narrower recorded passes. Remaining manual checks include cross-browser/physical-device behavior, full keyboard/focus and 200% zoom, exact arithmetic, and exhaustive validation branches.

Use the copied dataset on port 8081 for actions that create or change records. From the workspace root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\run.ps1 -TestMode -SkipBuild
```

Wait for `Server startup`, then open http://localhost:8081/onlinebookstore/. Use a newly registered test user and test books/wishlists/reviews/orders you create. Do not delete original records, even in the copied dataset. Live BookVerse remains at port 8080.

For each item, record browser/version, viewport, result, and any console/network error. Check items only after observing the expected behavior.

## Layout and resources

- [ ] At 1440×900, 768×1024, and 375×812, inspect homepage, catalog, details, profile, cart, wishlists, checkout, reviews, orders, and admin pages. Confirm existing colors, navigation, cards, buttons, and text remain readable.
- [ ] At mobile width, open and close the navbar; use dropdowns and confirm no page-wide horizontal scrolling. Wide tables should scroll within their wrappers.
- [ ] Open DevTools Console and Network, enable Preserve log, and navigate through the workflow. Record JavaScript exceptions, 404s, failed fonts, images, or blocked CDN requests.
- [ ] Confirm all book covers and the missing-cover fallback display. Confirm the bank-transfer icon displays without a broken image.
- [ ] Check browser zoom at 200%, keyboard tab order, focus visibility, modal close/Escape behavior, and return of focus to the triggering button.

## Navigation and account forms

- [ ] Follow Home, Books, Top Books, Cart, profile, Wishlist, My Reviews, order history, and admin order links. Confirm URLs remain under `/onlinebookstore/` and show the intended screen.
- [ ] Click Contact Us and confirm the page scrolls to the existing Contact Information footer.
- [ ] Confirm unavailable admin Users/Profile/System Settings and password recovery entries are non-clickable and announce that they are unavailable. These screens are not implemented.
- [ ] Register with blank fields, invalid email, weak/short password, unsupported password special character, mismatched confirmation, and unchecked terms. Confirm the form blocks or displays a clear error without creating a user.
- [ ] Register a valid test account, log in, toggle password visibility, and test a wrong password. Confirm error messages remain readable and the password field conceals text again.
- [ ] Edit the test profile. Enter matching new passwords, then change the first password: confirmation must become invalid again. Correct it and confirm the custom validation error clears.
- [ ] Log out and use Back/Refresh. Protected pages must require login; no authenticated action should remain possible through a cached page.

## Books, cart, and wishlist

- [ ] Search by title/author, combine search with genre/type/price, clear filters, sort, and paginate. A nonexistent title plus a valid genre must show no matching books.
- [ ] On book details, use +/- quantity controls and type a value. Confirm minimum one and stock limits. Add a test book to cart, increase/decrease/remove it, and compare displayed item totals and grand total with a calculator.
- [ ] Create/edit a test wishlist; select the wishlist radio card and each priority dot. Confirm selected styling, label, saved notes, and priority agree after refresh.
- [ ] Open wishlist deletion and account deletion modals, then cancel. Ensure cancellation changes no records. Only confirm wishlist deletion for a wishlist you created for this test.

## Checkout, payment, reviews, orders

- [ ] Try checkout with an empty cart, then with a test book. Toggle the same-address checkbox both ways and verify hidden billing fields do not block native form validation.
- [ ] Submit missing shipping/contact fields and invalid email; record both browser validation and server response. Complete a valid test checkout.
- [ ] Select credit card, debit card, PayPal, and bank transfer. Verify selection styling and the correct form section. Confirm card preview/expiry formatting, required fields, and invalid-card messages. This application simulates payment; do not enter real card details.
- [ ] Complete demo payment. Check confirmation, order history, and details; verify line items, shipping/tax/total, status, and refresh/back navigation.
- [ ] Open cancellation confirmation, cancel the modal, then cancel only your test order. Confirm the status and inventory behavior after refreshing.
- [ ] Add/edit a test review, verify stars and My Reviews, then open deletion confirmation and cancel. If deleting, delete only your own test review. Check empty comment and invalid-rating feedback.

## Admin controls

- [ ] Log in using an existing test-copy admin account. Confirm invalid credentials show an error.
- [ ] Check book/admin DataTables search, sorting, pagination, length selector, and mobile table scrolling. Confirm book type, Featured, and Out of Stock filters match the rows.
- [ ] Add a new test book, preview its cover, switch physical/e-book fields, and verify invalid ISBN/oversized image feedback. Edit and, if desired, delete only that newly created book; cancel the delete modal once before confirming.
- [ ] Open administrator add/edit/reset/deactivate modals. Verify field population and mismatched-password feedback. Cancel without changing existing accounts.
- [ ] Update only a test order. Verify status modal, tracking-number requirement when shipped, notes, alerts, and the order-list Back/Refresh behavior.

Stop the test server with Ctrl+C. Keep original and live data intact. Record unresolved results in the restoration report; unchecked items remain unverified.
