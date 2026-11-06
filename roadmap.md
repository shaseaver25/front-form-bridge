# Resume parsing
- [x] Require structured extraction, normalize optional fields, and show labeled Parse actions for saved resumes; 15 tests and fictional DOCX extraction passed.
- [x] Add optional parsing on resume upload and existing resumes (PDF, DOCX, TXT).
- [x] Review extracted contact details before explicitly saving.
- [x] Secure and deploy parsing; nine tests passed, fictional PDF extraction passed, unauthenticated requests rejected.
- [ ] Verify signed-in upload → parse → save → read-back in the live CRM. Blocked: external Supabase authentication cannot be supplied by the preview tools.