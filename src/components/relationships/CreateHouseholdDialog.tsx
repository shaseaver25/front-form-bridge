import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Home, X } from "lucide-react";
import { ConstituentAutocomplete } from "@/components/soft-credits/ConstituentAutocomplete";
import { useCreateHousehold } from "@/hooks/useRelationships";

interface Member {
  id: string;
  full_legal_name: string;
}

interface CreateHouseholdDialogProps {
  initialMember?: Member;
}

export function CreateHouseholdDialog({ initialMember }: CreateHouseholdDialogProps) {
  const [open, setOpen] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [householdType, setHouseholdType] = useState<string>("");
  const [greetingFormat, setGreetingFormat] = useState("");
  const [members, setMembers] = useState<Member[]>(initialMember ? [initialMember] : []);
  const [primaryContactId, setPrimaryContactId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [autocompleteKey, setAutocompleteKey] = useState(0);
  
  const createHousehold = useCreateHousehold();

  const resetForm = () => {
    setHouseholdName("");
    setHouseholdType("");
    setGreetingFormat("");
    setMembers(initialMember ? [initialMember] : []);
    setPrimaryContactId("");
    setNotes("");
    setAutocompleteKey(k => k + 1);
  };

  const handleAddMember = (id: string, constituent: { id: string; full_legal_name: string }) => {
    if (!members.find(m => m.id === id)) {
      setMembers([...members, { id, full_legal_name: constituent.full_legal_name }]);
      setAutocompleteKey(k => k + 1); // Reset autocomplete
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
    if (primaryContactId === memberId) {
      setPrimaryContactId("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!householdName || !householdType || members.length === 0) return;
    
    createHousehold.mutate({
      household_name: householdName,
      household_type: householdType,
      greeting_format: greetingFormat || undefined,
      member_ids: members.map(m => m.id),
      primary_contact_id: primaryContactId || undefined,
      notes: notes || undefined
    }, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Home className="h-4 w-4 mr-2" />
          Create Household
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Household</DialogTitle>
          <DialogDescription>
            Group constituents into a household for combined giving recognition.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Household Name *</Label>
            <Input 
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g., The Smith Family, John & Jane Doe"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Household Type *</Label>
            <Select value={householdType} onValueChange={setHouseholdType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="couple">Couple</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Members</Label>
            <ConstituentAutocomplete
              key={autocompleteKey}
              value=""
              onSelect={handleAddMember}
              excludeIds={members.map(m => m.id)}
            />
            
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {members.map(member => (
                  <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                    {member.full_legal_name}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <Select value={primaryContactId} onValueChange={setPrimaryContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary contact" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Greeting Format</Label>
            <Input 
              value={greetingFormat}
              onChange={(e) => setGreetingFormat(e.target.value)}
              placeholder='e.g., "Mr. and Mrs. Smith"'
            />
          </div>
          
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!householdName || !householdType || members.length === 0 || createHousehold.isPending}
            >
              {createHousehold.isPending ? 'Creating...' : 'Create Household'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
