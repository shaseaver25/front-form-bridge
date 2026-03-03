import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddSiteContactDialogProps {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSiteContactDialog({ siteId, open, onOpenChange }: AddSiteContactDialogProps) {
  const queryClient = useQueryClient();
  const [constituentId, setConstituentId] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [search, setSearch] = useState("");

  const { data: constituents } = useQuery({
    queryKey: ["constituents-search", search],
    queryFn: async () => {
      let query = supabase
        .from("constituents")
        .select("id, full_legal_name, first_name, last_name, primary_email")
        .order("full_legal_name")
        .limit(20);

      if (search) {
        query = query.or(`full_legal_name.ilike.%${search}%,primary_email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_contacts")
        .insert({
          site_id: siteId,
          constituent_id: constituentId,
          role,
          is_primary: isPrimary,
          is_decision_maker: isDecisionMaker,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-contacts", siteId] });
      toast.success("Contact added");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes("duplicate")) {
        toast.error("This contact is already linked to this site");
      } else {
        toast.error("Failed to add contact");
      }
    },
  });

  const resetForm = () => {
    setConstituentId("");
    setRole("");
    setIsPrimary(false);
    setIsDecisionMaker(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contact to Site</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Constituents</Label>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Contact</Label>
            <Select value={constituentId} onValueChange={setConstituentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {constituents?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.primary_email ? `(${c.primary_email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role at Organization</Label>
            <Input
              placeholder="e.g., Principal, Curriculum Director"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Primary Contact</Label>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Decision Maker</Label>
            <Switch checked={isDecisionMaker} onCheckedChange={setIsDecisionMaker} />
          </div>

          <Button
            className="w-full"
            onClick={() => addContact.mutate()}
            disabled={!constituentId || addContact.isPending}
          >
            {addContact.isPending ? "Adding..." : "Add Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
