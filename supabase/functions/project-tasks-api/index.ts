import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const TYPES = ["bug", "feature", "improvement", "question"] as const;
const TYPE_PREFIX: Record<string, string> = {
  bug: "[Bug] ",
  feature: "[Feature] ",
  improvement: "[Improvement] ",
  question: "[Question] ",
};
const MAX_HEADLINE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_COMMENT = 5000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Constant-time compare so response timing doesn't leak the key.
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

function verifyApiKey(req: Request): boolean {
  const expected = Deno.env.get("DEV_TASKS_API_KEY");
  // Unset or empty key rejects every call rather than allowing open access.
  if (!expected) return false;
  const key = req.headers.get("x-api-key");
  if (!key) return false;
  return safeEqual(key, expected);
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validText(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!verifyApiKey(req)) {
      return json({ error: "Invalid or missing API key" }, 401);
    }

    const boardId = Deno.env.get("DEV_TASKS_BOARD_ID");
    const createdBy = Deno.env.get("DEV_TASKS_CREATED_BY");
    if (!boardId || !createdBy || !UUID_RE.test(boardId) || !UUID_RE.test(createdBy)) {
      return json({ error: "Server is not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/project-tasks-api\/?/, "/").replace(/\/+$/, "") || "/";
    const method = req.method;

    // Columns of the pinned board, keyed by column_type, so status maps to a column.
    async function columnFor(status: string) {
      const { data, error } = await supabase
        .from("board_columns")
        .select("id, column_type, is_done_column")
        .eq("board_id", boardId!)
        .eq("column_type", status)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    }

    async function logActivity(cardId: string, type: string, details: Obj) {
      // Activity is best-effort; never fail the request because of it.
      const { error } = await supabase
        .from("board_card_activity")
        .insert({ card_id: cardId, user_id: createdBy, activity_type: type, details: { ...details, via: "project-tasks-api" } });
      if (error) console.error("activity log error:", error.message);
    }


    // GET /tasks?status=&q=&limit=
    if (method === "GET" && path === "/tasks") {
      const status = url.searchParams.get("status");
      const q = url.searchParams.get("q")?.trim();
      const limitRaw = Number(url.searchParams.get("limit") ?? 50);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 50;

      if (status && !(STATUSES as readonly string[]).includes(status)) {
        return json({ error: `status must be one of: ${STATUSES.join(", ")}` }, 400);
      }

      const { data: columns, error: colErr } = await supabase
        .from("board_columns")
        .select("id, title, column_type")
        .eq("board_id", boardId);
      if (colErr) return json({ error: colErr.message }, 500);
      const colById = Object.fromEntries((columns || []).map((c) => [c.id, c]));

      let query = supabase
        .from("board_cards")
        .select("id, headline, description, priority, column_id, is_blocked, blocked_reason, completed_at, created_at, updated_at")
        .eq("board_id", boardId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        const ids = (columns || []).filter((c) => c.column_type === status).map((c) => c.id);
        if (ids.length === 0) return json({ tasks: [], count: 0 });
        query = query.in("column_id", ids);
      }
      if (q) {
        // Strip characters that have meaning in PostgREST filter syntax and LIKE wildcards.
        const term = q.replace(/[,()%_*\\]/g, " ").slice(0, 100).trim();
        if (term) query = query.or(`headline.ilike.%${term}%,description.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);

      const tasks = (data || []).map((c) => ({
        id: c.id,
        headline: c.headline,
        description: c.description,
        priority: c.priority,
        status: colById[c.column_id]?.column_type ?? null,
        column: colById[c.column_id]?.title ?? null,
        is_blocked: c.is_blocked,
        blocked_reason: c.blocked_reason,
        completed_at: c.completed_at,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
      return json({ tasks, count: tasks.length });
    }

    // POST /tasks
    if (method === "POST" && path === "/tasks") {
      const body = await req.json().catch(() => null);
      if (!isObj(body)) return json({ error: "JSON body required" }, 400);
      const { headline, description, priority, type } = body;

      if (!validText(headline, MAX_HEADLINE)) {
        return json({ error: `headline is required (max ${MAX_HEADLINE} characters)` }, 400);
      }
      if (description !== undefined && description !== null && !(typeof description === "string" && description.length <= MAX_DESCRIPTION)) {
        return json({ error: `description must be a string up to ${MAX_DESCRIPTION} characters` }, 400);
      }
      if (priority !== undefined && !(PRIORITIES as readonly unknown[]).includes(priority)) {
        return json({ error: `priority must be one of: ${PRIORITIES.join(", ")}` }, 400);
      }
      if (type !== undefined && !(TYPES as readonly unknown[]).includes(type)) {
        return json({ error: `type must be one of: ${TYPES.join(", ")}` }, 400);
      }

      // New items land in Backlog, falling back to To Do.
      const column = (await columnFor("backlog")) ?? (await columnFor("todo"));
      if (!column) return json({ error: "Board has no backlog or to-do column" }, 500);

      const { data: last } = await supabase
        .from("board_cards")
        .select("position")
        .eq("column_id", column.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const title = (type ? TYPE_PREFIX[type as string] : "") + headline.trim();
      const { data, error } = await supabase
        .from("board_cards")
        .insert({
          board_id: boardId,
          column_id: column.id,
          created_by: createdBy,
          headline: title.slice(0, MAX_HEADLINE + 20),
          description: typeof description === "string" ? description : null,
          priority: (priority as string) ?? "medium",
          position: (last?.position ?? -1) + 1,
          is_suggested: true,
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 500);

      await logActivity(data.id, "created", { source: "gpt" });
      return json({ id: data.id, message: "Task created" }, 201);
    }

    const taskMatch = path.match(/^\/tasks\/([0-9a-f-]{36})$/i);
    const commentMatch = path.match(/^\/tasks\/([0-9a-f-]{36})\/comments$/i);
    const taskId = taskMatch?.[1] ?? commentMatch?.[1];

    if (taskId && !UUID_RE.test(taskId)) return json({ error: "Invalid task id" }, 400);

    // PATCH /tasks/{id}
    if (method === "PATCH" && taskMatch && taskId) {
      const body = await req.json().catch(() => null);
      if (!isObj(body)) return json({ error: "JSON body required" }, 400);

      const { data: existing, error: exErr } = await supabase
        .from("board_cards")
        .select("id, column_id, completed_at")
        .eq("id", taskId)
        .eq("board_id", boardId)
        .maybeSingle();
      if (exErr) return json({ error: exErr.message }, 500);
      if (!existing) return json({ error: "Task not found" }, 404);

      const updates: Obj = {};
      const details: Obj = {};

      if (body.headline !== undefined) {
        if (!validText(body.headline, MAX_HEADLINE + 20)) return json({ error: "headline must be non-empty text" }, 400);
        updates.headline = body.headline.trim();
      }
      if (body.description !== undefined) {
        if (body.description !== null && !(typeof body.description === "string" && body.description.length <= MAX_DESCRIPTION)) {
          return json({ error: `description must be a string up to ${MAX_DESCRIPTION} characters` }, 400);
        }
        updates.description = body.description;
      }
      if (body.priority !== undefined) {
        if (!(PRIORITIES as readonly unknown[]).includes(body.priority)) {
          return json({ error: `priority must be one of: ${PRIORITIES.join(", ")}` }, 400);
        }
        updates.priority = body.priority;
      }
      if (body.is_blocked !== undefined) {
        if (typeof body.is_blocked !== "boolean") return json({ error: "is_blocked must be true or false" }, 400);
        updates.is_blocked = body.is_blocked;
        if (!body.is_blocked) updates.blocked_reason = null;
      }
      if (body.blocked_reason !== undefined) {
        if (body.blocked_reason !== null && !validText(body.blocked_reason, 500)) {
          return json({ error: "blocked_reason must be text up to 500 characters" }, 400);
        }
        updates.blocked_reason = body.blocked_reason;
      }

      if (body.status !== undefined) {
        if (!(STATUSES as readonly unknown[]).includes(body.status)) {
          return json({ error: `status must be one of: ${STATUSES.join(", ")}` }, 400);
        }
        const column = await columnFor(body.status as string);
        if (!column) return json({ error: `Board has no '${body.status}' column` }, 400);
        if (column.id !== existing.column_id) {
          const { data: last } = await supabase
            .from("board_cards")
            .select("position")
            .eq("column_id", column.id)
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle();
          updates.column_id = column.id;
          updates.position = (last?.position ?? -1) + 1;
          details.to_status = body.status;
          if (column.is_done_column && !existing.completed_at) {
            updates.completed_at = new Date().toISOString();
          } else if (!column.is_done_column && existing.completed_at) {
            updates.completed_at = null;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return json({ error: "No valid fields to update" }, 400);
      }
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("board_cards")
        .update(updates)
        .eq("id", taskId)
        .eq("board_id", boardId);
      if (error) return json({ error: error.message }, 500);

      if (details.to_status) {
        await logActivity(taskId, updates.completed_at ? "completed" : "moved", details);
      }
      return json({ id: taskId, message: "Task updated" });
    }

    // POST /tasks/{id}/comments
    if (method === "POST" && commentMatch && taskId) {
      const body = await req.json().catch(() => null);
      if (!isObj(body) || !validText(body.content, MAX_COMMENT)) {
        return json({ error: `content is required (max ${MAX_COMMENT} characters)` }, 400);
      }

      const { data: card, error: cardErr } = await supabase
        .from("board_cards")
        .select("id")
        .eq("id", taskId)
        .eq("board_id", boardId)
        .maybeSingle();
      if (cardErr) return json({ error: cardErr.message }, 500);
      if (!card) return json({ error: "Task not found" }, 404);

      const { data, error } = await supabase
        .from("board_card_comments")
        .insert({ card_id: taskId, user_id: createdBy, content: body.content.trim(), is_ai_generated: true })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 500);

      await logActivity(taskId, "commented", {});
      return json({ id: data.id, message: "Comment added" }, 201);
    }

    return json({
      error: "Not found",
      available_endpoints: [
        "GET /tasks",
        "POST /tasks",
        "PATCH /tasks/{id}",
        "POST /tasks/{id}/comments",
      ],
    }, 404);
  } catch (e) {
    console.error("project-tasks-api error:", e);
    return json({ error: "Internal error" }, 500);
  }
});