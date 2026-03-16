import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

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
    const { constituentId, constituentName, meetingNotes, nextStepsRaw } = body;

    if (!constituentId || !meetingNotes) {
      return new Response(
        JSON.stringify({ error: "constituentId and meetingNotes are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Service client for DB writes
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Save meeting notes as a contact note
    const noteContent = `Meeting Notes (Voice Note)\n\nAttendee: ${constituentName || "Unknown"}\n\n${meetingNotes}${nextStepsRaw ? `\n\nNext Steps:\n${nextStepsRaw}` : ""}`;

    await adminClient.from("crm_contact_notes").insert({
      contact_id: constituentId,
      content: noteContent,
      created_by: user.id,
    });

    // Parse next steps into tasks using Claude
    const tasks: Array<{ id: string; title: string; due_date: string | null }> = [];

    if (nextStepsRaw && nextStepsRaw.trim()) {
      const today = new Date().toISOString().split("T")[0];

      const parseResponse = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: `You extract action items from meeting next steps. Today's date is ${today}.

Return ONLY a JSON array of tasks. Each task has:
- "title": concise action item (string)
- "due_date": ISO date string (YYYY-MM-DD) inferred from context, or null if no date mentioned

For relative dates like "next week", "by Friday", "tomorrow", calculate from today (${today}).
If no specific date is mentioned, set due_date to one week from today.

Example output:
[{"title": "Send follow-up email to candidate", "due_date": "2026-03-20"}, {"title": "Schedule second interview", "due_date": "2026-03-23"}]

Return ONLY the JSON array. No other text, no markdown formatting.`,
          messages: [
            {
              role: "user",
              content: `Meeting with: ${constituentName || "Unknown"}\n\nNext steps:\n${nextStepsRaw}`,
            },
          ],
        }),
      });

      if (parseResponse.ok) {
        const parseData = await parseResponse.json();
        const rawText = parseData.content?.[0]?.text || "[]";

        try {
          // Extract JSON array from response (handle potential markdown wrapping)
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

          if (Array.isArray(parsed)) {
            for (const task of parsed) {
              if (!task.title) continue;

              // Create as a CRM activity with type "task"
              const { data: created, error: taskError } = await adminClient
                .from("crm_activities")
                .insert({
                  activity_type: "task",
                  subject: task.title,
                  body: `Auto-created from voice note with ${constituentName || "Unknown"}`,
                  scheduled_at: task.due_date
                    ? new Date(task.due_date).toISOString()
                    : null,
                  completed: false,
                  contact_id: constituentId,
                  created_by: user.id,
                })
                .select("id, subject, scheduled_at")
                .single();

              if (!taskError && created) {
                tasks.push({
                  id: created.id,
                  title: created.subject,
                  due_date: created.scheduled_at,
                });
              }
            }
          }
        } catch (parseErr) {
          console.error("Failed to parse tasks from Claude:", parseErr, rawText);
        }
      } else {
        console.error(
          "Claude API error for task parsing:",
          parseResponse.status,
          await parseResponse.text()
        );
      }
    }

    return new Response(
      JSON.stringify({ tasks }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("chip-voice-note error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
        tasks: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
