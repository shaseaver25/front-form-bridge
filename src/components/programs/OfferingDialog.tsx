import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProgramOffering, useCreateProgramOffering, useUpdateProgramOffering } from "@/hooks/useProgramOfferings";

interface OfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  offering?: ProgramOffering | null;
}

export function OfferingDialog({ open, onOpenChange, programId, offering }: OfferingDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [isActive, setIsActive] = useState(true);

  const createOffering = useCreateProgramOffering();
  const updateOffering = useUpdateProgramOffering();

  useEffect(() => {
    if (offering) {
      setName(offering.name);
      setDescription(offering.description || "");
      setPrice(String(offering.price));
      setCapacity(offering.capacity ? String(offering.capacity) : "");
      setStartDate(offering.start_date || "");
      setEndDate(offering.end_date || "");
      setRegistrationDeadline(offering.registration_deadline || "");
      setLocation(offering.location || "");
      setIsActive(offering.is_active);
    } else {
      setName("");
      setDescription("");
      setPrice("0");
      setCapacity("");
      setStartDate("");
      setEndDate("");
      setRegistrationDeadline("");
      setLocation("");
      setIsActive(true);
    }
  }, [offering, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      program_id: programId,
      name,
      description: description || null,
      price: parseFloat(price) || 0,
      capacity: capacity ? parseInt(capacity) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      registration_deadline: registrationDeadline || null,
      location: location || null,
      is_active: isActive,
    };

    if (offering) {
      await updateOffering.mutateAsync({ id: offering.id, ...data });
    } else {
      await createOffering.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isLoading = createOffering.isPending || updateOffering.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offering ? "Edit Offering" : "Add Offering"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spring 2026 Cohort"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about this offering..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDeadline">Registration Deadline</Label>
            <Input
              id="registrationDeadline"
              type="date"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Room 101 or Online"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || isLoading}>
              {isLoading ? "Saving..." : offering ? "Save Changes" : "Create Offering"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
