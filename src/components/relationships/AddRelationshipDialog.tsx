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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Info } from "lucide-react";
import { ConstituentAutocomplete } from "@/components/soft-credits/ConstituentAutocomplete";
import { useRelationshipTypes, useAddRelationship, CATEGORY_LABELS, CATEGORY_ORDER } from "@/hooks/useRelationships";

interface AddRelationshipDialogProps {
  constituentId: string;
  constituentName: string;
}

export function AddRelationshipDialog({ constituentId, constituentName }: AddRelationshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedConstituentId, setSelectedConstituentId] = useState("");
  const [selectedConstituentName, setSelectedConstituentName] = useState("");
  const [relationshipTypeId, setRelationshipTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState("");
  
  const { data: relationshipTypes } = useRelationshipTypes();
  const addRelationship = useAddRelationship();

  const resetForm = () => {
    setSelectedConstituentId("");
    setSelectedConstituentName("");
    setRelationshipTypeId("");
    setStartDate("");
    setEndDate("");
    setIsPrimary(false);
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConstituentId || !relationshipTypeId) return;
    
    addRelationship.mutate({
      from_constituent_id: constituentId,
      to_constituent_id: selectedConstituentId,
      relationship_type_id: relationshipTypeId,
      start_date: startDate || null,
      end_date: endDate || null,
      is_primary: isPrimary,
      notes: notes || null
    }, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      }
    });
  };

  const selectedType = relationshipTypes?.all.find(t => t.id === relationshipTypeId);
  const isHouseholdType = selectedType?.category === 'household';

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Relationship
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Create a relationship between {constituentName} and another constituent.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Related Constituent *</Label>
            <ConstituentAutocomplete
              value={selectedConstituentId}
              onSelect={(id, constituent) => {
                setSelectedConstituentId(id);
                setSelectedConstituentName(constituent.full_legal_name);
              }}
              excludeIds={[constituentId]}
            />
            {selectedConstituentName && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedConstituentName}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Relationship Type *</Label>
            <Select value={relationshipTypeId} onValueChange={setRelationshipTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map(category => {
                  const types = relationshipTypes?.grouped[category];
                  if (!types || types.length === 0) return null;
                  
                  return (
                    <SelectGroup key={category}>
                      <SelectLabel>{CATEGORY_LABELS[category]}</SelectLabel>
                      {types.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>
          
          {isHouseholdType && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPrimary" 
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked === true)}
              />
              <Label htmlFor="isPrimary" className="text-sm">
                Mark as primary relationship
              </Label>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this relationship..."
              rows={2}
            />
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              A reciprocal relationship will automatically be created. For example, if you add "A is spouse of B", we'll also create "B is spouse of A".
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedConstituentId || !relationshipTypeId || addRelationship.isPending}
            >
              {addRelationship.isPending ? 'Adding...' : 'Add Relationship'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
