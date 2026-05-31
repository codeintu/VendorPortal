# Ticket: T-020-order-document-upload-gdrive-sync

Status: OPEN
Created: 2026-05-30
Author: AI Agent

## Problem Statement
The portal can now read order documents from Google Drive and map them to the correct portal document types using Drive Labels. What is still missing is the vendor upload flow: vendors need to choose a document type, upload a file from the portal, push that file into the correct order `Docs` folder in Google Drive, and attach the correct Drive label choice so the portal and Google Drive stay in sync.

## Goal
Build the upload flow for order documents so a vendor can upload a file for a specific document type and purchase order, store it in the correct Drive folder, and apply the correct Drive label choice metadata at upload time.

## Scope
1. Add a portal upload action for the selected document type in the order documents panel.
2. Upload the chosen file to the correct Google Drive `Docs` folder for the current PO.
3. Preserve the original filename when uploading to Drive.
4. Attach the document type metadata to the uploaded file using the configured Drive label, field ID, and choice ID mapping.
5. Store PO-specific metadata needed for later lookup and preview.
6. Refresh the order documents view after upload so the new file appears in the correct slot.
7. Keep the upload flow aligned with the existing one-document-per-type rule.
8. Add clear error handling for failed uploads, Drive metadata errors, and invalid file selections.

## Requirements
- We need an upload UI control in the order documents panel for the currently selected document type.
- We need a backend endpoint that accepts a file upload for a specific vendor, PO number, and document type.
- We need the upload flow to locate the correct Drive folder chain:
  - vendor folder
  - `PO VR {Year}`
  - `PO {PO Number}`
  - `Docs`
- We need to use the existing Drive label config from `config/orderDocuments.ts` for the document type choice mapping.
- We need to know how the Drive file should be labeled at upload time using:
  - `GOOGLE_DRIVE_LABEL_ID`
  - `GOOGLE_DRIVE_LABEL_FIELD_ID`
  - the correct choice ID for the selected document type
- We need to preserve the original filename in Drive.
- We need to confirm whether the uploaded file should be immediately visible in the portal as `Uploaded` or `Synced` before FileMaker approval.
- We need a clear replacement rule for when a document type already has a file and the vendor uploads a new one.

## Proposed Approach
1. Add upload UI behavior.
   - Add a file picker action for the selected document type.
   - Disable upload when the slot is locked by approval.
2. Add an upload API route.
   - Accept multipart form data with the file and the PO/document type context.
   - Validate vendor ownership and PO lookup before uploading.
3. Upload to Google Drive.
   - Resolve the vendor/PO/Docs folder chain.
   - Upload the file using the original filename.
4. Attach the Drive label.
   - Apply the configured label choice for the selected document type after upload.
   - Keep the file type mapping driven by the existing local config.
5. Refresh the portal state.
   - Re-fetch the order documents list after upload completes.
   - Show the new file in the correct document slot.
6. Keep the flow replaceable.
   - If a document type already has an unlocked file, allow the new upload to replace it in the portal flow.

## Out of Scope
- Changing FileMaker approval rules
- Redesigning the order documents reader UI
- Adding bulk upload
- Changing how approved documents are locked
- Building a manual label management admin screen

## Acceptance Criteria
- [ ] Vendors can upload a file for the selected order document type.
- [ ] Uploaded files go to the correct Google Drive `Docs` folder.
- [ ] Uploaded files keep their original filename.
- [ ] The correct Drive label choice is attached at upload time.
- [ ] The portal refreshes and shows the uploaded file in the correct slot.
- [ ] Locked approved files cannot be replaced by the upload flow.
- [ ] Touched files pass targeted lint verification.

## Notes
- This ticket assumes the label choice IDs are already stored in `config/orderDocuments.ts`.
- If needed, replacement and delete behavior for non-approved files can be refined in a follow-up ticket after the core upload path is in place.
