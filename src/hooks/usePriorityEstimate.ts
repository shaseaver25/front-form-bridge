import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PriorityEstimate } from "@/types/priority-types";

export function usePriorityEstimate() {
  const [estimates, setEstimates] = useState<Record<string, PriorityEstimate>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const estimatePriority = useCallback(async (options?: { 
    taskIds?: string[]; 
    userId?: string;
    organizationType?: 'nonprofit' | 'for_profit';
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("estimate-task-priority", {
        body: { 
          taskIds: options?.taskIds, 
          userId: options?.userId,
          organizationType: options?.organizationType 
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Priority Estimation Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.estimates) {
        const estimateMap: Record<string, PriorityEstimate> = {};
        data.estimates.forEach((est: PriorityEstimate) => {
          estimateMap[est.taskId] = est;
        });
        setEstimates(prev => ({ ...prev, ...estimateMap }));
        
        toast({
          title: "Priority Estimates Ready",
          description: `Analyzed ${data.estimates.length} tasks`,
        });
      }
    } catch (err) {
      console.error("Priority estimation error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to estimate priority",
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
    estimatePriority,
    getEstimate,
    clearEstimates,
  };
}
