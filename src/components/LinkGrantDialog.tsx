import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinkGrantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituentId: string;
  onSuccess: () => void;
}

const LinkGrantDialog = ({ open, onOpenChange, constituentId, onSuccess }: LinkGrantDialogProps) => {
  const [grants, setGrants] = useState<any[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      fetchAvailableGrants();
    }
  }, [open, constituentId]);

  const fetchAvailableGrants = async () => {
    // Fetch grants not already linked to this constituent
    const { data: linkedGrants } = await supabase
      .from("constituent_grants")
      .select("grant_opportunity_id")
      .eq("constituent_id", constituentId);

    const linkedIds = linkedGrants?.map(lg => lg.grant_opportunity_id) || [];

    const query = supabase
      .from("grant_opportunities")
      .select("*, organizations(name)")
      .order("title");

    if (linkedIds.length > 0) {
      query.not("id", "in", `(${linkedIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load grants");
    } else {
      setGrants(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrant) {
      toast.error("Please select a grant");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("constituent_grants").insert({
      constituent_id: constituentId,
      grant_opportunity_id: selectedGrant,
      role,
      notes,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to link grant");
    } else {
      toast.success("Grant linked successfully");
      setSelectedGrant("");
      setRole("");
      setNotes("");
      onSuccess();
      onOpenChange(false);
    }
  };

  const filteredGrants = grants.filter(
    (grant) =>
      grant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grant.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Grant Opportunity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="search">Search Grants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title or funder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="grant">Grant Opportunity *</Label>
            <Select value={selectedGrant} onValueChange={setSelectedGrant}>
              <SelectTrigger>
                <SelectValue placeholder="Select a grant" />
              </SelectTrigger>
              <SelectContent>
                {filteredGrants.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    No available grants
                  </div>
                ) : (
                  filteredGrants.map((grant) => (
                    <SelectItem key={grant.id} value={grant.id}>
                      {grant.title} - {grant.organizations?.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="role">Constituent Role</Label>
            <Input
              id="role"
              placeholder="e.g., Primary Contact, Advocate, Supporter"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional context about this relationship..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Grant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkGrantDialog;
