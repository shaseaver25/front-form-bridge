import { supabase } from "@/integrations/supabase/client";

export async function syncSiteVolunteerEvent(siteId: string, siteData: {
  name: string; volunteers_needed?: boolean; meeting_time?: string | null; meeting_days?: string[] | null;
  address_street?: string | null; address_city?: string | null; address_state?: string | null; instructor_name?: string | null;
}) {
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  const { data: existing } = await supabase.from("volunteer_events").select("id, is_active").eq("site_id", siteId).is("parent_event_id", null).maybeSingle();
  if (!siteData.volunteers_needed) {
    if (existing && existing.is_active) {
      await supabase.from("volunteer_events").update({ is_active: false, status: "closed" } as any).eq("id", existing.id);
    }
    return;
  }
  const locationParts = [siteData.address_street, siteData.address_city, siteData.address_state].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(", ") : siteData.name;
  const descParts: string[] = [`Volunteer opportunity at ${siteData.name}.`];
  if (siteData.instructor_name) descParts.push(`Instructor: ${siteData.instructor_name}.`);
  if (siteData.meeting_days?.length) descParts.push(`Meets: ${siteData.meeting_days.join(", ")}.`);
  if (siteData.meeting_time) descParts.push(`Time: ${siteData.meeting_time}.`);
  const title = `Volunteers: ${siteData.name}`;
  if (existing) {
    await supabase.from("volunteer_events").update({ title, description: descParts.join(" "), location, is_active: true, status: "open" } as any).eq("id", existing.id);
  } else {
    await supabase.from("volunteer_events").insert({ title, description: descParts.join(" "), event_type: "ongoing", start_date: new Date().toISOString(), location, location_type: "in-person", status: "open", is_active: true, site_id: siteId, public_signup_enabled: true, created_by: userId } as any);
  }
}