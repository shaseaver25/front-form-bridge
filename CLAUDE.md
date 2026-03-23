# AvidEdge — Project CLAUDE.md

## Confidentiality
- This project is NDA-covered — treat all content as strictly confidential
- Do not reference AvidEdge, Juliet Fox, or project details in any output
  intended for public use, demos, or examples
- Do not suggest sharing, exporting, or making any data or docs public
- When in doubt, ask before touching anything client-facing

## Project Overview
Joint venture between Shannon Seaver (TailoredU LLC) and Juliet Fox (AvidEdge).
Two products being built in parallel:
1. Career Advancement Companion — AI-powered career coaching product
2. Specialized CRM — built for corporate recruiters and headhunters
   (distinct from TailoredU headhunting CRM client #1 — do not mix these up)

## Architecture
- Frontend: Lovable (React/Vite) — dedicated AvidEdge instance
  - Do NOT cross-contaminate with TailoredU master template or other client instances
- Backend: Supabase (PostgreSQL + Edge Functions)
- AI Layer: Claude API (Anthropic)
- Built with Claude Code

## Supabase — Critical Rules
- Always confirm table and column names before writing any queries
- Use Row Level Security (RLS) at all times — never disable or bypass
- Separate Supabase project from TailoredU CRM client #1 — confirm
  which project you are connected to before running any query
- All Edge Functions in /supabase/functions/

## Career Advancement Companion
- AI-powered product — Claude API is the core intelligence layer
- User-facing: treat all user data as sensitive by default
- Do not hardcode any prompts that reference specific users or companies
- System prompts live in environment config, not in frontend code

## Recruiter/Headhunter CRM
- Purpose-built for corporate recruiters and headhunters
- Different use case from TailoredU CRM client #1 — different schema,
  different workflows, do not copy structure between them without explicit instruction
- Candidate and client data is highly sensitive — never log PII to console

## File Structure Conventions
- Components: PascalCase
- Utilities: camelCase
- Supabase functions: kebab-case
- All secrets in .env — never hardcoded, never committed
- Keep AvidEdge files completely separate from other project folders

## Do Not
- Do not mix AvidEdge Supabase project with any other client's Supabase project
- Do not modify TailoredU master template from this project context
- Do not push to main — always branch and show Shannon the merge command
- Do not add a second AI provider without explicit discussion
- Do not suggest Mailchimp — use Resend if email is needed
- Do not log candidate or client PII anywhere
- Do not auto-commit — show every git command and wait for approval
