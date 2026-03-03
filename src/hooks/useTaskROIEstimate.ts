import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TaskROIEstimate {
  taskId: string;
  roiScore: number;
  potentialValue: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  suggestedPriority: "low" | "medium" | "high" | "urgent";
}

export function useTaskROIEstimate() {
  const [estimates, setEstimates] = useState<Record<string, TaskROIEstimate>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const estimateROI = useCallback(async (options?: { taskIds?: string[]; userId?: string }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("estimate-task-roi", {
        body: { taskIds: options?.taskIds, userId: options?.userId },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "ROI Estimation Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.estimates) {
        const estimateMap: Record<string, TaskROIEstimate> = {};
        data.estimates.forEach((est: TaskROIEstimate) => {
          estimateMap[est.taskId] = est;
        });
        setEstimates(prev => ({ ...prev, ...estimateMap }));
        
        toast({
          title: "ROI Estimates Ready",
          description: `Analyzed ${data.estimates.length} tasks`,
        });
      }
    } catch (err) {
      console.error("ROI estimation error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to estimate ROI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getEstimate = useCallback((taskId: string) => {
    return estimates[taskId];
  }, [estimates]);

  const clearEstimates = useCallback(() => {
    setEstimates({});
  }, []);

  return {
    estimates,
    isLoading,
    estimateROI,
    getEstimate,
    clearEstimates,
  };
}
