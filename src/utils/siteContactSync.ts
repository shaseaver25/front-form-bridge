import { supabase } from "@/integrations/supabase/client";

export async function syncSiteContact(siteId: string, contactName: string | null, contactEmail: string | null, contactPhone: string | null) {
  if (!contactName && !contactEmail) return;
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  const nameParts = (contactName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
  let constituentId: string | null = null;
  if (contactEmail) {
    const { data: existing } = await supabase.from("constituents").select("id").eq("primary_email", contactEmail).maybeSingle();
    if (existing) constituentId = existing.id;
  }
  if (!constituentId && contactName) {
    const { data: existing } = await supabase.from("constituents").select("id").eq("full_legal_name", contactName.trim()).maybeSingle();
    if (existing) constituentId = existing.id;
  }
  if (!constituentId) {
    const { data: newConstituent, error } = await supabase.from("constituents").insert({ first_name: firstName, last_name: lastName, full_legal_name: contactName?.trim() || contactEmail || "Unknown", primary_email: contactEmail || null, phone: contactPhone || null, created_by: userId }).select("id").single();
    if (error) { console.error("Failed to create constituent for site contact:", error); return; }
    constituentId = newConstituent.id;
  }
  const { data: existingLink } = await supabase.from("site_contacts").select("id").eq("site_id", siteId).eq("constituent_id", constituentId).maybeSingle();
  if (!existingLink) {
    await supabase.from("site_contacts").insert({ site_id: siteId, constituent_id: constituentId, role: "Site Contact", is_primary: true, is_decision_maker: false });
  }
  await supabase.from("sites").update({ primary_contact_id: constituentId }).eq("id", siteId);
}