import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EmployeeFeedback, FeedbackRating, FeedbackComment, FeedbackType, EvaluatorType } from "@/types/employee-feedback";

export function useEmployeeFeedback(filters?: {
  employeeId?: string;
  feedbackType?: FeedbackType;
  evaluatorType?: EvaluatorType;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["employee-feedback", filters],
    queryFn: async () => {
      let query = supabase
        .from("employee_feedback")
        .select(`
          *,
          ratings:feedback_ratings(*),
          comments:feedback_comments(*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.employeeId) {
        query = query.eq("employee_id", filters.employeeId);
      }
      if (filters?.feedbackType) {
        query = query.eq("feedback_type", filters.feedbackType);
      }
      if (filters?.evaluatorType) {
        query = query.eq("evaluator_type", filters.evaluatorType);
      }
      if (filters?.startDate) {
        query = query.gte("event_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("event_date", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (EmployeeFeedback & { ratings: FeedbackRating[]; comments: FeedbackComment[] })[];
    },
  });
}

export function useEmployeeFeedbackStats() {
  return useQuery({
    queryKey: ["employee-feedback-stats"],
    queryFn: async () => {
      const { data: feedback, error } = await supabase
        .from("employee_feedback")
        .select(`
          id,
          employee_id,
          feedback_type,
          created_at,
          ratings:feedback_ratings(score, category)
        `);

      if (error) throw error;

      // Calculate stats
      const employeeStats: Record<string, {
        totalFeedback: number;
        averageRating: number;
        ratingsByCategory: Record<string, { total: number; count: number }>;
      }> = {};

      feedback?.forEach((fb: any) => {
        if (!employeeStats[fb.employee_id]) {
          employeeStats[fb.employee_id] = {
            totalFeedback: 0,
            averageRating: 0,
            ratingsByCategory: {},
          };
        }

        employeeStats[fb.employee_id].totalFeedback++;

        fb.ratings?.forEach((rating: FeedbackRating) => {
          if (!employeeStats[fb.employee_id].ratingsByCategory[rating.category]) {
            employeeStats[fb.employee_id].ratingsByCategory[rating.category] = { total: 0, count: 0 };
          }
          employeeStats[fb.employee_id].ratingsByCategory[rating.category].total += rating.score;
          employeeStats[fb.employee_id].ratingsByCategory[rating.category].count++;
        });
      });

      // Calculate averages
      Object.keys(employeeStats).forEach((empId) => {
        const categories = employeeStats[empId].ratingsByCategory;
        const categoryAverages = Object.values(categories).map(
          (cat) => cat.total / cat.count
        );
        if (categoryAverages.length > 0) {
          employeeStats[empId].averageRating =
            categoryAverages.reduce((a, b) => a + b, 0) / categoryAverages.length;
        }
      });

      return {
        totalCount: feedback?.length || 0,
        recentSubmissions: feedback?.slice(0, 5) || [],
        employeeStats,
      };
    },
  });
}

interface SubmitFeedbackInput {
  employee_id: string;
  feedback_type: FeedbackType;
  evaluator_type: EvaluatorType;
  evaluator_name: string;
  evaluator_email?: string;
  event_date: string;
  event_name: string;
  ratings: { category: string; score: number; weight?: number }[];
  comments: { question_key: string; response: string }[];
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitFeedbackInput) => {
      // Generate ID client-side to avoid needing SELECT after INSERT
      const feedbackId = crypto.randomUUID();
      
      // Insert the main feedback record
      const { error: feedbackError } = await supabase
        .from("employee_feedback")
        .insert({
          id: feedbackId,
          employee_id: input.employee_id,
          feedback_type: input.feedback_type,
          evaluator_type: input.evaluator_type,
          evaluator_name: input.evaluator_name,
          evaluator_email: input.evaluator_email || null,
          event_date: input.event_date,
          event_name: input.event_name,
        });

      if (feedbackError) throw feedbackError;

      // Insert ratings
      if (input.ratings.length > 0) {
        const { error: ratingsError } = await supabase
          .from("feedback_ratings")
          .insert(
            input.ratings.map((r) => ({
              feedback_id: feedbackId,
              category: r.category,
              score: r.score,
              weight: r.weight || 1.0,
            }))
          );
        if (ratingsError) throw ratingsError;
      }

      // Insert comments
      const validComments = input.comments.filter((c) => c.response.trim());
      if (validComments.length > 0) {
        const { error: commentsError } = await supabase
          .from("feedback_comments")
          .insert(
            validComments.map((c) => ({
              feedback_id: feedbackId,
              question_key: c.question_key,
              response: c.response,
            }))
          );
        if (commentsError) throw commentsError;
      }

      return { id: feedbackId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["employee-feedback-stats"] });
    },
  });
}

export function useFeedbackAdminCheck() {
  return useQuery({
    queryKey: ["feedback-admin-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return false;
      
      const allowedEmails = [
        'shannon@creatempls.org', 
        'michael.jahnl@creatempls.org',
        'shannon@tailoredu.org'
      ];
      return allowedEmails.includes(user.email.toLowerCase());
    },
    staleTime: 5 * 60 * 1000,
  });
}
