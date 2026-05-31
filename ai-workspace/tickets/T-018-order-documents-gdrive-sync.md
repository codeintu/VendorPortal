# Ticket: T-018-order-documents-gdrive-sync

Status: OPEN
Created: 2026-04-01
Author: AI Agent

## Problem Statement
Vendors need a way to upload documents related to an order, sync those documents to the U.S. Spice Google Drive, and then reflect document review status back into the portal. After the documents reach Google Drive, FileMaker can fetch and review them for approval or disapproval, but the portal does not yet have a supported upload/sync/status flow.

## Goal
Add an order document management flow where vendors can upload one document per document type from the portal, sync them to the U.S. Spice Google Drive, and view document status updates that come back from the FileMaker review workflow.

## Scope
1. Add an order-level document upload area in the orders experience.
2. Allow vendors to upload one document per document type for a purchase order.
3. Seed the portal with a default document-type catalog and allow vendors to add a new document type when needed.
4. Add a sync action that pushes uploaded documents to the U.S. Spice Google Drive.
5. Use `DateEntered` to determine the PO year during Drive folder traversal.
6. Fetch `DriveFolderId` from FileMaker at login and keep it for the session.
7. Surface document status in the portal from the FileMaker-side approval workflow.
8. Map each Drive file back to its document type using `ImportDocName`.
9. Treat `IsApproved = 1` as approved and lock approved documents so they cannot be deleted from the portal.
10. Support the resubmission loop where unapproved documents can be removed and uploaded again before re-syncing.
11. Keep the original filename unchanged and store PO number and document type as metadata.

## Out of Scope
- Replacing the FileMaker review workflow
- Changing the approve/disapprove rules inside FileMaker
- General file management outside the order context
- Public file sharing or anonymous file access
- Non-order documents unrelated to portal purchase orders

## Acceptance Criteria
- [ ] Vendors can upload one document per document type for a specific order.
- [ ] Vendors can add a new document type when a default option does not exist.
- [ ] Vendors can trigger a sync to the U.S. Spice Google Drive from the portal.
- [ ] The portal shows document review status coming back from FileMaker.
- [ ] Approved documents cannot be deleted from the portal.
- [ ] Unapproved and non-approved documents can be removed and uploaded again for a re-sync.
- [ ] The portal resolves documents using `DriveFolderId`, `DateEntered`, `ImportDocName`, and `IsApproved`.
- [ ] The portal stores PO number and document type as metadata without renaming the original file.
- [ ] The order document flow works without breaking the existing orders list/details UX.
- [ ] Touched files pass targeted lint verification.
