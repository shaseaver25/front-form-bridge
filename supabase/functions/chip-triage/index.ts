import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const TRIAGE_SYSTEM_PROMPT = `You are Chip, an AI support triage agent for the TailoredU CRM platform. Your job is to help customers who report problems.

## Your Workflow

1. **Understand the problem**: Ask clarifying questions if the issue is vague. You need enough context to triage.
2. **Investigate**: Use the context you have (current page, user role, browser info) to reason about possible causes.
3. **Triage**: Decide the severity and whether you can resolve it or need to escalate.

## Actions You Can Take

Respond with EXACTLY ONE action per message inside <triage> tags:

### follow_up — You need more information
Use when the problem description is too vague to triage.

### info — General question, not a bug/issue
Use when the user is asking "how to" questions, not reporting a problem.

### auto_fix — You can resolve this directly
Use for:
- UX confusion (explain how the feature works)
- Configuration issues (tell them what setting to change)
- Known workarounds for common issues
- Permission-related guidance
- Browser compatibility advice

### escalate — This needs Shannon's approval
Use for:
- Actual bugs (something is broken)
- Data integrity issues
- Features not working as documented
- System errors or crashes
- Anything requiring code or database changes
- Security concerns

## Response Format

Always include a <triage> block at the END of your response with this exact JSON structure:

<triage>
{
  "action": "follow_up" | "info" | "auto_fix" | "escalate",
  "severity": "low" | "medium" | "high" | "critical",
  "issueSummary": "One-line summary (required for auto_fix and escalate)",
  "proposedFix": "What you recommend (required for escalate, optional for auto_fix)",
  "affectedArea": "Which part of the system (e.g., 'Donor Management', 'Grant Pipeline')"
}
</triage>

## Severity Guide
- **low**: Cosmetic issues, minor UX confusion
- **medium**: Feature partially broken, workaround exists
- **high**: Feature completely broken, no workaround
- **critical**: Data loss risk, security issue, system-wide outage

## Important Rules
- Be warm, helpful, and concise in your responses to the user.
- When escalating, tell the user: "I've flagged this for Shannon to review. She'll take a look and get back to you."
- When auto-fixing, clearly explain what the user should do and confirm the issue is resolved.
- Never make up technical details you don't know. If unsure, escalate.
- You are Chip — use a friendly, supportive tone.`;

interface TriageResult {
  action: "follow_up" | "info" | "auto_fix" | "escalate";
  severity: "low" | "medium" | "high" | "critical";
  issueSummary?: string;
  proposedFix?: string;
  affectedArea?: string;
}

function parseTriageBlock(text: string): TriageResult | null {
  const match = text.match(/<triage>\s*([\s\S]*?)\s*<\/triage>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as TriageResult;
  } catch {
    console.error("Failed to parse triage block:", match[1]);
    return null;
  }
}

function stripTriageBlock(text: string): string {
  return text.replace(/<triage>[\s\S]*?<\/triage>/, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const webhookUrl = Deno.env.get("CHIP_ESCALATION_WEBHOOK") || "";
    const shannonEmail = Deno.env.get("SHANNON_EMAIL") || "shannon@tailoredu.org";

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    const { message, history = [], context = {} } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages for Claude
    const claudeMessages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: `[Context: Page=${context.page || "unknown"}, Role=${context.role || "unknown"}, Tier=${context.tier || "unknown"}]

${message}`,
      },
    ];

    // Call Anthropic API
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: TRIAGE_SYSTEM_PROMPT,
        messages: claudeMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      return new Response(
        JSON.stringify({
          response: "I'm having trouble processing that right now. Please try again in a moment.",
          action: "info",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicRes.json();
    const rawResponse = anthropicData.content?.[0]?.text || "";

    // Parse triage decision
    const triage = parseTriageBlock(rawResponse);
    const userMessage = stripTriageBlock(rawResponse);

    // Default response
    const result: Record<string, unknown> = {
      response: userMessage || rawResponse,
      action: triage?.action || "info",
      severity: triage?.severity || "low",
    };

    // Service client for DB writes
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Handle auto_fix: log ticket with ai_resolved=true
    if (triage?.action === "auto_fix") {
      const { data: ticket } = await adminClient.from("support_tickets").insert({
        user_id: user.id,
        page_url: context.page || null,
        description: triage.issueSummary || message,
        ai_response: userMessage,
        ai_resolved: true,
        severity: triage.severity,
        status: "resolved",
      }).select("id").single();

      if (ticket) {
        result.ticketId = ticket.id;

        await adminClient.from("escalation_queue").insert({
          support_ticket_id: ticket.id,
          issue_summary: triage.issueSummary || message,
          affected_area: triage.affectedArea || null,
          page_url: context.page || null,
          details: { context, originalMessage: message },
          severity: triage.severity,
          proposed_fix: triage.proposedFix || userMessage,
          status: "auto_fixed",
          customer_user_id: user.id,
        });
      }
    }

    // Handle escalate: create ticket + escalation + fire webhook
    if (triage?.action === "escalate") {
      const { data: ticket } = await adminClient.from("support_tickets").insert({
        user_id: user.id,
        page_url: context.page || null,
        description: triage.issueSummary || message,
        ai_response: userMessage,
        ai_resolved: false,
        severity: triage.severity,
        status: "open",
      }).select("id").single();

      let escalationId: string | null = null;

      if (ticket) {
        result.ticketId = ticket.id;

        const { data: escalation } = await adminClient.from("escalation_queue").insert({
          support_ticket_id: ticket.id,
          issue_summary: triage.issueSummary || message,
          affected_area: triage.affectedArea || null,
          page_url: context.page || null,
          details: { context, originalMessage: message, browserInfo: context.browserInfo },
          severity: triage.severity,
          proposed_fix: triage.proposedFix || null,
          status: "pending_approval",
          customer_user_id: user.id,
          assigned_to: shannonEmail,
        }).select("id").single();

        if (escalation) {
          escalationId = escalation.id;
          result.escalationId = escalation.id;
        }

        // Fire webhook to n8n (non-blocking — don't fail if webhook is down)
        if (webhookUrl) {
          try {
            const webhookRes = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                issue: triage.issueSummary || message,
                files: triage.affectedArea || "unknown",
                details: `${userMessage}\n\nProposed fix: ${triage.proposedFix || "None specified"}`,
                triggeredBy: "chip-triage",
                severity: triage.severity,
                shannonEmail,
                timestamp: new Date().toISOString(),
                escalationId: escalationId,
                ticketId: ticket.id,
                customerEmail: user.email,
              }),
            });

            if (escalationId) {
              await adminClient.from("escalation_queue").update({
                webhook_sent: true,
                webhook_response_code: webhookRes.status,
              }).eq("id", escalationId);
            }
          } catch (webhookErr: unknown) {
            console.error("Webhook failed (non-fatal):", webhookErr);
            if (escalationId) {
              await adminClient.from("escalation_queue").update({
                webhook_sent: false,
              }).eq("id", escalationId);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("chip-triage error:", err);
    return new Response(
      JSON.stringify({
        response: "Sorry, something went wrong on my end. Please try again.",
        action: "info",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
