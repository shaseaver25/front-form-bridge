import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreateProgram } from "@/hooks/useMissionImpact";
import { Plus } from "lucide-react";

interface AddProgramDialogProps {
  onSuccess?: () => void;
}

export function AddProgramDialog({ onSuccess }: AddProgramDialogProps) {
  const [open, setOpen] = useState(false);
  const createProgram = useCreateProgram();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    program_area: "",
    status: "planning",
    target_population: "",
    geographic_area: "",
    start_date: "",
    annual_budget: "",
  });

  const handleSubmit = () => {
    createProgram.mutate({
      name: formData.name,
      description: formData.description || null,
      program_area: formData.program_area || null,
      status: formData.status,
      target_population: formData.target_population || null,
      geographic_area: formData.geographic_area || null,
      start_date: formData.start_date || null,
      annual_budget: formData.annual_budget ? parseFloat(formData.annual_budget) : null,
    }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: "",
          description: "",
          program_area: "",
          status: "planning",
          target_population: "",
          geographic_area: "",
          start_date: "",
          annual_budget: "",
        });
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Program</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label>Program Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Youth STEM Initiative"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this program do?"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Program Area</Label>
              <Input
                value={formData.program_area}
                onChange={(e) => setFormData({ ...formData, program_area: e.target.value })}
                placeholder="e.g., Education"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Target Population</Label>
            <Input
              value={formData.target_population}
              onChange={(e) => setFormData({ ...formData, target_population: e.target.value })}
              placeholder="e.g., Youth ages 12-18"
            />
          </div>
          <div>
            <Label>Geographic Area</Label>
            <Input
              value={formData.geographic_area}
              onChange={(e) => setFormData({ ...formData, geographic_area: e.target.value })}
              placeholder="e.g., Minneapolis metro area"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Annual Budget</Label>
              <Input
                type="number"
                value={formData.annual_budget}
                onChange={(e) => setFormData({ ...formData, annual_budget: e.target.value })}
                placeholder="e.g., 150000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || createProgram.isPending}>
              Create Program
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
