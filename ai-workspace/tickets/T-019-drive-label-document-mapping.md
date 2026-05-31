# Ticket: T-019-drive-label-document-mapping

Status: CLOSED
Created: 2026-05-30
Author: AI Agent

## Problem Statement
The portal currently maps Google Drive files to portal document types using the legacy `ImportDocName` file property. That process is no longer valid. Document types are now assigned through Google Drive Labels, where a Drive label is applied to each file and the selected label value identifies the document type. Because the portal still depends on `ImportDocName`, files using the current label-based process won't resolve to the correct document slots in the portal.

## Goal
Update the order document resolution flow so the portal reads document type information from Google Drive Labels, maps each Drive file to the correct portal document type, and uses a stable source of truth for label metadata on our side.

## Scope
1. Add support for reading applied Google Drive Labels from each Drive file used in the order documents flow.
2. Fetch the Google Drive label catalog once and store the relevant document-type label mapping on our side.
3. Replace the current mapping logic based on `ImportDocName` with Drive Label based mapping.
4. Define how label metadata is maintained on our side so rare admin changes can be handled without code confusion.
5. Preserve the existing order folder traversal logic using `DriveFolderId`, `DateEntered`, `PO VR {Year}`, `PO {PONumber}`, and `Docs`.
6. Preserve the current document preview behavior and approval lock behavior unless approval metadata also changes.
7. Prepare the service layer for a later upload/sync implementation that will attach the correct Drive label after upload.
8. Add enough debug visibility to validate how real Drive files are being mapped while this change is being verified.

## Requirements
- We need the Google Drive document classification `labelId`.
- We need the `fieldId` inside that label that stores the document type value.
- We need to confirm the Drive label field type, such as `selection`, `text`, or `selection list`.
- If the field is a selection field, we need the exact choice identifiers for every supported document type.
- We need a definitive mapping between Drive label choice IDs and the portal's document type names.
- We need confirmation on whether each file will have exactly one document-type value.
- We need confirmation on whether `IsApproved` remains in Drive file properties or is also moving to labels.
- For the later upload flow, we will need the same `labelId`, `fieldId`, and option mapping so the portal can attach the correct label metadata after upload.
- We need to choose how the label schema is maintained on our side:
  - hard-coded config checked into the repo
  - generated config fetched from Drive and then stored in the repo
  - runtime schema fetch with caching
- If we do not want to fetch schema metadata on every request, we need a manual or admin-triggered refresh path when Drive label definitions change.

## Proposed Approach
1. Add Drive label read helpers in the Google Drive service.
   - Use the Drive API label listing capability to retrieve labels applied to a file.
   - Normalize returned label data into a portal-friendly shape.
2. Add a one-time label catalog fetch flow.
   - Read the available Drive labels and extract the document-type label metadata.
   - Capture the `labelId`, `fieldId`, and the available choice IDs for the `DocumentType` field.
3. Add document label configuration.
   - Create a config module for the stored document-type label mapping.
   - Store the `labelId`, `fieldId`, and document-type choice mapping there.
   - Treat that stored mapping as the portal-side source of truth for runtime resolution.
4. Update document type resolution in the order documents service.
   - Fetch documents every time as we do now.
   - For each file, read the applied label details and match the file against the stored mapping using `labelId`, `fieldId`, and the selected choice ID.
   - Stop using `ImportDocName` for the new process.
5. Preserve current downstream behavior.
   - Keep existing status mapping, locking, preview URLs, and order slot creation intact while only changing how document type is derived.
6. Define label metadata maintenance strategy.
   - Fetch document files every time.
   - Do not fetch the label catalog on every request.
   - Store the label catalog mapping in `config/orderDocuments.ts` and update it manually when admins intentionally change the label setup.
   - Keep `GOOGLE_DRIVE_LABEL_ID` and `GOOGLE_DRIVE_LABEL_FIELD_ID` in environment config.
7. Prepare for upload-time label assignment.
   - Keep the config and helper shapes aligned with a future `modifyLabels` call so upload/sync work can reuse the same mapping.
8. Validate against real Drive data.
   - Confirm that files already labeled in Drive appear under the expected document types in the portal.

## Recommended Design Decision
- Fetch applied file labels every time document data is loaded.
  - This is the live per-file metadata and is what tells us which document type a file currently belongs to.
- Fetch the label catalog once, then store it on our side.
  - The label definition changes rarely and should not add extra runtime cost to every order documents request.
- Store the label schema mapping on our side.
  - Keep `labelId` and `fieldId` in environment config.
  - Keep the document type choice ID mapping in `config/orderDocuments.ts` beside the default document type list.
  - Admin-side label definition changes can be handled by manually updating the config mapping.
- This gives us stable runtime behavior and keeps document loading simple.

## Out of Scope
- Building the upload-to-Drive flow in this ticket
- Attaching labels to files during upload in this ticket
- Replacing the FileMaker approval workflow
- Redesigning the order documents UI
- Changing folder naming or traversal rules in Google Drive

## Acceptance Criteria
- [ ] Files that use the new Google Drive Label process resolve to the correct portal document type.
- [ ] The portal reads document type metadata from Drive Labels using stored label metadata from our side.
- [ ] The portal fetches document files every time but does not re-fetch the label catalog on every request.
- [ ] The portal does not rely on runtime label schema fetching for document type mapping.
- [ ] The existing order folder traversal continues to work as-is.
- [ ] Existing preview behavior continues to work for resolved files.
- [ ] Approved document locking continues to work if approval metadata remains unchanged.
- [ ] The implementation no longer depends on `ImportDocName` for the new process.
- [ ] The label schema maintenance approach is documented and practical for rare admin-side changes.
- [ ] The implementation is structured so future upload work can attach the same label metadata to newly uploaded files.
- [ ] Touched files pass targeted lint verification.

## Notes
- This ticket is a prerequisite for the next phase of the order document upload/sync work because document type resolution must match the metadata model now used in Drive.
- For Drive selection fields, the API model uses choice IDs as the source of truth. The display names like `Packing List` and `Bill of Lading` are human-readable labels, but runtime matching should use their underlying choice IDs.
- Since this process never went live, we can change the implementation directly instead of carrying rollout compatibility logic.
- Based on the current understanding, runtime mapping needs more than just the label container itself. We should store at least the `labelId`, the `fieldId`, and the field choice mapping so the selected document type can be resolved correctly for each file.
