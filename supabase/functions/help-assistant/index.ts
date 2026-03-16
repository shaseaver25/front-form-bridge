import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOOL_ITERATIONS = 8;

// ── System prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(context: {
  page?: string;
  role?: string;
  tier?: string;
}) {
  return `You are Chip, the AI assistant for AvidEdge Search — an executive search CRM platform.

You have access to live CRM data via tools. Use them to give accurate, data-driven answers.

## Terminology
- "Contacts" in the UI = crm_contacts table (candidates and clients)
- "Companies" in the UI = crm_companies table
- "Jobs" in the UI = crm_jobs table (open positions / searches)
- "Pipeline" = crm_pipeline_items (candidates linked to jobs with stage tracking)
- "Placements" = successful hires
- "Activities" = calls, emails, meetings, notes logged against contacts

## Current Context
- User is on page: ${context.page || "unknown"}
- User role: ${context.role || "unknown"}
- Subscription tier: ${context.tier || "unknown"}

## Guidelines
- Be concise, warm, and helpful. You're a friendly assistant named Chip.
- Always use tools to look up real data — never fabricate numbers, names, or details.
- When asked for reports or summaries, query the data first, then present it clearly.
- For "how do I" questions about CRM usage, give step-by-step guidance.
- For high-impact write operations (bulk updates, deleting records), ask the user to confirm before proceeding.
- For simple writes (create a task, add a note), go ahead and do it.
- If a question is about a bug or system issue, suggest the user use "Report Issue" for triage.
- Keep responses concise — use bullet points and short paragraphs.`;
}

// ── Tool definitions ───────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "search_contacts",
    description:
      "Search CRM contacts by name, email, job title, or company. Returns matching contacts with key details.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term (name, email, job title, etc.)",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 10, max 25)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_companies",
    description: "Search CRM companies by name, domain, or type.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_jobs",
    description:
      "Search open jobs/positions by title, name, or status. Useful for finding active searches.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term (job title, name, etc.)",
        },
        status: {
          type: "string",
          description:
            "Filter by status. Leave empty for all. Common values: open, filled, cancelled, on_hold",
        },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_pipeline_overview",
    description:
      "Get pipeline status summary — how many candidates at each stage across jobs, or for a specific job.",
    input_schema: {
      type: "object" as const,
      properties: {
        job_id: {
          type: "string",
          description: "Optional: filter to a specific job by ID",
        },
      },
    },
  },
  {
    name: "get_dashboard_stats",
    description:
      "Get key CRM metrics: total contacts, total companies, active jobs, pipeline items, and placements.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_recent_activities",
    description:
      "Get recent CRM activities (calls, emails, meetings, notes). Can filter by contact.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: {
          type: "string",
          description: "Optional: filter to a specific contact",
        },
        limit: { type: "number", description: "Max results (default 15)" },
      },
    },
  },
  {
    name: "get_tasks",
    description:
      "Get tasks — overdue, upcoming, or all. Can filter to current user only.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: {
          type: "string",
          enum: ["overdue", "upcoming", "all"],
          description: "Filter type (default: all)",
        },
        assigned_to_me: {
          type: "boolean",
          description: "If true, only return tasks assigned to the current user",
        },
      },
    },
  },
  {
    name: "create_task",
    description:
      "Create a new task/activity for the user. Returns the created task.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Task title/subject" },
        description: { type: "string", description: "Task details/body" },
        due_date: {
          type: "string",
          description: "Due date in ISO format (YYYY-MM-DD)",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level (default: medium)",
        },
        contact_id: {
          type: "string",
          description: "Optional: link to a contact",
        },
        company_id: {
          type: "string",
          description: "Optional: link to a company",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "add_contact_note",
    description: "Add a note to a contact's record.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "The contact's ID" },
        content: { type: "string", description: "Note content" },
      },
      required: ["contact_id", "content"],
    },
  },
  {
    name: "update_contact",
    description:
      "Update fields on a contact record. Only provided fields are changed. For high-impact changes, confirm with the user first.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "The contact's ID" },
        fields: {
          type: "object",
          description:
            "Fields to update. Allowed: first_name, last_name, job_title, status, description, nick_name, salutation",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            job_title: { type: "string" },
            status: { type: "string" },
            description: { type: "string" },
            nick_name: { type: "string" },
            salutation: { type: "string" },
          },
        },
      },
      required: ["contact_id", "fields"],
    },
  },
  {
    name: "get_contact_details",
    description:
      "Get full details for a specific contact including emails, phones, and recent activity.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "The contact's ID" },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "get_placements",
    description: "Get placement records (successful hires). Can filter by date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "create_support_ticket",
    description:
      "Log a support issue for the admin team to review. Use when the user reports a problem.",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "Issue description" },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
      },
      required: ["description"],
    },
  },
];

