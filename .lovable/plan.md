

## Fix Document Preview Loading

### Problem
The document preview dialog in `ContactResumes.tsx` fails to render PDFs. The current approach downloads the file as a blob, creates an `ObjectURL`, and sets it as the iframe `src`. This is unreliable — browsers often block or fail to render blob URLs in iframes for PDFs, resulting in the broken document icon shown in the screenshot.

### Solution
Use **signed URLs** for all file previews instead of blob URLs:

- **PDFs**: Get a signed URL from Supabase Storage and use it directly as the iframe `src` (with `#toolbar=1` for the browser's built-in PDF viewer)
- **Images**: Get a signed URL and display in an `<img>` tag
- **DOCX/DOC**: Continue using signed URL + Google Docs Viewer (already working)

This eliminates the blob download step entirely for previews, making them faster and more reliable.

### Changes

**File: `src/components/ContactResumes.tsx`**

1. Rewrite `openPreview` to always use `createSignedUrl` instead of downloading blobs:
   - For PDFs: set `previewUrl` to the signed URL directly
   - For images: set `previewUrl` to the signed URL directly  
   - For DOCX/DOC: wrap signed URL in Google Docs Viewer (unchanged)
2. Remove the `closePreview` blob revocation logic (no more blob URLs)
3. Move `canPreviewInline` before `openPreview` to fix the hoisting issue (currently defined after it's called)
4. Add a helper `isImage` to distinguish PDF vs image rendering in the preview body

**File: `src/components/talent-pool/PoolApplicationDetailDialog.tsx`**

The `viewFile` function uses `getPublicUrl` on a **private** bucket, which won't work. Change to `createSignedUrl` and open the signed URL in a new tab.

No other preview dialogs need changes — `GrantDocuments` and `ContactDocuments` only have download (no inline preview), and email template previews render HTML content directly.

