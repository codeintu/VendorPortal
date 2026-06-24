# Test Scenarios: TEST-026-send-invoice-email

Status: OPEN
Ticket: T-026-send-invoice-email

## Objective
Verify Send Invoice actually emails the configured recipient with the Invoice document attached, using a deliverability-safe From/Reply-To, and that failures and success are handled correctly.

## Proposed Strategy
Static typecheck + lint (automated), SMTP auth verification (done), then a manual end-to-end send through the app against a real PO that has an Invoice document uploaded to Drive.

## Scenarios

- [ ] **SMTP Auth**
  - Verify credentials authenticate.
  - Expected: transporter verify succeeds. (DONE — "SMTP AUTH OK".)

- [ ] **Successful Send (end-to-end)**
  - On an acknowledged, open PO with an Invoice document uploaded, enter the invoice number and click Send Invoice.
  - Expected: An email arrives at the configured recipient (debasis.pradhan@mindfiresolutions.com) with the Invoice document attached; subject `Invoice <no> — PO <poNumber> — <Vendor>`; short polite body; Reply-To = vendor email. The "Invoice Sent" dialog shows and the invoice number persists.

- [ ] **Attachment Is Invoice Only**
  - Inspect the received email.
  - Expected: Exactly the Invoice document is attached (no ISF).

- [ ] **Missing Invoice Document**
  - Try sending when no Invoice document is uploaded.
  - Expected: Blocked with an error; no email sent; no success dialog.

- [ ] **Not Acknowledged / Closed**
  - Try sending on an unacknowledged or closed PO (incl. direct API).
  - Expected: Rejected with the appropriate message; no email sent.

- [ ] **Send Failure Handling**
  - Simulate an SMTP failure (e.g. bad config).
  - Expected: Vendor sees an error; no "Invoice Sent" dialog; invoice number not falsely recorded as sent.

- [ ] **No Secrets Committed**
  - Expected: SMTP credentials live only in the gitignored `.env`; `.env.example` has names only.

- [ ] **Clean TypeScript Compilation**
  - `npx tsc --noEmit` → exit 0.

- [ ] **Clean Lint Verification**
  - `npx eslint` on touched files → exit 0.
