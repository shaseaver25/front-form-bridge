import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { appendUnsubscribeFooter } from "@/lib/emailFooter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, RefreshCw, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituentId?: string;
  constituentEmail?: string;
  constituentName?: string;
  onSuccess?: () => void;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  constituentId,
  constituentEmail,
  constituentName,
  onSuccess,
}: EmailComposeDialogProps) {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    recipient_email: constituentEmail || "",
    recipient_name: constituentName || "",
    subject: "",
    body_html: "",
    template_id: "",
  });

  // Fetch available templates
  const { data: templates } = useQuery({
    queryKey: ["email-templates-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("id, name, subject_line, html_content, category")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Update recipient info when props change
  useState(() => {
    if (constituentEmail) {
      setFormData(prev => ({
        ...prev,
        recipient_email: constituentEmail,
        recipient_name: constituentName || "",
      }));
    }
  });

  function handleTemplateSelect(templateId: string) {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      // Replace basic merge fields
      let subject = template.subject_line || "";
      let body = template.html_content || "";
      
      const firstName = constituentName?.split(" ")[0] || "";
      const mergeData: Record<string, string> = {
        recipient_name: constituentName || "",
        recipient_first_name: firstName,
        recipient_email: constituentEmail || "",
        organization_name: "createMPLS",
        current_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        current_year: new Date().getFullYear().toString(),
      };

      for (const [key, value] of Object.entries(mergeData)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
        subject = subject.replace(pattern, value);
        body = body.replace(pattern, value);
      }

      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        subject,
        body_html: body,
      }));
    }
  }

  async function handleSend() {
    if (!formData.recipient_email || !formData.subject || !formData.body_html) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-microsoft-email", {
        body: {
          recipient_email: formData.recipient_email,
          recipient_name: formData.recipient_name,
          subject: formData.subject,
          body_html: formData.body_html,
          body_text: formData.body_html.replace(/<[^>]*>/g, ""),
          category: "stewardship",
          constituent_id: constituentId,
          template_id: formData.template_id || undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Email sent successfully");
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setFormData({
          recipient_email: constituentEmail || "",
          recipient_name: constituentName || "",
          subject: "",
          body_html: "",
          template_id: "",
        });
      } else {
        throw new Error(data?.error || "Failed to send email");
      }
    } catch (error: unknown) {
      console.error("Send email error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  async function handleSchedule() {
    // For now, just queue it for immediate send
    // In future, add date picker
    toast.info("Scheduling feature coming soon. Sending now instead.");
    await handleSend();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send a personalized email to this constituent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Recipient Name</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient_email">Email Address *</Label>
              <Input
                id="recipient_email"
                type="email"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select value={formData.template_id} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={formData.body_html.replace(/<[^>]*>/g, "")}
              onChange={(e) => setFormData({ ...formData, body_html: `<p>${e.target.value.replace(/\n/g, "</p><p>")}</p>` })}
              placeholder="Write your message..."
              className="min-h-[200px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Basic formatting will be applied automatically.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSchedule} disabled={sending}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
