import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Loader2, Eye, ScanText } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ResumeParseDialog, type ResumeParseSource } from "@/components/contact/ResumeParseDialog";
import { canParseResume } from "@/lib/resumeParsing";

interface ContactResumesProps {
  contactId: string;
  onContactUpdated?: () => void;
}

interface ResumeDoc {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string | null;
  crelate_id: string | null;
}

function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    txt: "text/plain",
  };
  return map[ext] || "application/octet-stream";
}

const isPdf = (doc: ResumeDoc) => {
  const ext = doc.file_name.split(".").pop()?.toLowerCase() || "";
  const mime = doc.file_type || "";
  return mime.includes("pdf") || ext === "pdf";
};

const isImage = (doc: ResumeDoc) => {
  const ext = doc.file_name.split(".").pop()?.toLowerCase() || "";
  const mime = doc.file_type || "";
  return mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
};

const canPreviewInline = (doc: ResumeDoc) => isPdf(doc) || isImage(doc);

const ContactResumes = ({ contactId, onContactUpdated }: ContactResumesProps) => {
  const [parseDocument, setParseDocument] = useState<ResumeParseSource | null>(null);
  const [resumes, setResumes] = useState<ResumeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<ResumeDoc | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      const syncedDocsRes = await supabase
        .from("crm_contact_documents")
        .select("id,file_name,file_url,file_type,file_size_bytes,created_at,crelate_id")
        .eq("contact_id", contactId)
        .not("crelate_id", "is", null);

      let attachmentsRes = await supabase
        .from("crm_attachments")
        .select("id,file_name,storage_path,content_type,content_length,created_at,crelate_id")
        .eq("contact_id", contactId)
        .or("is_document.eq.true,is_primary_doc.eq.true,attachment_type.ilike.%resume%,file_name.ilike.%resume%")
        .not("storage_path", "is", null);

      const syncedDocs: ResumeDoc[] = (syncedDocsRes.data || []).map((doc: any) => ({
        id: `doc-${doc.id}`,
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_type: doc.file_type,
        file_size_bytes: doc.file_size_bytes,
        created_at: doc.created_at,
        crelate_id: doc.crelate_id,
      }));

      const attachmentDocs: ResumeDoc[] = (attachmentsRes.data || []).map((att: any) => ({
        id: `att-${att.id}`,
        file_name: att.file_name,
        file_url: att.storage_path,
        file_type: att.content_type,
        file_size_bytes: att.content_length,
        created_at: att.created_at,
        crelate_id: att.crelate_id,
      }));

      const deduped = new Map<string, ResumeDoc>();
      [...syncedDocs, ...attachmentDocs].forEach((doc) => {
        const key = `${doc.file_url}::${doc.file_name}`;
        if (!deduped.has(key)) deduped.set(key, doc);
      });

      const combined = Array.from(deduped.values()).sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

      setResumes(combined);
      setLoading(false);
    };

    fetch();
  }, [contactId]);

  const openPreview = async (doc: ResumeDoc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);

    // Always use a signed URL — no blob downloads needed
    const { data: signedData, error } = await supabase.storage
      .from("contact-documents")
      .createSignedUrl(doc.file_url, 3600);

    if (error || !signedData?.signedUrl) {
      toast.error("Failed to load file preview");
      setPreviewLoading(false);
      return;
    }

    if (canPreviewInline(doc)) {
      // PDFs and images use the signed URL directly
      setPreviewUrl(signedData.signedUrl);
    } else {
      // DOCX/DOC etc. use Google Docs Viewer
      const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(signedData.signedUrl)}&embedded=true`;
      setPreviewUrl(viewerUrl);
    }
    setPreviewLoading(false);
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const downloadFile = async (doc: ResumeDoc) => {
    const { data, error } = await supabase.storage
      .from("contact-documents")
      .download(doc.file_url);

    if (error || !data) {
      toast.error("Failed to download file");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resumes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resumes
            <span className="text-xs font-normal text-muted-foreground ml-auto">from Crelate</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resumes.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => openPreview(doc)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.file_size_bytes)}
                    {doc.created_at && ` • ${formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canParseResume(doc.file_name) && <Button size="sm" variant="outline" className="h-7 gap-1" title="Parse saved resume" onClick={event => { event.stopPropagation(); setParseDocument({ id: doc.id.slice(4), source: doc.id.startsWith("att-") ? "attachment" : "document", fileName: doc.file_name }); }}><ScanText className="w-3.5 h-3.5" />Parse</Button>}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); openPreview(doc); }}
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); downloadFile(doc); }}
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <ResumeParseDialog contactId={contactId} document={parseDocument} onClose={() => setParseDocument(null)} onSaved={onContactUpdated} />
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-base font-semibold truncate">
                {previewDoc?.file_name}
              </DialogTitle>
              {previewDoc && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() => downloadFile(previewDoc)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-muted/30">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl && previewDoc ? (
              isImage(previewDoc) ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt={previewDoc.file_name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  title={previewDoc.file_name}
                  className="w-full h-full border-0"
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Failed to load preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactResumes;
