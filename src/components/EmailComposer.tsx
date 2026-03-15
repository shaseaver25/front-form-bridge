import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Mail } from "lucide-react";
import { appendUnsubscribeFooter } from "@/lib/emailFooter";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituentId: string;
  constituentEmail: string;
  constituentName: string;
  onSuccess: () => void;
}

const EmailComposer = ({
  open,
  onOpenChange,
  constituentId,
  constituentEmail,
  constituentName,
  onSuccess,
}: EmailComposerProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const finalBody = appendUnsubscribeFooter(formData.body, constituentId);

      const { data, error } = await supabase.functions.invoke("send-constituent-email", {
        body: {
          constituentId,
          constituentEmail,
          constituentName,
          subject: formData.subject,
          body: finalBody,
        },
      });

      if (error) throw error;

      toast.success("Email sent and logged successfully");
      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        subject: "",
        body: "",
      });
    } catch (error: unknown) {
      console.error("Error sending email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleFormatText = (format: "bold" | "italic" | "link") => {
    const textarea = document.getElementById("email-body") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.body.substring(start, end);

    let formattedText = "";
    let newCursorPos = start;

    switch (format) {
      case "bold": {
        formattedText = `<strong>${selectedText}</strong>`;
        newCursorPos = start + 8; // Position after <strong>
        break;
      }
      case "italic": {
        formattedText = `<em>${selectedText}</em>`;
        newCursorPos = start + 4; // Position after <em>
        break;
      }
      case "link": {
        const url = prompt("Enter URL:");
        if (url) {
          formattedText = `<a href="${url}">${selectedText || url}</a>`;
          newCursorPos = start + 9 + url.length; // Position after href="url">
        } else {
          return;
        }
        break;
      }
    }

    const newBody = formData.body.substring(0, start) + formattedText + formData.body.substring(end);

    setFormData({ ...formData, body: newBody });

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {constituentName}. This will be automatically logged in their activity timeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" value={constituentEmail} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={loading}
              placeholder="Follow-up on recent donation"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body">
                Message <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("bold")}
                  disabled={loading}
                  title="Bold"
                >
                  <strong>B</strong>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("italic")}
                  disabled={loading}
                  title="Italic"
                >
                  <em>I</em>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("link")}
                  disabled={loading}
                  title="Insert Link"
                >
                  🔗
                </Button>
              </div>
            </div>
            <Textarea
              id="email-body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
              disabled={loading}
              placeholder="Write your message here... You can use HTML formatting."
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supports HTML formatting. Selected text can be formatted using the buttons above.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposer;
