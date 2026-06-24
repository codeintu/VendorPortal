# Ticket: T-026-send-invoice-email

Status: IN PROGRESS
Created: 2026-06-24
Author: AI Agent

## Problem Statement
The "Send Invoice" action in Vendor Actions (T-024/T-025) currently only validates inputs (invoice number, acknowledgement, ISF + Invoice documents present), persists the invoice number, and shows a stubbed "Invoice sent" dialog. It does not actually email anything.

The vendor needs Send Invoice to **really send an email to US Spice Mills** with the invoice document attached, so US Spice's AP team receives the invoice for that order.

## Goal
When a vendor clicks Send Invoice (after passing the existing validations), the portal sends an email to US Spice Mills with:
- The **invoice document** (pulled from the order's Google Drive documents) as an attachment.
- A short, polite body referencing the order (PO number) and the invoice number.
- A clear, concise subject.

SMTP credentials will be provided by the developer (initially the developer's account for testing, later switched to US Spice's account) via environment variables — no credentials in code.

## Key Decisions To Confirm
1. **"From" address (deliverability):** SMTP servers reject a `From` that isn't the authenticated account (SPF/DMARC), so the vendor's own address cannot be the `From`. Proposed approach:
   - `From`: the authenticated SMTP mailbox (env), with a display name like `"<Vendor Company> via USSM Vendor Portal"`.
   - `Reply-To`: the vendor's email (so US Spice can reply directly to the vendor).
   - `To`: US Spice AP recipient address (env).
   - Body identifies the vendor, PO, and invoice number.
   Confirm this is acceptable, or specify a preferred scheme.
2. **Recipient:** the US Spice AP email address (provided via env). Need the address to test.
3. **Attachment scope:** attach the **Invoice** document only (the one already validated). Confirm — or also include the ISF document?

## Scope
1. Add an email-sending capability (SMTP via nodemailer) configured entirely from environment variables.
2. On Send Invoice, after the existing validations pass:
   - Resolve vendor display name + email (for display name / Reply-To / body).
   - Download the Invoice document file from Google Drive (bytes + filename + mime type).
   - Compose a short, polite email (subject + body) and attach the invoice file.
   - Send it to the configured US Spice recipient.
   - Persist the invoice number and return success only when the email actually sent.
3. Provide a clean, professional subject + body template (minimal content).
4. Surface real send failures to the vendor (do not show "sent" if it failed).

## Out of Scope
- Switching to US Spice's production SMTP credentials (a config change for later; this ticket builds it against the provided test credentials).
- Generating/transforming the invoice document (we attach the file already uploaded to Drive).
- Email delivery tracking, retries/queueing, or CC lists beyond the single recipient + Reply-To.
- Changes to the validation rules already in place (invoice no, acknowledgement, ISF + Invoice present, not closed).

## Dependencies / Configuration (requires approval as part of this ticket)
- New dependency: `nodemailer` (+ `@types/nodemailer` dev). (Per repo rules, dependency changes need approval — included here.)
- New environment variables (no secrets in code), e.g.:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
  - `SMTP_FROM` (authenticated From address / display)
  - `INVOICE_TO_EMAIL` (US Spice AP recipient)

## Acceptance Criteria
- [ ] Clicking Send Invoice (after validations) sends an email to the configured recipient with the invoice document attached.
- [ ] The email has a concise subject and a short, polite body referencing the PO number and invoice number.
- [ ] `From`/`Reply-To`/`To` follow the confirmed scheme; the vendor's email is the Reply-To.
- [ ] SMTP settings and addresses come from environment variables; no credentials are committed.
- [ ] If sending fails, the vendor sees an error (not a success dialog), and the UI does not claim the invoice was sent.
- [ ] On success, the invoice number is persisted and the existing "Invoice Sent" confirmation is shown.
- [ ] Touched files pass TypeScript compilation and lint verification.
