# Implementation Plan: P-026-send-invoice-email

Linked Ticket: T-026-send-invoice-email

## Objective
Make Send Invoice actually email US Spice Mills with the invoice document attached, using SMTP credentials from environment variables, with a concise polite template — replacing the current stub.

## "From" address — recommendation (confirm at approval)
SMTP/SPF/DMARC means the `From` must be the authenticated mailbox; the vendor's own address can't be the sender or mail will be rejected/spam-filed. Recommended scheme:
- `From`: `"<Vendor Company> via USSM Vendor Portal" <SMTP_FROM>` — display name carries the vendor, address is the authenticated mailbox.
- `Reply-To`: vendor's email (US Spice replies go to the vendor).
- `To`: `INVOICE_TO_EMAIL` (US Spice AP).
This is the deliverability-safe approach and still reads as "from the vendor" to the recipient.

## Email template (minimal, polite)
- **Subject:** `Invoice <invoiceNo> — PO <poNumber> — <Vendor Company>`
- **Body (text + simple HTML):**
  > Dear US Spice Mills Team,
  >
  > Please find attached invoice <invoiceNo> for purchase order <poNumber>.
  >
  > Please let us know if anything further is required.
  >
  > Best regards,
  > <Vendor Company>
- **Attachment:** the Invoice document file from Drive (original filename + mime type).

## Proposed Approach

### 1. Dependency + config
- Add `nodemailer` (+ `@types/nodemailer` dev) to `package.json`.
- Read all SMTP settings + addresses from env (no secrets in code): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `INVOICE_TO_EMAIL`.
- Document the variables in the execution log (and, if present, the env example file) without real values.

### 2. Email service (`services/emailService.ts`, new)
- Lazily create a singleton nodemailer transport from env; throw a clear error if SMTP config is missing.
- `sendInvoiceEmail({ to, from, replyTo, subject, html, text, attachment })` — sends and returns/throws on failure.
- Keep it generic (subject/body composed by the caller) so it can be reused later.

### 3. Invoice orchestration (`services/orderInvoiceService.ts`, new)
- `sendOrderInvoice(vendorId, poNumber, invoiceNo)`:
  1. Load the PO (vendor-scoped) and guard: exists, not closed, acknowledged (reuse existing helpers / status checks).
  2. Load order documents (`getOrderDocumentsForVendor`); find the `Invoice` document; error if missing (mirrors existing validation). [Confirm if ISF should also attach.]
  3. Download the invoice file from Drive via `getDriveFileMediaResponse(fileId)` → `arrayBuffer` → `Buffer`, with name/mime from `getDriveFileMetadata(fileId)`.
  4. Resolve vendor display name + email via `getVendorSummaryByVendorId` (companyName, primaryContactEmail).
  5. Compose subject/body from the template; call `sendInvoiceEmail`.
  6. On success, persist `VendorInvoiceNo` (via the existing `updateVendorInvoiceNo`) and return success.
- Note: persist after successful send so we never record/claim "sent" on a failed email.

### 4. Wire into the action route (`app/api/orders/actions/route.ts`)
- In the `send-invoice` case, keep the current fast validations (invoice no present, not closed, acknowledged, ISF + Invoice docs present), then call `sendOrderInvoice(...)` instead of the stub.
- Return `{ success: true, order, message: "Invoice sent" }` only when the email was sent; otherwise return the error (the UI already shows the field error / no success dialog).

### 5. Frontend
- No change required — the existing Send Invoice flow shows the "Invoice Sent" dialog on success and surfaces errors on failure. (Optional: tweak the success message wording.)

## Files Expected To Change
- `package.json` (add nodemailer + types) — dependency change (approval included in this ticket)
- `services/emailService.ts` (new — SMTP transport + send)
- `services/orderInvoiceService.ts` (new — orchestration: validate, fetch attachment, compose, send, persist)
- `app/api/orders/actions/route.ts` (replace stub with real send)
- `.env.example` if present (document new vars, no secrets)

## Risks / Notes
- **Deliverability:** From must be the authenticated mailbox; Reply-To carries the vendor. Using a foreign From would fail SPF/DMARC.
- **Secrets:** all SMTP values via env; nothing committed. Developer provides test credentials; production switch to US Spice is a later config-only change.
- **Attachment size/latency:** downloading from Drive + SMTP send adds latency to the click; the button already shows an in-flight state. Large PDFs could be slow but are acceptable for a manual action.
- **Failure semantics:** invoice number is persisted only after a successful send, so the UI never claims "sent" on failure.
- **Open confirmations:** (1) From/Reply-To scheme, (2) recipient address, (3) attach Invoice only vs. also ISF.

## Acceptance Criteria
- [ ] Send Invoice emails the configured recipient with the invoice document attached.
- [ ] Concise subject + short polite body referencing PO and invoice number.
- [ ] From/Reply-To/To per the confirmed scheme; Reply-To = vendor email.
- [ ] All SMTP config + addresses from env; no secrets committed.
- [ ] Send failure → vendor sees an error, no "sent" claim; success → invoice number persisted + confirmation shown.
- [ ] Touched files pass TypeScript compilation and lint verification.
