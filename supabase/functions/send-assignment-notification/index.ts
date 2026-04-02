import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("Resend_API_Key")!;

    // Verify the calling user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { assignee_user_id, item_name, item_type, project_name, assigned_by_user_id, item_id } = body;

    if (!assignee_user_id || !item_name || !item_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get assignee's email and name
    const { data: assigneeProfile } = await adminClient
      .from("user_profiles")
      .select("email, first_name, last_name")
      .eq("id", assignee_user_id)
      .single();

    if (!assigneeProfile?.email) {
      return new Response(JSON.stringify({ error: "Assignee email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get assigner's name
    let assignerName = "A team member";
    if (assigned_by_user_id) {
      const { data: assignerProfile } = await adminClient
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("id", assigned_by_user_id)
        .single();

      if (assignerProfile) {
        assignerName = [assignerProfile.first_name, assignerProfile.last_name].filter(Boolean).join(" ") || "A team member";
      }
    }

    const assigneeName = assigneeProfile.first_name || "there";
    const siteUrl = req.headers.get("origin") || "https://front-form-bridge.lovable.app";

    // Build appropriate link
    let actionUrl = siteUrl;
    if (item_type === "project" && item_id) {
      actionUrl = `${siteUrl}/projects/${item_id}`;
    } else if (item_type === "task" && item_id) {
      actionUrl = `${siteUrl}/projects/${item_id}`;
    }

    const isTask = item_type === "task";
    const subjectLine = isTask
      ? `You've been assigned a task: ${item_name}`
      : `You've been added to a project: ${item_name}`;

    const bodyText = isTask
      ? `<p><strong>${assignerName}</strong> has assigned you a task: <strong>${item_name}</strong>${project_name ? ` in the project <strong>${project_name}</strong>` : ""}.</p>`
      : `<p><strong>${assignerName}</strong> has assigned you to the project: <strong>${item_name}</strong>.</p>`;

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AvidEdge <noreply@tailoredu.org>",
        to: [assigneeProfile.email],
        subject: subjectLine,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">AvidEdge</h1>
            </div>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">${isTask ? "New Task Assignment" : "New Project Assignment"}</h2>
              <p>Hi ${assigneeName},</p>
              ${bodyText}
              <p>Log in to view the details and get started.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" 
                   style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  View ${isTask ? "Task" : "Project"}
                </a>
              </div>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated notification from AvidEdge.
            </p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.text();
      console.error("Resend error:", resendError);
      // Return success anyway — the assignment itself succeeded,
      // email notification is best-effort
      return new Response(JSON.stringify({ success: true, email_sent: false, reason: "Email service unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
