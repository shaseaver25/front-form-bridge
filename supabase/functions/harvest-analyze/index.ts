import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description } = await req.json();

    if (!job_description || typeof job_description !== "string" || job_description.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Please provide a job description with at least 50 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Contact your administrator." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert career coach specializing in executive brand positioning. Your task is to analyze a job description and extract language patterns across five specific categories.

Return ONLY valid JSON with this exact structure — no markdown, no explanation, no preamble:
{
  "keywords": ["string array of core technical and functional terms"],
  "problem_language": ["string array of business challenges and pain points referenced"],
  "responsibilities": ["string array of key scope items and action verbs used"],
  "qualifications": ["string array of credentials, experiences, and attributes valued"],
  "nomenclature": ["string array of company-specific jargon, titles, and internal terms"]
}

Guidelines:
- Extract 5-15 items per category
- Use the exact phrasing from the job description — do not paraphrase
- Keywords should be noun phrases (e.g., "digital transformation", "P&L management")
- Problem language should capture the business challenges implied (e.g., "scale operations globally", "reduce time-to-market")
- Responsibilities should use the verb phrases as written (e.g., "Drive strategic initiatives", "Partner with C-suite")
- Qualifications should include both hard requirements and preferred attributes
- Nomenclature should capture any proprietary terms, frameworks, or internal language patterns`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Analyze this job description and extract language patterns:\n\n${job_description}`,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const textContent = result.content?.[0]?.text;

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: "No response from AI. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from Claude's response
    let parsed;
    try {
      // Try direct parse first, then extract from possible markdown code block
      const cleanText = textContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse Claude response:", textContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate structure
    const requiredKeys = ["keywords", "problem_language", "responsibilities", "qualifications", "nomenclature"];
    for (const key of requiredKeys) {
      if (!Array.isArray(parsed[key])) {
        parsed[key] = [];
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("harvest-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
