# Implementation Plan: P-020-order-document-upload-gdrive-sync

Linked Ticket: T-020-order-document-upload-gdrive-sync

## Objective
Add the portal upload flow for order documents so a vendor can pick a document type, upload a file, send it to the correct Google Drive `Docs` folder, and attach the matching Drive label choice metadata at upload time.

## Proposed Approach
1. Define the upload contract
   - Decide the request payload for the upload route.
   - Include vendor ID, PO number, document type, and the uploaded file.
   - Keep the original filename intact.
2. Add the upload UI entry point
   - Add a file picker action for the currently selected document type.
   - Disable the action for approved/locked documents.
   - Show upload progress and failure states clearly.
3. Add the backend upload route
   - Validate the vendor and PO before writing anything to Drive.
   - Resolve the vendor folder and PO document folder chain.
   - Accept multipart file data from the portal.
4. Upload the file to Drive
   - Upload into the PO `Docs` folder.
   - Preserve the original filename.
   - Store the document type and PO context as metadata.
5. Attach the Drive label choice
   - Use the configured `labelId`, `fieldId`, and choice ID mapping from `config/orderDocuments.ts`.
   - Apply the document-type label to the new file after upload.
6. Refresh the portal view
   - Re-query the order document list after a successful upload.
   - Put the uploaded file into the correct slot immediately.
7. Handle edge cases
   - Prevent replacement of locked documents.
   - Surface a useful error message for invalid files, Drive failures, and missing folder paths.

## Files Expected To Change
- `components/order-documents-panel.tsx`
- `app/api/orders/documents/*` or a new upload route
- `services/googleDriveService.ts`
- `services/orderDocumentsService.ts` or a new upload-specific service
- `config/orderDocuments.ts` if the upload flow needs the label mapping directly
- `config/googleDriveLabels.ts` if the upload flow needs env-driven label IDs

## Risks / Notes
- Google Drive upload and label attachment may need separate API calls, so error handling should be explicit.
- The replacement rule for an already-uploaded, non-approved document should be kept simple at first.
- Upload latency may be noticeable for larger PDFs, so the UI should stay responsive while the request is in flight.

## Acceptance Criteria
- [ ] A vendor can choose a document type and upload a file for that order.
- [ ] The file lands in the correct Drive folder with the original filename.
- [ ] The matching Drive label choice is applied after upload.
- [ ] The portal refreshes to show the uploaded file in the correct slot.
- [ ] Locked documents are protected from replacement.
- [ ] Touched files pass targeted lint verification.
