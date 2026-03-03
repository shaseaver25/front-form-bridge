import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Users,
  Eye,
  Monitor,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { EmailContentEditor } from "@/components/email-campaigns/EmailContentEditor";
import { ManualRecipientSelector } from "@/components/email-campaigns/ManualRecipientSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Client-side merge field replacement for preview
function applyMergeFields(
  html: string,
  contact: {
    first_name?: string | null;
    last_name?: string | null;
    full_legal_name?: string | null;
    primary_email?: string | null;
    total_lifetime_giving?: number | null;
    giving_level?: string | null;
    last_gift_amount?: number | null;
    last_gift_date?: string | null;
  }
): string {
  const year = new Date().getFullYear().toString();
  return html
    .replace(/\{\{first_name\}\}/g, contact.first_name || "Friend")
    .replace(/\{\{last_name\}\}/g, contact.last_name || "")
    .replace(/\{\{full_name\}\}/g, contact.full_legal_name || "Friend")
    .replace(/\{\{email\}\}/g, contact.primary_email || "")
    .replace(
      /\{\{total_giving\}\}/g,
      contact.total_lifetime_giving
        ? `$${Number(contact.total_lifetime_giving).toLocaleString()}`
        : ""
    )
    .replace(/\{\{giving_level\}\}/g, contact.giving_level || "")
    .replace(
      /\{\{last_gift_amount\}\}/g,
      contact.last_gift_amount ? `$${Number(contact.last_gift_amount).toLocaleString()}` : ""
    )
    .replace(/\{\{last_gift_date\}\}/g, contact.last_gift_date || "")
    .replace(/\{\{current_year\}\}/g, year)
    .replace(/\{\{org_name\}\}/g, "createMPLS");
}