// ── Tool execution ─────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  adminClient: SupabaseClient,
  userId: string,
  pageUrl: string | null
): Promise<string> {
  try {
    switch (name) {
      case "search_contacts": {
        const q = String(input.query || "");
        const limit = Math.min(Number(input.limit) || 10, 25);
        const { data, error } = await adminClient
          .from("crm_contacts")
          .select(
            "id, first_name, last_name, job_title, status, contact_type, primary_company_id, salary, average_rating"
          )
          .or(
            `first_name.ilike.%${q}%,last_name.ilike.%${q}%,job_title.ilike.%${q}%,nick_name.ilike.%${q}%`
          )
          .limit(limit);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data ?? []);
      }

      case "search_companies": {
        const q = String(input.query || "");
        const limit = Math.min(Number(input.limit) || 10, 25);
        const { data, error } = await adminClient
          .from("crm_companies")
          .select("id, name, company_type, status, domain, revenue")
          .or(`name.ilike.%${q}%,domain.ilike.%${q}%`)
          .limit(limit);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data ?? []);
      }

      case "search_jobs": {
        const q = String(input.query || "");
        const limit = Math.min(Number(input.limit) || 10, 25);
        let query = adminClient
          .from("crm_jobs")
          .select(
            "id, name, job_title, status, location, job_type, company_id, salary_min, salary_max, number_of_openings, priority"
          )
          .or(`name.ilike.%${q}%,job_title.ilike.%${q}%,location.ilike.%${q}%`);
        if (input.status) {
          query = query.eq("status", input.status);
        }
        const { data, error } = await query.limit(limit);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data ?? []);
      }

      case "get_pipeline_overview": {
        let query = adminClient
          .from("crm_pipeline_items")
          .select("id, status, job_id, contact_id, last_stage_change, average_rating");
        if (input.job_id) {
          query = query.eq("job_id", input.job_id);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        const items = data ?? [];
        // Group by status
        const byStatus: Record<string, number> = {};
        for (const item of items) {
          byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        }
        return JSON.stringify({
          total: items.length,
          byStatus,
        });
      }

      case "get_dashboard_stats": {
        const [contacts, companies, jobs, pipeline, placements] =
          await Promise.all([
            adminClient
              .from("crm_contacts")
              .select("*", { count: "exact", head: true }),
            adminClient
              .from("crm_companies")
              .select("*", { count: "exact", head: true }),
            adminClient
              .from("crm_jobs")
              .select("*", { count: "exact", head: true })
              .eq("status", "open"),
            adminClient
              .from("crm_pipeline_items")
              .select("*", { count: "exact", head: true }),
            adminClient
              .from("crm_placements")
              .select("*", { count: "exact", head: true }),
          ]);
        return JSON.stringify({
          totalContacts: contacts.count ?? 0,
          totalCompanies: companies.count ?? 0,
          activeJobs: jobs.count ?? 0,
          pipelineItems: pipeline.count ?? 0,
          totalPlacements: placements.count ?? 0,
        });
      }

      case "get_recent_activities": {
        const limit = Math.min(Number(input.limit) || 15, 50);
        let query = adminClient
          .from("crm_activities")
          .select(
            "id, activity_type, subject, body, scheduled_at, completed, contact_id, company_id, created_at"
          )
          .order("created_at", { ascending: false });
        if (input.contact_id) {
          query = query.eq("contact_id", input.contact_id);
        }
        const { data, error } = await query.limit(limit);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data ?? []);
      }

      case "get_tasks": {
        // Tasks are stored as activities with activity_type = 'task'
        const limit = 25;
        let query = adminClient
          .from("crm_activities")
          .select(
            "id, subject, body, scheduled_at, completed, contact_id, company_id, created_by, activity_type"
          )
          .eq("activity_type", "task")
          .order("scheduled_at", { ascending: true });

        if (input.assigned_to_me) {
          query = query.eq("created_by", userId);
        }

        const now = new Date().toISOString();
        if (input.filter === "overdue") {
          query = query.lt("scheduled_at", now).eq("completed", false);
        } else if (input.filter === "upcoming") {
          query = query.gte("scheduled_at", now).eq("completed", false);
        }

        const { data, error } = await query.limit(limit);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data ?? []);
      }

      case "create_task": {
        const { data, error } = await adminClient
          .from("crm_activities")
          .insert({
            activity_type: "task",
            subject: input.title,
            body: input.description || null,
            scheduled_at: input.due_date
              ? new Date(input.due_date as string).toISOString()
              : null,
            completed: false,
            contact_id: input.contact_id || null,
            company_id: input.company_id || null,
            created_by: userId,
          })
          .select("id, subject, scheduled_at")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ created: data });
      }

      case "add_contact_note": {
        const { data, error } = await adminClient
          .from("crm_contact_notes")
          .insert({
            contact_id: input.contact_id,
            content: input.content,
            created_by: userId,
          })
          .select("id")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ created: data });
      }

      case "update_contact": {
        const allowedFields = [
          "first_name",
          "last_name",
          "job_title",
          "status",
          "description",
          "nick_name",
          "salutation",
        ];
        const fields = input.fields as Record<string, unknown>;
        const sanitized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(fields)) {
          if (allowedFields.includes(k)) sanitized[k] = v;
        }
        if (Object.keys(sanitized).length === 0) {
          return JSON.stringify({ error: "No valid fields to update" });
        }
        const { data, error } = await adminClient
          .from("crm_contacts")
          .update(sanitized)
          .eq("id", input.contact_id)
          .select("id, first_name, last_name, job_title, status")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ updated: data });
      }

      case "get_contact_details": {
        const [contact, emails, phones, notes, activities] = await Promise.all([
          adminClient
            .from("crm_contacts")
            .select(
              "id, first_name, last_name, job_title, status, contact_type, description, salary, primary_company_id, average_rating, created_at"
            )
            .eq("id", input.contact_id)
            .single(),
          adminClient
            .from("crm_contact_emails")
            .select("email, category, is_primary")
            .eq("contact_id", input.contact_id)
            .limit(5),
          adminClient
            .from("crm_contact_phones")
            .select("phone_number, category, is_primary")
            .eq("contact_id", input.contact_id)
            .limit(5),
          adminClient
            .from("crm_contact_notes")
            .select("content, created_at, is_pinned")
            .eq("contact_id", input.contact_id)
            .order("created_at", { ascending: false })
            .limit(5),
          adminClient
            .from("crm_activities")
            .select("activity_type, subject, scheduled_at, completed")
            .eq("contact_id", input.contact_id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);
        return JSON.stringify({
          contact: contact.data,
          emails: emails.data ?? [],
          phones: phones.data ?? [],
          recentNotes: notes.data ?? [],
          recentActivities: activities.data ?? [],
        });
      }

      case "get_placements": {
        const limit = Math.min(Number(input.limit) || 20, 50);
        const { data, error } = await adminClient
          .from("crm_placements")
          .select(
            "id, contact_id, job_id, placement_date, start_date, salary, fee_amount, fee_percentage, notes, created_at"
          )
          .order("placement_date", { ascending: false })
          .limit(limit);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data ?? []);
      }

      case "create_support_ticket": {
        const { data, error } = await adminClient
          .from("support_tickets")
          .insert({
            user_id: userId,
            page_url: pageUrl,
            description: input.description,
            severity: input.severity || "low",
            status: "open",
            ai_resolved: false,
          })
          .select("id")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ created: data });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    console.error(`Tool ${name} error:`, err);
    return JSON.stringify({
      error: err instanceof Error ? err.message : "Tool execution failed",
    });
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    // Verify user
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    const { message, history = [], context = {}, mode = "chat" } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Build message history for Claude
    // deno-lint-ignore no-explicit-any
    const claudeMessages: any[] = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content:
          mode === "report_issue"
            ? `[The user is reporting an issue]\n\n${message}`
            : message,
      },
    ];

    // Service client for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Agent loop: call Claude, execute tools, repeat
    let iterations = 0;
    let ticketId: string | null = null;
    let aiResolved = false;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const anthropicRes = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages: claudeMessages,
          tools: TOOLS,
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        console.error("Anthropic API error:", anthropicRes.status, errText);
        return new Response(
          JSON.stringify({
            response:
              "I'm having trouble processing that right now. Please try again in a moment.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const anthropicData = await anthropicRes.json();
      const { content, stop_reason } = anthropicData;

      // Append assistant response to conversation
      claudeMessages.push({ role: "assistant", content });

      // If done, extract text response
      if (stop_reason === "end_turn" || stop_reason === "max_tokens") {
        // deno-lint-ignore no-explicit-any
        const textBlock = content.find((b: any) => b.type === "text");
        const response = textBlock?.text || "I've processed your request.";

        const result: Record<string, unknown> = { response };
        if (ticketId) {
          result.ticketId = ticketId;
          result.aiResolved = aiResolved;
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If tool_use, execute tools and continue loop
      if (stop_reason === "tool_use") {
        // deno-lint-ignore no-explicit-any
        const toolResults: any[] = [];

        for (const block of content) {
          if (block.type === "tool_use") {
            console.log(`Executing tool: ${block.name}`, block.input);
            const result = await executeTool(
              block.name,
              block.input,
              adminClient,
              user.id,
              context.page || null
            );

            // Track if a support ticket was created
            if (block.name === "create_support_ticket") {
              try {
                const parsed = JSON.parse(result);
                if (parsed.created?.id) {
                  ticketId = parsed.created.id;
                  // If mode is report_issue and tool succeeded, mark as resolved
                  if (mode === "report_issue") {
                    aiResolved = true;
                  }
                }
              } catch {
                // ignore parse errors
              }
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        // Append tool results and continue loop
        claudeMessages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unexpected stop_reason — return whatever we have
      // deno-lint-ignore no-explicit-any
      const fallbackText = content.find((b: any) => b.type === "text");
      return new Response(
        JSON.stringify({
          response: fallbackText?.text || "I've processed your request.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we exhausted iterations, return last text
    const lastAssistant = claudeMessages
      .filter((m) => m.role === "assistant")
      .pop();
    // deno-lint-ignore no-explicit-any
    const lastText = lastAssistant?.content?.find?.(
      (b: any) => b.type === "text"
    );

    return new Response(
      JSON.stringify({
        response:
          lastText?.text ||
          "I ran into a complex request. Could you try asking in a different way?",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("help-assistant error:", err);
    return new Response(
      JSON.stringify({
        response: "Sorry, something went wrong on my end. Please try again.",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
