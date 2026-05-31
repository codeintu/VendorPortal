# Implementation Plan: P-018-order-documents-gdrive-sync

Linked Ticket: T-018-order-documents-gdrive-sync

## Objective
Introduce an order document workflow where vendors can upload one document per document type for each order, preview or replace it before sync, push it to the U.S. Spice Google Drive, and then reflect per-document sync and review status from the FileMaker approval process.

## Proposed Approach
1. Define the document data flow
   - Define document categories/types per order, with exactly one document allowed per type per order.
   - Define the metadata needed per document: order number, document type, filename, upload timestamp, sync state, review state, and storage reference.
   - Keep the order identifier as the primary grouping key so all documents stay attached to one PO.
   - Seed the portal with a default document type list and let vendors add new document types when needed.
   - Keep the original filename unchanged and store PO number and document type as metadata only.
   - Use `DateEntered` from FileMaker to derive the PO year for Drive folder traversal.
2. Add the portal upload UI
   - Place the upload surface in the orders area, likely on the order details screen or within an order-specific document panel.
   - Show the default document type list and allow vendors to add a new document type.
   - Support selecting a document type first, then uploading a single file for that type.
   - Show local previews where possible, plus file names and current status.
   - Allow delete and reupload actions before the sync step so the one document per type can be replaced.
   - Keep the line items section in the middle of the page and the document section below it.
3. Add sync controls and API support
   - Create a sync action that sends the selected document set to the U.S. Spice GDrive.
   - Add API endpoints for upload handling, sync execution, document deletion, and status refresh.
   - Keep the sync action explicit so vendors control when documents are pushed.
   - Store Google Drive credentials in environment variables such as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
4. Integrate FileMaker status reflection
   - Fetch `DriveFolderId` from FileMaker at login and keep it for the session.
   - Resolve the folder path from the root folder using vendor name, `PO VR {Year}`, `PO {PO number}`, and `Docs`.
   - Read back approval/disapproval status from the FileMaker side.
   - Use `ImportDocName` to map each Drive file to the correct document type.
   - Treat `IsApproved = 1` as approved, and use portal-friendly labels such as `Synced`, `Approved`, and `Rejected`.
   - Refresh the portal view so vendors can see which document type is ready and which needs replacement.
5. Support the resubmission loop
   - If a document is rejected or not yet approved, allow it to be deleted and uploaded again before re-syncing.
   - If a document is approved from the U.S. Spice side, lock it so it cannot be deleted from the portal.
   - Reset sync/status metadata when a document is replaced so the new upload can go through the same workflow.
   - After sync, do not keep the file stored on the website; fetch the document from Google Drive when it needs to be viewed.
6. Verification
   - Run targeted lint checks on any touched order detail, API, and service files.
   - Validate the end-to-end sequence: type selection, upload, preview, delete/reupload, sync, FileMaker review status, and Drive-backed retrieval.

## Files Expected To Change
- `app/dashboard/orders/page.tsx`
- `app/dashboard/orders/[poNumber]/page.tsx`
- `app/api/orders/*` or new order-documents API routes
- `services/*` for Drive/FileMaker integration helpers
- Possibly shared UI components for file upload, status chips, or document tables
- Possibly `.env.example` and runtime config for Google Drive credentials and folder identifiers

## Risks / Notes
- Google Drive auth will likely use OAuth-based server integration with env-stored client ID, client secret, refresh token, and root folder ID.
- The FileMaker review state needs a clear mapping to portal statuses so vendors understand whether to delete and resubmit.
- Approved documents should be treated as locked records in the portal, while rejected and non-approved documents remain replaceable.
- We need a clear rule for whether a custom document type should become part of the order's saved type list after a vendor creates it.
- Since the filename remains unchanged, metadata must be the source of truth for PO number and document type lookups.
- Files without `ImportDocName` should be ignored for type mapping.
- `DateEntered` must be the source for PO year resolution so folder traversal is consistent.
- Large files, retries, and partial sync failures should be handled explicitly so uploaded documents do not get stuck in an ambiguous state.
- Since the website will not retain files after sync, the retrieval path from Google Drive needs to be reliable and fast enough for preview/view actions.
- We should avoid coupling document sync too tightly to the orders list so the existing orders browsing experience stays simple.

## Acceptance Criteria
- [ ] Vendors can upload one document per document type for one order.
- [ ] Vendors can add a new document type when the default list does not cover their file.
- [ ] Vendors can preview, delete, or reupload a document before sync.
- [ ] The portal includes the default document types:
  - `ISF Document`
  - `Packing List`
  - `Bill of Lading`
  - `Freight Invoice`
  - `Certificate of Origin`
  - `Certificate of Fumigation`
  - `Food Grade Certificate`
  - `Certificate of Weight`
  - `Phytosanitary`
  - `COA`
  - `ANNEX`
  - `Allergen Certificate`
  - `Analysis Report`
  - `GMO Certificate`
  - `Irradiation Certificate`
  - `Health Certificate`
  - `Certificate of Sterilization`
  - `Liability Insurance`
  - `Commercial Invoice`
  - `Certificate of Quality`
  - `Pre Shipment Advice`
  - `Shipment Advise`
  - `TT Instructions`
  - `Test Cert.`
  - `SEA Waybill`
  - `Invoice`
  - `Arrival Notice`
- [ ] Vendors can sync those documents to the U.S. Spice Google Drive.
- [ ] The portal shows per-document status such as `Synced`, `Approved`, and `Rejected`.
- [ ] Approved documents cannot be deleted from the portal.
- [ ] The portal resolves documents using `DriveFolderId`, `DateEntered`, `ImportDocName`, and `IsApproved`.
- [ ] The portal stores PO number and document type as metadata without renaming the original file.
- [ ] The portal does not retain synced files locally and retrieves them from Google Drive when needed.
- [ ] The existing orders experience remains stable.
- [ ] Touched files pass targeted lint verification.