export default function CampaignComposer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [previewContactId, setPreviewContactId] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load existing campaign when editing
  const { data: existingCampaign, isLoading: loadingCampaign } = useQuery({
    queryKey: ["campaign-composer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingCampaign) {
      setName(existingCampaign.name ?? "");
      setSubject(existingCampaign.subject_line ?? "");
      setHtmlBody(existingCampaign.content_html ?? "");
      setRecipientIds(existingCampaign.constituent_list ?? []);
    }
  }, [existingCampaign]);

  // Load a sample constituent for preview
  const { data: previewContacts } = useQuery({
    queryKey: ["preview-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("constituents")
        .select(
          "id, first_name, last_name, full_legal_name, primary_email, total_lifetime_giving, giving_level, last_gift_amount, last_gift_date"
        )
        .not("primary_email", "is", null)
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const previewContact =
    previewContacts?.find((c) => c.id === previewContactId) ?? previewContacts?.[0];
  const mergedHtml = previewContact ? applyMergeFields(htmlBody, previewContact) : htmlBody;

  const handleRecipientCountChange = useCallback((_count: number) => {}, []);

  const saveDraft = async (): Promise<string | null> => {
    if (!name.trim()) {
      toast.error("Please enter a campaign name");
      return null;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject line");
      return null;
    }

    setIsSaving(true);
    try {
      if (isEditMode && id) {
        const { error } = await supabase
          .from("email_campaigns")
          .update({
            name: name.trim(),
            subject_line: subject.trim(),
            content_html: htmlBody,
            constituent_list: recipientIds.length > 0 ? recipientIds : null,
            total_recipients: recipientIds.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["campaign-composer", id] });
        queryClient.invalidateQueries({ queryKey: ["campaigns-dashboard"] });
        toast.success("Campaign saved");
        return id;
      } else {
        const { data, error } = await supabase
          .from("email_campaigns")
          .insert({
            name: name.trim(),
            subject_line: subject.trim(),
            content_html: htmlBody,
            constituent_list: recipientIds.length > 0 ? recipientIds : null,
            total_recipients: recipientIds.length,
            status: "draft",
            segment_type: "manual",
          })
          .select()
          .single();
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["campaigns-dashboard"] });
        toast.success("Draft saved");
        // Navigate to edit URL so we stay in sync
        navigate(`/campaigns/${data.id}`, { replace: true });
        return data.id;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (recipientIds.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setIsSending(true);
    try {
      // Save first to ensure latest content is persisted
      const campaignId = await saveDraft();
      if (!campaignId) {
        setIsSending(false);
        return;
      }

      // Mark as sending then invoke edge function
      const { error: statusError } = await supabase
        .from("email_campaigns")
        .update({ status: "sending" })
        .eq("id", campaignId);
      if (statusError) throw statusError;

      const { error } = await supabase.functions.invoke("send-email-campaign", {
        body: { campaignId },
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["campaigns-dashboard"] });
      toast.success("Campaign is sending");
      navigate("/campaigns");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send campaign";
      toast.error(message);
      // Revert status back to draft on failure
      if (id) {
        await supabase.from("email_campaigns").update({ status: "draft" }).eq("id", id);
      }
    } finally {
      setIsSending(false);
      setShowSendDialog(false);
    }
  };

  if (isEditMode && loadingCampaign) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/campaigns")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEditMode ? "Edit Campaign" : "New Campaign"}
              </h1>
              <p className="text-muted-foreground text-sm">
                Compose, preview with real contact data, and send
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveDraft} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => setShowSendDialog(true)}
              disabled={isSaving || isSending || !name || !subject || !htmlBody}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Compose */}
          <div className="xl:col-span-2 space-y-4">
            {/* Campaign metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g. Fall Appeal 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal name — not visible to recipients
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject-line">Subject Line</Label>
                  <Input
                    id="subject-line"
                    placeholder="e.g. {{first_name}}, your support makes a difference"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use merge fields like{" "}
                    <code className="bg-muted px-1 rounded text-xs">{"{{first_name}}"}</code> to
                    personalize
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email body */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Email Body</CardTitle>
              </CardHeader>
              <CardContent>
                <EmailContentEditor htmlContent={htmlBody} onHtmlChange={setHtmlBody} />
              </CardContent>
            </Card>

            {/* Recipients */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Recipients
                  </CardTitle>
                  {recipientIds.length > 0 && (
                    <Badge variant="secondary">{recipientIds.length} selected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ManualRecipientSelector
                  selectedIds={recipientIds}
                  onSelectionChange={setRecipientIds}
                  onRecipientCountChange={handleRecipientCountChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Live Preview
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={previewMode === "desktop" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPreviewMode("desktop")}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPreviewMode("mobile")}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Contact selector for preview */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Preview as contact
                  </Label>
                  <Select
                    value={previewContactId || (previewContacts?.[0]?.id ?? "")}
                    onValueChange={setPreviewContactId}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select a contact..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(previewContacts ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_legal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {previewContact && (
                    <p className="text-xs text-muted-foreground">{previewContact.primary_email}</p>
                  )}
                </div>

                <Separator />

                {/* Subject preview */}
                {subject && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                    <p className="text-sm font-medium">
                      {previewContact ? applyMergeFields(subject, previewContact) : subject}
                    </p>
                  </div>
                )}

                {/* HTML preview frame */}
                {htmlBody ? (
                  <div
                    className={`border rounded overflow-hidden ${
                      previewMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full"
                    }`}
                  >
                    <iframe
                      srcDoc={mergedHtml}
                      title="Email preview"
                      className="w-full"
                      style={{ height: "480px", border: "none" }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="border rounded flex items-center justify-center h-48 text-muted-foreground text-sm">
                    Start writing your email to see a preview
                  </div>
                )}

                {/* Merge field reference */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Available merge fields</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "{{first_name}}",
                      "{{last_name}}",
                      "{{full_name}}",
                      "{{email}}",
                      "{{total_giving}}",
                      "{{giving_level}}",
                      "{{last_gift_amount}}",
                      "{{last_gift_date}}",
                      "{{current_year}}",
                      "{{org_name}}",
                    ].map((tag) => (
                      <code
                        key={tag}
                        className="text-[10px] bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/10"
                        onClick={() => {
                          const input = document.getElementById(
                            "subject-line"
                          ) as HTMLInputElement | null;
                          if (input && document.activeElement === input) {
                            const start = input.selectionStart ?? subject.length;
                            const end = input.selectionEnd ?? subject.length;
                            setSubject(subject.slice(0, start) + tag + subject.slice(end));
                          } else {
                            // Append to body as fallback
                            setHtmlBody((prev) => prev + tag);
                          }
                        }}
                      >
                        {tag}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Send confirmation dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send <strong>"{subject}"</strong> to{" "}
              <strong>
                {recipientIds.length} recipient{recipientIds.length !== 1 ? "s" : ""}
              </strong>{" "}
              immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
