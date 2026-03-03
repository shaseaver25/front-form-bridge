import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateEvent } from "@/hooks/useEventRegistrations";
import { toast } from "sonner";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventTypes = [
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "networking", label: "Networking" },
  { value: "webinar", label: "Webinar" },
  { value: "other", label: "Other" },
];

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_type: "workshop",
    start_date: "",
    end_date: "",
    location_type: "in-person",
    location: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    virtual_url: "",
    capacity: "",
    registration_deadline: "",
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Event name is required");
      return;
    }

    try {
      const eventData = {
        name: formData.name,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_virtual: formData.location_type === "virtual",
        location: formData.location_type !== "virtual" ? formData.location || null : null,
        address: formData.location_type !== "virtual" ? formData.address || null : null,
        city: formData.location_type !== "virtual" ? formData.city || null : null,
        state: formData.location_type !== "virtual" ? formData.state || null : null,
        zip: formData.location_type !== "virtual" ? formData.zip || null : null,
        virtual_url: formData.location_type !== "in-person" ? formData.virtual_url || null : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        status: formData.status,
        hero_image_url: null,
        organizer_id: null,
      };

      const newEvent = await createEvent.mutateAsync(eventData);
      toast.success("Event created successfully");
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        event_type: "workshop",
        start_date: "",
        end_date: "",
        location_type: "in-person",
        location: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        virtual_url: "",
        capacity: "",
        registration_deadline: "",
        status: "draft",
      });
      
      // Navigate to the new event
      navigate(`/events/${newEvent.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Annual Gala 2026"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Event description..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(v) => updateField("event_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Date & Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Location</h3>
            
            <RadioGroup
              value={formData.location_type}
              onValueChange={(v) => updateField("location_type", v)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <Label htmlFor="in-person" className="font-normal cursor-pointer">In-Person</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="virtual" id="virtual" />
                <Label htmlFor="virtual" className="font-normal cursor-pointer">Virtual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid" className="font-normal cursor-pointer">Hybrid</Label>
              </div>
            </RadioGroup>

            {formData.location_type !== "virtual" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Venue Name</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="Grand Ballroom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => updateField("zip", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.location_type !== "in-person" && (
              <div className="space-y-2">
                <Label htmlFor="virtual_url">Virtual Meeting URL</Label>
                <Input
                  id="virtual_url"
                  type="url"
                  value={formData.virtual_url}
                  onChange={(e) => updateField("virtual_url", e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}
          </div>

          {/* Capacity & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
