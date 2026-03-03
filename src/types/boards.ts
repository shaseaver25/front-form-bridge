// Board Types for Project Boards (Kanban) Module

export type BoardType = 'general' | 'grant_application' | 'event' | 'campaign' | 'program';
export type BoardColumnType = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'custom';
export type BoardCardPriority = 'low' | 'medium' | 'high' | 'urgent';
export type BoardMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type BoardActivityType = 'created' | 'moved' | 'assigned' | 'due_date_changed' | 'completed' | 'commented' | 'time_logged';
export type BoardAutomationTrigger = 'card_moved' | 'card_created' | 'due_date_approaching' | 'card_completed';
export type BoardAutomationAction = 'assign_user' | 'set_priority' | 'add_label' | 'notify' | 'move_card';

export interface Board {
  id: string; organization_id: string | null; created_by: string; name: string; description: string | null;
  board_type: BoardType; theme_color: string; column_order: string[]; settings: Record<string, unknown>;
  is_archived: boolean; archived_at: string | null; linked_grant_id: string | null; linked_campaign_id: string | null;
  linked_site_id: string | null; volunteers_needed: boolean | null; is_board_initiative: boolean | null;
  created_at: string; updated_at: string;
}

export interface BoardColumn { id: string; board_id: string; title: string; position: number; column_type: BoardColumnType; wip_limit: number | null; is_done_column: boolean; created_at: string; }

export interface BoardCard {
  id: string; board_id: string; column_id: string; created_by: string; headline: string; description: string | null;
  position: number; priority: BoardCardPriority; due_date: string | null; estimated_hours: number | null;
  actual_hours: number | null; assigned_to: string | null; question_for: string | null;
  linked_contact_id: string | null; linked_grant_id: string | null; linked_donation_id: string | null;
  linked_board_id: string | null; is_suggested: boolean; is_blocked: boolean; blocked_reason: string | null;
  completed_at: string | null; parent_subtask_id: string | null; created_at: string; updated_at: string;
}

export interface BoardCardSubtask { id: string; card_id: string; text: string; is_completed: boolean; completed_at: string | null; position: number; spawned_card_id: string | null; created_at: string; }
export interface BoardCardComment { id: string; card_id: string; user_id: string; content: string; is_ai_generated: boolean; created_at: string; }
export interface BoardCardActivity { id: string; card_id: string; user_id: string | null; activity_type: BoardActivityType; details: Record<string, unknown>; created_at: string; }
export interface BoardCardDependency { id: string; card_id: string; depends_on_card_id: string; created_at: string; }
export interface BoardMember { id: string; board_id: string; user_id: string; role: BoardMemberRole; added_at: string; }
export interface BoardTimeLog { id: string; card_id: string; user_id: string; started_at: string; ended_at: string | null; duration_minutes: number | null; notes: string | null; created_at: string; }
export interface BoardAutomation { id: string; board_id: string; name: string; trigger_type: BoardAutomationTrigger; trigger_config: Record<string, unknown>; action_type: BoardAutomationAction; action_config: Record<string, unknown>; is_active: boolean; created_at: string; }

export interface BoardWithColumns extends Board { columns: BoardColumn[]; }
export interface BoardColumnWithCards extends BoardColumn { cards: BoardCard[]; }
export interface BoardCardWithDetails extends BoardCard { subtasks: BoardCardSubtask[]; comments: BoardCardComment[]; activity: BoardCardActivity[]; dependencies: BoardCardDependency[]; time_logs: BoardTimeLog[]; }
export interface BoardCardMovePayload { cardId: string; fromColumnId: string; toColumnId: string; newPosition: number; }
export interface BoardCardCreatePayload { board_id: string; column_id: string; headline: string; description?: string; priority?: BoardCardPriority; due_date?: string; assigned_to?: string; }