export type FeedbackType = 'speaker' | 'teacher';
export type EvaluatorType = 'site_manager' | 'audience' | 'student' | 'parent';

export interface EmployeeFeedback { id: string; employee_id: string; feedback_type: FeedbackType; evaluator_type: EvaluatorType; evaluator_name: string; evaluator_email: string | null; event_date: string; event_name: string; created_at: string; created_by: string | null; ratings?: FeedbackRating[]; comments?: FeedbackComment[]; }
export interface FeedbackRating { id: string; feedback_id: string; category: string; score: number; weight: number; }
export interface FeedbackComment { id: string; feedback_id: string; question_key: string; response: string; }
export interface EmployeeFeedbackWithDetails extends EmployeeFeedback { ratings: FeedbackRating[]; comments: FeedbackComment[]; employee_name?: string; }

export const SPEAKER_RATING_CATEGORIES = [
  { key: 'content_knowledge', label: 'Content Knowledge', description: 'How well did they know the material?' },
  { key: 'presentation_skills', label: 'Presentation Skills', description: 'Engaging delivery, clear communication' },
  { key: 'audience_engagement', label: 'Audience Engagement', description: 'Interaction, Q&A handling' },
  { key: 'professionalism', label: 'Professionalism', description: 'Punctuality, preparedness, appearance' },
  { key: 'overall_effectiveness', label: 'Overall Effectiveness', description: 'Would you recommend this speaker?' },
];

export const TEACHER_RATING_CATEGORIES = [
  { key: 'subject_expertise', label: 'Subject Matter Expertise', description: 'Knowledge of the subject' },
  { key: 'classroom_management', label: 'Classroom Management', description: 'Control and organization' },
  { key: 'student_engagement', label: 'Student Engagement', description: 'Keeping students interested' },
  { key: 'communication', label: 'Communication', description: 'Clarity of instructions, responsiveness' },
  { key: 'adaptability', label: 'Adaptability', description: 'Adjusting to student needs' },
  { key: 'professionalism', label: 'Professionalism', description: 'Punctuality, preparedness' },
  { key: 'overall_effectiveness', label: 'Overall Effectiveness', description: 'Would you recommend this teacher?' },
];

export const SITE_MANAGER_QUESTIONS = [{ key: 'went_well', label: 'What went well during this session?' }, { key: 'improvements', label: 'What could be improved?' }, { key: 'incidents', label: 'Any incidents or concerns to note?' }, { key: 'would_rehire', label: 'Would you want this person back? (Yes/No/Maybe + explanation)' }];
export const AUDIENCE_QUESTIONS = [{ key: 'valuable_takeaway', label: 'What was the most valuable takeaway?' }, { key: 'session_improvements', label: 'What would have made this session better?' }, { key: 'additional_comments', label: 'Additional comments' }];
export const STUDENT_QUESTIONS = [{ key: 'like_about_class', label: 'What do you like about this class?' }, { key: 'make_better', label: 'What would make it better?' }, { key: 'how_helps_learn', label: 'How does this teacher help you learn?' }];
export const PARENT_QUESTIONS = [{ key: 'child_experience', label: "How has your child's experience been?" }, { key: 'teacher_communication', label: 'How is communication with this teacher?' }, { key: 'concerns_praise', label: 'Any concerns or praise to share?' }];

export function getQuestionsForEvaluator(feedbackType: FeedbackType, evaluatorType: EvaluatorType) {
  if (evaluatorType === 'site_manager') return SITE_MANAGER_QUESTIONS;
  if (feedbackType === 'speaker' && evaluatorType === 'audience') return AUDIENCE_QUESTIONS;
  if (feedbackType === 'teacher' && evaluatorType === 'student') return STUDENT_QUESTIONS;
  if (feedbackType === 'teacher' && evaluatorType === 'parent') return PARENT_QUESTIONS;
  return [];
}

export function getRatingCategories(feedbackType: FeedbackType) {
  return feedbackType === 'speaker' ? SPEAKER_RATING_CATEGORIES : TEACHER_RATING_CATEGORIES;
}