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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArchiveOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: {
    id: string;
    name: string;
  } | null;
  onSuccess: () => void;
}

export function ArchiveOpportunityDialog({
  open,
  onOpenChange,
  opportunity,
  onSuccess,
}: ArchiveOpportunityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleArchive = async () => {
    if (!opportunity) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("major_gift_opportunities")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
          archive_reason: reason.trim() || null,
        })
        .eq("id", opportunity.id);

      if (error) throw error;

      toast.success("Opportunity archived successfully");
      setReason("");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error archiving opportunity:", error);
      toast.error("Failed to archive opportunity");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason("");
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            Archive Opportunity
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to archive{" "}
            <span className="font-medium text-foreground">
              "{opportunity?.name}"
            </span>
            ?
            <br />
            <br />
            This will remove it from active pipeline views. You can restore it
            later from the archive.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="archive-reason" className="text-sm text-muted-foreground">
            Reason (optional)
          </Label>
          <Textarea
            id="archive-reason"
            placeholder="e.g., Funder discontinued program, Donor relocated..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            rows={3}
            className="resize-none"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={loading}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
