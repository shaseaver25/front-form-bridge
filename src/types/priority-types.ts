export type BetaCriticality = 'critical_blocker' | 'important_for_quality' | 'nice_to_have' | 'post_beta';
export type UserImpactScope = 'all_users_core_experience' | 'majority_users' | 'specific_segment' | 'internal_only';
export type StrategicValue = 'unique_differentiator' | 'market_position' | 'builds_capability' | 'routine_execution';
export type RevenuePotential = 'enables_paying_customers' | 'validates_willingness_to_pay' | 'partnership_opportunity' | 'no_revenue_connection';
export type TechnicalComplexity = 'low' | 'medium' | 'high' | 'very_high';
export type PriorityConfidence = 'high' | 'medium' | 'low';
export type OrganizationType = 'nonprofit' | 'for_profit';

export interface PriorityEstimate { taskId: string; priorityScore: number; confidenceLevel: PriorityConfidence; priorityReasoning: string; suggestedPriority: 'low' | 'medium' | 'high' | 'urgent'; potentialValue?: number; }

export const betaCriticalityOptions = [
  { value: 'critical_blocker', label: 'Critical Blocker', description: "Can't launch without it" },
  { value: 'important_for_quality', label: 'Important for Quality', description: 'Significantly improves launch' },
  { value: 'nice_to_have', label: 'Nice to Have', description: 'Would be good but not essential' },
  { value: 'post_beta', label: 'Post Beta', description: 'Can wait until after launch' },
] as const;

export const userImpactScopeOptions = [
  { value: 'all_users_core_experience', label: 'All Users (Core)', description: 'Affects core experience for everyone' },
  { value: 'majority_users', label: 'Majority of Users', description: 'Affects 250+ of 500 beta users' },
  { value: 'specific_segment', label: 'Specific Segment', description: 'Affects a particular user group' },
  { value: 'internal_only', label: 'Internal Only', description: 'Only affects internal operations' },
] as const;

export const strategicValueOptions = [
  { value: 'unique_differentiator', label: 'Unique Differentiator', description: 'Sets us apart from competition' },
  { value: 'market_position', label: 'Market Position', description: 'Conference, case study, visibility' },
  { value: 'builds_capability', label: 'Builds Capability', description: 'Enables future features' },
  { value: 'routine_execution', label: 'Routine Execution', description: 'Standard operational task' },
] as const;

export const revenuePotentialOptions = [
  { value: 'enables_paying_customers', label: 'Enables Paying Customers', description: 'Direct path to revenue' },
  { value: 'validates_willingness_to_pay', label: 'Validates Willingness to Pay', description: 'Tests pricing/value prop' },
  { value: 'partnership_opportunity', label: 'Partnership Opportunity', description: 'Opens partnership doors' },
  { value: 'no_revenue_connection', label: 'No Revenue Connection', description: 'No direct revenue impact' },
] as const;

export const technicalComplexityOptions = [
  { value: 'low', label: 'Low', description: '<2 hours effort' },
  { value: 'medium', label: 'Medium', description: '2-4 hours effort' },
  { value: 'high', label: 'High', description: '4-8 hours effort' },
  { value: 'very_high', label: 'Very High', description: '8+ hours effort' },
] as const;

export const organizationTypeOptions = [
  { value: 'nonprofit', label: 'Nonprofit', description: 'Grants, donors, fundraising-focused. Uses ROI-based prioritization considering grant values and donor relationships.' },
  { value: 'for_profit', label: 'For-Profit', description: 'Product development, revenue-focused. Uses beta launch criticality and strategic value for prioritization.' },
] as const;

export function getPriorityScoreColor(score: number): string {
  if (score >= 71) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 41) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function getPriorityScoreLabel(score: number): string {
  if (score >= 71) return "High Priority";
  if (score >= 41) return "Medium Priority";
  return "Low Priority";
}