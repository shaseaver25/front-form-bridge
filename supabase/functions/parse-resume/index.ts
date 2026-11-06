import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { generateMessage, GatewayError, type RequestFor } from "npm:@lovable.dev/ai-gateway@0.1.11";
import type {} from "./generated/models.d.ts";
import { z } from "npm:zod@3.25.76";
import mammoth from "npm:mammoth@1.13.0";
import { Buffer } from "node:buffer";
import { hasResumeParseAccess, isSupportedResume } from "./validation.ts";
import { normalizeResumeResult, resumeOutputFormat } from "./result.ts";

const inputSchema = z.object({ contact_id: z.string().uuid(), document_id: z.string().uuid(), source: z.enum(["document", "attachment"]) }).strict();
const outputSchema = z.object({
  first_name: z.string().max(200), last_name: z.string().max(200), job_title: z.string().max(500),
  linkedin_url: z.string().max(1000).refine(value => !value || /^https:\/\/(www\.)?linkedin\.com\//i.test(value)),
  description: z.string().max(30000),
}).strict();
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return respond({ error: "Sign in to parse resumes." }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    const system = Deno.env.get("RESUME_PARSE_SYSTEM_PROMPT");
    if (!url || !key || !system) return respond({ error: "Resume parsing is not configured." }, 503);
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await client.auth.getUser(authorization.slice(7));
    if (authError || !user) return respond({ error: "Sign in to parse resumes." }, 401);
    const roles = await client.from("user_roles").select("role").eq("user_id", user.id);
    if (roles.error || !hasResumeParseAccess((roles.data || []).map(row => row.role))) return respond({ error: "Resume parsing is available to authorized CRM staff only." }, 403);
    const parsed = inputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return respond({ error: "A valid contact and resume are required." }, 400);
    const { contact_id, document_id, source } = parsed.data;
    const contact = await client.from("crm_contacts").select("id").eq("id", contact_id).maybeSingle();
    if (contact.error || !contact.data) return respond({ error: "Contact unavailable." }, 404);
    let name: string;
    let path: string;
    if (source === "document") {
      const row = await client.from("crm_contact_documents").select("file_name,file_url").eq("id", document_id).eq("contact_id", contact_id).maybeSingle();
      if (row.error || !row.data) return respond({ error: "Resume unavailable for this contact." }, 404);
      name = row.data.file_name; path = row.data.file_url;
    } else {
      const row = await client.from("crm_attachments").select("file_name,storage_path").eq("id", document_id).eq("contact_id", contact_id).maybeSingle();
      if (row.error || !row.data?.storage_path) return respond({ error: "Resume unavailable for this contact." }, 404);
      name = row.data.file_name; path = row.data.storage_path;
    }
    if (!isSupportedResume(name)) return respond({ error: "Parse a PDF, DOCX, or TXT resume. Convert older DOC files to PDF first." }, 415);
    // Only stored object paths are accepted; never fetch arbitrary external URLs.
    if (/^https?:\/\//i.test(path)) return respond({ error: "This resume must be uploaded to the CRM before parsing." }, 400);
    const download = await client.storage.from("contact-documents").download(path);
    if (download.error || !download.data) return respond({ error: "Unable to read this resume." }, 403);
    if (download.data.size > 10 * 1024 * 1024) return respond({ error: "Resumes must be 10 MB or smaller." }, 413);
    const bytes = Buffer.from(await download.data.arrayBuffer());
    const content: Exclude<RequestFor<"messages", "anthropic/claude-sonnet-5">["messages"][number]["content"], string> = [];
    if (/\.pdf$/i.test(name)) {
      if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-"))) return respond({ error: "This file is not a valid PDF." }, 400);
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } });
    } else {
      const text = /\.docx$/i.test(name) ? (await mammoth.extractRawText({ buffer: bytes })).value : new TextDecoder().decode(bytes);
      if (!text.trim()) return respond({ error: "No readable text found. Try uploading a PDF copy." }, 422);
      if (text.length > 100000) return respond({ error: "This resume is too long to parse. Upload a shorter copy." }, 413);
      content.push({ type: "text", text });
    }
    content.push({ type: "text", text: "Extract the attached resume as the requested JSON." });
    const result = await generateMessage({ model: "anthropic/claude-sonnet-5", max_tokens: 10000, system, output_config: { format: { type: "json_schema", schema: resumeOutputFormat } }, messages: [{ role: "user", content }] });
    if (result.stop_reason === "max_tokens" || result.stop_reason === "refusal") return respond({ error: "The resume could not be completely parsed. Your file is still saved." }, 422);
    const text = result.content.filter(block => block.type === "text").map(block => block.text).join("");
    const output = outputSchema.safeParse(normalizeResumeResult(JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim())));
    if (!output.success) {
      console.error("Resume result validation failed", { fields: output.error.issues.map(issue => issue.path.join(".")) });
      return respond({ error: "The extracted details were incomplete. Your file is still saved." }, 422);
    }
    return respond(output.data);
  } catch (error) {
    // Never log documents, extracted details, or provider response bodies (PII).
    if (error instanceof GatewayError) {
      console.error("Resume parsing gateway failure", { code: error.code, requestIds: error.ids });
      return respond({ error: error.httpStatus === 402 ? "AI credits are required to parse this resume." : "AI parsing is unavailable. Your file is still saved; try again later." }, error.httpStatus === 402 ? 402 : 502);
    }
    return respond({ error: "Unable to parse this resume. Your uploaded file is still saved." }, 422);
  }
});