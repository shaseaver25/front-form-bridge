import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const activityTypes = [
  { value: "email_sent", label: "Email Sent" },
  { value: "call", label: "Phone Call" },
  { value: "meeting", label: "Meeting" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "site_visit", label: "Site Visit" },
  { value: "event", label: "Event" },
  { value: "note", label: "Note" },
];

const outcomes = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
  { value: "pending", label: "Pending" },
];

interface AddActivityDialogProps {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddActivityDialog({ siteId, open, onOpenChange }: AddActivityDialogProps) {
  const queryClient = useQueryClient();
  const [activityType, setActivityType] = useState("note");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [constituentId, setConstituentId] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: contacts } = useQuery({
    queryKey: ["site-contacts", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_contacts")
        .select(`
          constituent_id,
          constituent:constituents(id, first_name, last_name)
        `)
        .eq("site_id", siteId);

      if (error) throw error;
      return data;
    },
  });

  const addActivity = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("site_activities")
        .insert({
          site_id: siteId,
          activity_type: activityType,
          subject: subject || null,
          description: description || null,
          outcome: outcome || null,
          constituent_id: constituentId || null,
          follow_up_date: followUpDate || null,
          activity_date: activityDate,
          user_id: user.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-activities", siteId] });
      toast.success("Activity logged");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to log activity");
    },
  });

  const resetForm = () => {
    setActivityType("note");
    setSubject("");
    setDescription("");
    setOutcome("");
    setConstituentId("");
    setFollowUpDate("");
    setActivityDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Brief subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Details about the interaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {outcomes.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Involved</Label>
              <Select value={constituentId} onValueChange={setConstituentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((c: any) => (
                    <SelectItem key={c.constituent_id} value={c.constituent_id}>
                      {c.constituent?.first_name} {c.constituent?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Follow-up Date (optional)</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => addActivity.mutate()}
            disabled={addActivity.isPending}
          >
            {addActivity.isPending ? "Saving..." : "Log Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
