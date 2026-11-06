# Architecture rules
- Resume parsing runs in an authenticated, role-checked Edge Function with user-scoped database and private storage reads; never use service-role reads for resume content.
- Resume extraction uses the Claude Messages surface through the AI Gateway SDK, with its system prompt in environment configuration; no additional AI vendor is introduced.
- Parsed details remain transient until a user approves selected profile fields; combine experience, education, and skills into the searchable description without replacing company links or history rows.