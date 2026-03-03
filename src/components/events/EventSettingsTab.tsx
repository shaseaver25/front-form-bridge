import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Event, useUpdateEvent } from "@/hooks/useEventRegistrations";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface EventSettingsTabProps {
  event: Event;
}

const eventTypes = [
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "networking", label: "Networking" },
  { value: "webinar", label: "Webinar" },
  { value: "other", label: "Other" },
];

// Helper to format date for datetime-local input
const formatForInput = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
};

export function EventSettingsTab({ event }: EventSettingsTabProps) {
  const navigate = useNavigate();
  const updateEvent = useUpdateEvent();

  const getLocationType = () => {
    if (event.is_virtual && event.location) return "hybrid";
    if (event.is_virtual) return "virtual";
    return "in-person";
  };

  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description || "",
    event_type: event.event_type || "workshop",
    start_date: formatForInput(event.start_date),
    end_date: formatForInput(event.end_date),
    location_type: getLocationType(),
    location: event.location || "",
    address: event.address || "",
    city: event.city || "",
    state: event.state || "",
    zip: event.zip || "",
    virtual_url: event.virtual_url || "",
    capacity: event.capacity?.toString() || "",
    status: event.status,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Event name is required");
      return;
    }

    try {
      await updateEvent.mutateAsync({
        id: event.id,
        name: formData.name,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_virtual: formData.location_type !== "in-person",
        location: formData.location_type !== "virtual" ? formData.location || null : null,
        address: formData.location_type !== "virtual" ? formData.address || null : null,
        city: formData.location_type !== "virtual" ? formData.city || null : null,
        state: formData.location_type !== "virtual" ? formData.state || null : null,
        zip: formData.location_type !== "virtual" ? formData.zip || null : null,
        virtual_url: formData.location_type !== "in-person" ? formData.virtual_url || null : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        status: formData.status,
      });
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleCancelEvent = async () => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        status: "cancelled",
      });
      toast.success("Event cancelled");
      navigate("/events");
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast.error("Failed to cancel event");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Update your event information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
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
                />
              </div>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (leave empty for unlimited)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => updateField("capacity", e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button onClick={handleSave} disabled={updateEvent.isPending}>
              {updateEvent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {event.status !== "cancelled" && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Cancel Event</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the event as cancelled. Registrants will need to be notified separately.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Event</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelEvent}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Cancel Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
