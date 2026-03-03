import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RestoreOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: {
    id: string;
    name: string;
  } | null;
  onSuccess: () => void;
}

export function RestoreOpportunityDialog({
  open,
  onOpenChange,
  opportunity,
  onSuccess,
}: RestoreOpportunityDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    if (!opportunity) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("major_gift_opportunities")
        .update({
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq("id", opportunity.id);

      if (error) throw error;

      toast.success("Opportunity restored to active pipeline");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error restoring opportunity:", error);
      toast.error("Failed to restore opportunity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            Restore Opportunity
          </AlertDialogTitle>
          <AlertDialogDescription>
            Restore{" "}
            <span className="font-medium text-foreground">
              "{opportunity?.name}"
            </span>{" "}
            to the active pipeline?
            <br />
            <br />
            This will make the opportunity visible to all team members again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRestore}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
