import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAttributeOutcome, useTaskDetail } from "@/hooks/useUnifiedTasks";
import { useToast } from "@/hooks/use-toast";
import { outcomeTypes } from "@/types/unified-tasks";
import type { TaskOutcomeType } from "@/types/unified-tasks";

interface OutcomeAttributionDialogProps {
  taskId: string | null;
  onClose: () => void;
}

export function OutcomeAttributionDialog({ taskId, onClose }: OutcomeAttributionDialogProps) {
  const [outcomeType, setOutcomeType] = useState<TaskOutcomeType | "">("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedRecordId, setLinkedRecordId] = useState("");
  
  const { data: task } = useTaskDetail(taskId);
  const attributeOutcome = useAttributeOutcome();
  const { toast } = useToast();

  // Fetch potential linked records based on outcome type
  const { data: linkedOptions } = useQuery({
    queryKey: ["outcome-options", outcomeType, task?.constituent_id, task?.grant_opportunity_id],
    queryFn: async () => {
      if (!outcomeType) return [];
      
      if (outcomeType === "placement_made" && task?.grant_opportunity_id) {
        const { data } = await supabase
          .from("crm_placements")
          .select("id, fee_amount, placement_date")
          .order("placement_date", { ascending: false })
          .limit(10);
        return (data || []).map((p) => ({
          id: p.id,
          label: `$${p.fee_amount || 0} on ${p.placement_date ? new Date(p.placement_date).toLocaleDateString() : "N/A"}`,
        }));
      }
      
      if (outcomeType === "candidate_submitted" && task?.grant_opportunity_id) {
        const { data } = await supabase
          .from("crm_jobs")
          .select("id, name")
          .eq("id", task.grant_opportunity_id)
          .maybeSingle();
        return data ? [{
          id: data.id,
          label: data.name,
        }] : [];
      }
      
      return [];
    },
    enabled: !!outcomeType && !!task,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeType || !taskId) return;

    try {
      await attributeOutcome.mutateAsync({
        taskId,
        outcomeType,
        outcomeId: linkedRecordId || undefined,
        outcomeAmount: amount ? parseFloat(amount) : undefined,
        notes: notes.trim() || undefined,
      });
      
      toast({ title: "Outcome attributed successfully" });
      onClose();
      resetForm();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const resetForm = () => {
    setOutcomeType("");
    setAmount("");
    setNotes("");
    setLinkedRecordId("");
  };

  return (
    <Dialog open={!!taskId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Attribute Outcome</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Outcome Type *</Label>
            <Select value={outcomeType} onValueChange={(v) => setOutcomeType(v as TaskOutcomeType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome type" />
              </SelectTrigger>
              <SelectContent>
                {outcomeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {linkedOptions && linkedOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Record</Label>
              <Select value={linkedRecordId} onValueChange={setLinkedRecordId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select record" />
                </SelectTrigger>
                <SelectContent>
                  {linkedOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Outcome Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context about this outcome..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!outcomeType || attributeOutcome.isPending}>
              {attributeOutcome.isPending ? "Saving..." : "Save Outcome"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
