# Private resume verification

This check is available only in the development preview at `/dev/resume-verification`; it is not registered in production. It uses normal staff authentication, RLS, private storage, the deployed `parse-resume` function, and the same Documents/review controls as contact pages. No test credentials, fake session, or privileged access are provided.

## Manual live-service check
1. Sign in normally at `/login`, then open `/dev/resume-verification` in the preview.
2. Choose **Create sample contact** and **Download sample resume**. This deliberately creates one fictional, user-owned contact in the connected CRM; it never edits an existing real contact.
3. Check **Parse resume after upload**, then upload the downloaded sample.
4. Confirm extracted job title and summary appear. Cancel; confirm the saved contact remains unchanged.
5. Choose **Parse** on the now-saved file, without uploading again.
6. Edit Job title to **Verified Scrum Master**. Select Job title and Summary; leave First name and Last name unchecked. Save.
7. Confirm **Saved details verified**, then reload and confirm it again. This checks persistence through a fresh database read, not only local display state.
8. Choose **Remove sample data**. If any step fails, the marked sample is recovered on reload so cleanup can be retried. Remove it before leaving; there is no background cleanup job.

## Automated live-service check
`python3 scripts/verify-resume.py --storage-state /tmp/browser/staff-state.json`

The browser state must be captured locally after an authorized operator's normal sign-in. It contains sensitive session data: do not upload it, print it, commit it, or share it. Delete it after testing. The script uses localhost only and prints no candidate data or tokens. It refuses to proceed when signed out. Starting with a recovered sample intentionally stops the script; clean up that sample before a fresh automated run.

The script covers upload, actual parsing, cancellation, existing-file parsing, review/edit, save, reload/read-back, and explicit cleanup. If it fails after creation, return to the verification page with the same account and remove the recovered sample.

Component tests use mocks solely for deterministic access/ownership/persistence behavior; they do not certify real authentication, storage permissions, or model extraction. An unsigned browser run only verifies the sign-in boundary, not end-to-end parsing.