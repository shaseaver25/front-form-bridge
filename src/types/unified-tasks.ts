export type TaskSource = 'manual' | 'board_card' | 'job_deliverable' | 'email_suggestion' | 'voice_note' | 'calendar_meeting';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskOutcomeType = 'placement_made' | 'candidate_submitted' | 'relationship_advanced' | 'meeting_scheduled' | 'client_engaged' | 'event_attendance' | 'other';
export type TaskCategoryType = 'cultivation' | 'stewardship' | 'prospecting' | 'grant_writing' | 'admin' | 'reporting' | 'events' | 'communications';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

export interface UnifiedTask {
  id: string; source: TaskSource; source_id: string | null; source_url: string | null; title: string; description: string | null;
  status: TaskStatus; priority: TaskPriority; due_date: string | null; completed_at: string | null; assigned_to: string | null;
  created_by: string | null; constituent_id: string | null; organization_id: string | null; grant_opportunity_id: string | null;
  estimated_time_minutes: number | null; actual_time_minutes: number; task_category: TaskCategoryType | null;
  outcome_type: TaskOutcomeType | null; outcome_id: string | null; outcome_amount: number | null; outcome_date: string | null;
  outcome_notes: string | null; tags: string[]; created_at: string; updated_at: string;
  assigned_user?: { id: string; full_name: string; avatar_url?: string } | null;
  contact?: { id: string; first_name: string | null; last_name: string | null } | null;
  company?: { id: string; name: string } | null;
  job?: { id: string; name: string } | { id: string; title: string } | null;
}

export interface TaskTimeEntry { id: string; unified_task_id: string; user_id: string; started_at: string; ended_at: string | null; duration_minutes: number | null; notes: string | null; created_at: string; }
export interface TaskFilters { status: string; source: string; assignee: string; category: string; dateRange: string; search: string; }
export interface TaskROIByCategory { task_category: TaskCategoryType | null; total_tasks: number; completed_tasks: number; total_time_invested: number | null; tasks_with_outcomes: number; total_outcome_amount: number | null; revenue_per_hour: number | null; avg_completion_hours: number | null; }
export interface TaskROIByUser { user_id: string; full_name: string; total_tasks: number; completed_tasks: number; total_time_invested: number | null; tasks_with_outcomes: number; total_outcome_amount: number | null; revenue_per_hour: number | null; }

export const sourceIcons: Record<TaskSource, string> = { manual: "📝", board_card: "📋", job_deliverable: "📊", email_suggestion: "📧", voice_note: "🎤", calendar_meeting: "📅" };
export const sourceLabels: Record<TaskSource, string> = { manual: "Manual", board_card: "Board", job_deliverable: "Job", email_suggestion: "Email", voice_note: "Voice", calendar_meeting: "Calendar" };
export const priorityColors: Record<TaskPriority, string> = { low: "bg-gray-100 text-gray-800", medium: "bg-blue-100 text-blue-800", high: "bg-orange-100 text-orange-800", urgent: "bg-red-100 text-red-800" };
export const outcomeTypes = [{ value: "placement_made", label: "Placement Made" }, { value: "candidate_submitted", label: "Candidate Submitted" }, { value: "relationship_advanced", label: "Relationship Advanced" }, { value: "meeting_scheduled", label: "Meeting Scheduled" }, { value: "client_engaged", label: "Client Engaged" }, { value: "event_attendance", label: "Event Attendance" }, { value: "other", label: "Other" }] as const;
export const categoryOptions = [{ value: "cultivation", label: "Cultivation" }, { value: "stewardship", label: "Stewardship" }, { value: "prospecting", label: "Prospecting" }, { value: "grant_writing", label: "Grant Writing" }, { value: "admin", label: "Admin" }, { value: "reporting", label: "Reporting" }, { value: "events", label: "Events" }, { value: "communications", label: "Communications" }] as const;
