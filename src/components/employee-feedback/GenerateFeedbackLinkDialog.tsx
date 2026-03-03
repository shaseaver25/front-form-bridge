import { useState } from "react";
import { Copy, Check, Link2, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { PoolMember } from "@/hooks/usePoolMembers";
import type { FeedbackType } from "@/types/employee-feedback";

interface GenerateFeedbackLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolMembers: PoolMember[];
}

export function GenerateFeedbackLinkDialog({
  open,
  onOpenChange,
  poolMembers,
}: GenerateFeedbackLinkDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("speaker");
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const feedbackLink = selectedEmployee
    ? `${baseUrl}/feedback/${feedbackType}/${selectedEmployee}`
    : "";

  const handleCopy = async () => {
    if (!feedbackLink) return;
    await navigator.clipboard.writeText(feedbackLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMember = poolMembers.find((m) => m.id === selectedEmployee);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Generate Feedback Link
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {poolMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Feedback Type</Label>
            <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as FeedbackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speaker">Speaker</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedEmployee && (
            <>
              <div className="space-y-2">
                <Label>Generated Link</Label>
                <div className="flex gap-2">
                  <Input value={feedbackLink} readOnly className="text-sm" />
                  <Button size="icon" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this link with evaluators to collect feedback for:
                </p>
                <p className="font-medium">
                  {selectedMember?.first_name} {selectedMember?.last_name}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {feedbackType} Evaluation
                </p>
              </div>

              <Button variant="outline" className="w-full" disabled>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code (Coming Soon)
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
