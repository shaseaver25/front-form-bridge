import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteForm } from "./SiteForm";
import { useSites } from "@/hooks/useSites";

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: string;
}

export function AddSiteDialog({ open, onOpenChange, defaultStatus }: AddSiteDialogProps) {
  const navigate = useNavigate();
  const { createSite } = useSites();

  const handleSubmit = async (data: any) => {
    const newSite = await createSite.mutateAsync({
      ...data,
      relationship_status: data.relationship_status || defaultStatus || "prospect",
    });
    onOpenChange(false);
    navigate(`/sites/${newSite.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
        </DialogHeader>
        <SiteForm 
          onSubmit={handleSubmit}
          isSubmitting={createSite.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
