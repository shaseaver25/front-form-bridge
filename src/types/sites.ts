export type SiteType = 'school' | 'district' | 'organization' | 'partner' | 'community_center' | 'partner_location' | 'field_office' | 'other';
export type OrganizationType = 'public_school' | 'charter' | 'private' | 'intermediate_district' | 'nonprofit' | 'corporate';
export type RelationshipStatus = 'prospect' | 'contacted' | 'in_conversation' | 'pilot' | 'active_partner' | 'inactive' | 'declined';
export type BudgetTier = 'high' | 'medium' | 'low' | 'unknown';
export type TechReadiness = 'high' | 'medium' | 'low' | 'unknown';
export type ConnectionSource = 'network' | 'referral' | 'cold_outreach' | 'event' | 'inbound' | 'existing_relationship';
export type MediaType = 'photo' | 'video';

export interface Site {
  id: string; name: string; description: string | null; site_type: SiteType; organization_type: OrganizationType | null;
  district_name: string | null; district_id: string | null; enrollment: number | null; grade_levels: string[] | null;
  website: string | null; phone: string | null; address: string | null; city: string | null; state: string | null;
  postal_code: string | null; country: string | null; latitude: number | null; longitude: number | null;
  address_street: string | null; address_city: string | null; address_state: string | null; address_zip: string | null;
  relationship_status: RelationshipStatus | null; relationship_started_at: string | null; primary_contact_id: string | null;
  connection_source: ConnectionSource | null; connection_notes: string | null; budget_tier: BudgetTier | null;
  decision_timeline: string | null; tech_readiness: TechReadiness | null; notes: string | null; tags: string[] | null;
  is_active: boolean; start_date: string | null; end_date: string | null; contact_name: string | null;
  contact_email: string | null; contact_phone: string | null; organization_id: string | null;
  instructor_name: string | null; volunteers_needed: boolean; meeting_time: string | null;
  meeting_days: string[] | null; created_at: string; created_by: string | null; updated_at: string;
}

export interface SiteContact { id: string; site_id: string; constituent_id: string; role: string | null; is_primary: boolean; is_decision_maker: boolean; notes: string | null; created_at: string; updated_at: string; constituent?: { id: string; full_legal_name: string; primary_email: string | null; phone: string | null; }; }
export interface SiteOpportunity { id: string; site_id: string; opportunity_id: string; created_at: string; opportunity?: { id: string; name: string; stage: string; amount: number | null; }; }
export interface SiteActivity { id: string; site_id: string; activity_type: string; subject: string | null; description: string | null; activity_date: string; constituent_id: string | null; user_id: string | null; outcome: string | null; follow_up_date: string | null; follow_up_task_id: string | null; created_at: string; updated_at: string; constituent?: { id: string; full_legal_name: string; }; }
export interface SiteProgram { id: string; site_id: string; program_id: string; start_date: string | null; end_date: string | null; notes: string | null; created_at: string; created_by: string | null; program?: { id: string; name: string; description: string | null; }; }
export interface SiteMetric { id: string; site_id: string; metric_name: string; metric_type: string | null; target_value: number | null; current_value: number | null; measurement_date: string; notes: string | null; created_at: string; created_by: string | null; updated_at: string; }
export interface SiteStory { id: string; site_id: string; title: string; story_content: string; person_name: string | null; person_role: string | null; is_published: boolean; published_date: string | null; tags: string[] | null; created_at: string; created_by: string | null; updated_at: string; }
export interface SiteMedia { id: string; site_id: string; file_url: string; file_name: string | null; file_size: number | null; media_type: MediaType; title: string | null; caption: string | null; tags: string[] | null; is_featured: boolean; taken_at: string | null; created_at: string; created_by: string | null; }
export interface SiteWithStats extends Site { program_count?: number; story_count?: number; media_count?: number; contact_count?: number; activity_count?: number; }