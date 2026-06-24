# Execution Log: L-026-send-invoice-email

Status: COMPLETE
Ticket: T-026-send-invoice-email
Date: 2026-06-24

## Summary
Replaced the stubbed Send Invoice with a real email: on Send Invoice (after the existing validations), the portal downloads the order's Invoice document from Google Drive and emails it to the configured US Spice recipient via SMTP, then persists the vendor invoice number. Only the Invoice document is attached (not the ISF), per developer instruction.

## Steps Performed
1. Added `nodemailer` (+ `@types/nodemailer`) dependency.
2. Stored SMTP credentials in the gitignored `.env` (Gmail test account); documented variable names in `.env.example` (no secrets).
3. Built an SMTP email service and an invoice-send orchestration service.
4. Wired the action route's `send-invoice` case to the real send.
5. Verified SMTP authentication succeeds (connection check, no email sent).

## Files Modified
- `package.json` — added `nodemailer` and `@types/nodemailer`.
- `.env` (gitignored) — added `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_TO_EMAILS` (test recipient: debasis.pradhan@mindfiresolutions.com), `SMTP_CC_EMAILS`.
- `.env.example` — documented the SMTP variable names (no values).
- `services/emailService.ts` (new) — lazy nodemailer transport from env; `sendEmail()`; `getInvoiceRecipients()`. Port 465 ⇒ implicit TLS, else STARTTLS.
- `services/orderInvoiceService.ts` (new) — `sendOrderInvoice(vendorId, poNumber, invoiceNo)`: validates (exists, not closed, acknowledged, Invoice doc present), downloads the Invoice file from Drive (`getDriveFileMediaResponse` + `getDriveFileMetadata`), resolves vendor name/email, composes the email, sends it, then persists the invoice number.
- `app/api/orders/actions/route.ts` — `send-invoice` now calls `sendOrderInvoice(...)` instead of the stub; returns the refreshed order + "Invoice sent" only on success.

## Email Design
- **From:** `"<Vendor Company> via USSM Vendor Portal" <SMTP_FROM_EMAIL>` (authenticated mailbox; deliverability-safe).
- **Reply-To:** vendor's email (from the vendor summary) so US Spice replies reach the vendor.
- **To/Cc:** `SMTP_TO_EMAILS` / `SMTP_CC_EMAILS` (comma-separated env).
- **Subject:** `Invoice <invoiceNo> — PO <poNumber> — <Vendor Company>`.
- **Body:** short, polite text + simple HTML referencing the PO and invoice number.
- **Attachment:** the Invoice document only.

## Notes / Decisions
- Invoice number is persisted **after** a successful send, so a failed send never reports/records success.
- The route keeps the existing precondition that both ISF and Invoice documents are uploaded; only the Invoice is attached/sent.
- All secrets live in the gitignored `.env`; nothing committed. Production switch to US Spice's SMTP is a later config-only change.
- No circular imports: `orderInvoiceService` depends on filemaker/documents/drive/email services; none depend back on it.

## Verification
- `npx tsc --noEmit` → exit 0.
- `npx eslint` on touched files → exit 0.
- SMTP auth verified via `transporter.verify()` → "SMTP AUTH OK" (no email sent).
- End-to-end send (real PO + Invoice doc in Drive) pending developer test approval (Step 10).
