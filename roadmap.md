# Resume parsing
- [x] Fixed three blocking security findings (collaborators, unified tasks, contact downloads); verified live policies, fresh scan, four regression tests, and marked all resolved.
- [x] Require structured extraction, normalize optional fields, and show labeled Parse actions for saved resumes; 15 tests and fictional DOCX extraction passed.
- [x] Add optional parsing on resume upload and existing resumes (PDF, DOCX, TXT).
- [x] Review extracted contact details before explicitly saving.
- [x] Secure and deploy parsing; nine tests passed, fictional PDF extraction passed, unauthenticated requests rejected.
- [x] Add a development-only, real-sign-in resume verification page with a fictional contact, sample resume, saved-field read-back, and explicit cleanup.
- [x] Add fixture regression tests and a repeatable browser verification script; 21 tests pass, preview compiles, and browser sign-in boundary verified.
- [ ] Verify signed-in upload → parse → save → read-back against the real service. External Supabase cannot supply a session to this sandbox; the verification page must use an operator's normal sign-in, never an authentication bypass.