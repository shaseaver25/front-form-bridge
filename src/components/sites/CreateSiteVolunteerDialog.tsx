import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { addDays, addWeeks, addMonths, format } from "date-fns";

interface CreateSiteVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
}

const recurrenceOptions = [
  { value: "none", label: "No Repeat" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

export function CreateSiteVolunteerDialog({
  open,
  onOpenChange,
  siteId,
  siteName,
}: CreateSiteVolunteerDialogProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "workshop",
    start_date: "",
    end_date: "",
    location: "",
    max_volunteers: "",
    recurrence: "none",
    recurrence_end_date: "",
    public_signup_enabled: true,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const createEvents = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be logged in");

      const baseEvent = {
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date || null,
        location: form.location || null,
        max_volunteers: form.max_volunteers ? parseInt(form.max_volunteers) : null,
        public_signup_enabled: form.public_signup_enabled,
        status: "open",
        site_id: siteId,
        is_active: true,
        created_by: userId,
        recurrence_rule: form.recurrence !== "none" ? form.recurrence : null,
        recurrence_end_date: form.recurrence_end_date || null,
      };

      // Insert the parent event
      const { data: parent, error: parentErr } = await supabase
        .from("volunteer_events")
        .insert(baseEvent as any)
        .select("id")
        .single();
      if (parentErr) throw parentErr;

      // Generate recurring events if applicable
      if (form.recurrence !== "none" && form.recurrence_end_date) {
        const recurrenceEnd = new Date(form.recurrence_end_date);
        const startDate = new Date(form.start_date);
        const endDate = form.end_date ? new Date(form.end_date) : null;
        const duration = endDate ? endDate.getTime() - startDate.getTime() : 0;

        const advanceFn =
          form.recurrence === "weekly"
            ? (d: Date) => addWeeks(d, 1)
            : form.recurrence === "biweekly"
              ? (d: Date) => addWeeks(d, 2)
              : (d: Date) => addMonths(d, 1);

        const childEvents: Record<string, unknown>[] = [];
        let nextStart = advanceFn(startDate);

        while (nextStart <= recurrenceEnd) {
          const nextEnd = endDate ? new Date(nextStart.getTime() + duration) : null;
          childEvents.push({
            ...baseEvent,
            start_date: nextStart.toISOString(),
            end_date: nextEnd?.toISOString() ?? null,
            parent_event_id: parent.id,
            recurrence_rule: null, // children don't recur
          });
          nextStart = advanceFn(nextStart);
        }

        if (childEvents.length > 0) {
          const { error: childErr } = await supabase
            .from("volunteer_events")
            .insert(childEvents as any);
          if (childErr) throw childErr;
        }

        return { count: 1 + childEvents.length };
      }

      return { count: 1 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["site-volunteer-events", siteId] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-events"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-opportunities"] });
      toast.success(
        result.count > 1
          ? `Created ${result.count} volunteer events (recurring)`
          : "Volunteer opportunity created"
      );
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error("Failed to create: " + err.message);
    },
  });

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      event_type: "workshop",
      start_date: "",
      end_date: "",
      location: "",
      max_volunteers: "",
      recurrence: "none",
      recurrence_end_date: "",
      public_signup_enabled: true,
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvents.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Volunteer Opportunity</DialogTitle>
          <DialogDescription>
            Add a volunteer opportunity at {siteName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vol-title">Title *</Label>
            <Input
              id="vol-title"
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g., After-School Mentoring"
            />
          </div>

          <div>
            <Label htmlFor="vol-desc">Description</Label>
            <Textarea
              id="vol-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the opportunity..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vol-type">Type</Label>
              <Select
                value={form.event_type}
                onValueChange={(v) => update("event_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buildathon">Buildathon</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="mentoring">Mentoring</SelectItem>
                  <SelectItem value="community_service">Community Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vol-max">Max Volunteers</Label>
              <Input
                id="vol-max"
                type="number"
                min="1"
                value={form.max_volunteers}
                onChange={(e) => update("max_volunteers", e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vol-start">Start Date & Time *</Label>
              <Input
                id="vol-start"
                type="datetime-local"
                required
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vol-end">End Date & Time</Label>
              <Input
                id="vol-end"
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => update("end_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vol-location">Location</Label>
            <Input
              id="vol-location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g., Room 204, Main Building"
            />
          </div>

          {/* Recurrence */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold">Repeat Schedule</Label>
            <Select
              value={form.recurrence}
              onValueChange={(v) => update("recurrence", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.recurrence !== "none" && (
              <div>
                <Label htmlFor="vol-recur-end">Repeat Until *</Label>
                <Input
                  id="vol-recur-end"
                  type="date"
                  required
                  value={form.recurrence_end_date}
                  onChange={(e) => update("recurrence_end_date", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Individual events will be created for each occurrence
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="vol-public"
              checked={form.public_signup_enabled}
              onCheckedChange={(c) => update("public_signup_enabled", c as boolean)}
            />
            <Label htmlFor="vol-public" className="cursor-pointer text-sm">
              Enable public sign-up
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createEvents.isPending}>
              {createEvents.isPending
                ? "Creating..."
                : form.recurrence !== "none"
                  ? "Create Recurring Events"
                  : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
