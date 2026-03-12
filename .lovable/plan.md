

## Fix Crelate Document Sync - Correct API Endpoints

### Problem
The `syncDocuments` function uses wrong API endpoints (`/api/pub/v1/contacts/{id}/attachments` and `/api3/contacts/{id}/attachments`), both returning 404. Zero documents are being downloaded.

### Solution
Update the edge function to use the correct Crelate v2 document API endpoints as provided:

1. **List attachments**: Change from GET to `POST https://app.crelate.com/api/v2/document/list/_Contacts/{contactId}` with body `{"Types": [0, 1, 2]}` and `X-Api-Key` header.

2. **Download files**: Change to `GET https://app.crelate.com/api/attachment/{attachmentId}/download?type=0` with `X-Api-Key` header.

3. **Response parsing**: Update to handle the correct response shape: `{ Total: number, Attachments: [...] }` with fields `Id`, `FileName`, `Type.Title`, `FileSize`, `ContentType`, `CreatedOn`.

### Changes
- **File**: `supabase/functions/crelate-sync/index.ts` (lines ~686-806)
  - Replace the attachment listing fetch (lines 688-712) with a POST to `/api/v2/document/list/_Contacts/{contactId}` sending `{"Types": [0, 1, 2]}`
  - Update response parsing (lines 724-734) to read `attachData.Attachments`
  - Replace the download URL (lines 753-758) with `https://app.crelate.com/api/attachment/{attId}/download?type=0`
  - Update field mappings: use `att.FileSize` for size, `att.ContentType` for type
  - Redeploy the edge function

### Technical Details
- The v2 document list endpoint is a POST, not GET
- `Types: [0, 1, 2]` fetches all document types (resumes, attachments, etc.)
- Download `type=0` returns the original file with correct Content-Length
- Estimated hundreds of documents across ~1000 contacts

