import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Trash2, Download, Loader2, ScanText } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ResumeParseDialog, type ResumeParseSource } from "@/components/contact/ResumeParseDialog";
import { canParseResume } from "@/lib/resumeParsing";

interface ContactDocumentsProps {
  contactId: string;
  onContactUpdated?: () => void;
}

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

const ContactDocuments = ({ contactId, onContactUpdated }: ContactDocumentsProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parseOnUpload, setParseOnUpload] = useState(false);
  const [parseQueue, setParseQueue] = useState<ResumeParseSource[]>([]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_contact_documents")
      .select("*")
      .eq("contact_id", contactId)
      .is("crelate_id", null)
      .order("created_at", { ascending: false });

    if (!error) setDocuments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [contactId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    const pending: ResumeParseSource[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in before uploading documents.");
      for (const file of acceptedFiles) {
      const filePath = `${contactId}/${crypto.randomUUID()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("contact-documents")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: document, error: documentError } = await supabase.from("crm_contact_documents").insert({
        contact_id: contactId,
        file_name: file.name,
        file_url: filePath,
        file_type: file.type,
        file_size_bytes: file.size,
        uploaded_by: user.id,
      }).select("id").single();
      if (documentError || !document) {
        await supabase.storage.from("contact-documents").remove([filePath]);
        toast.error(`Failed to save ${file.name}`);
        continue;
      }
      uploaded++;
      if (parseOnUpload && canParseResume(file.name)) pending.push({ id: document.id, source: "document", fileName: file.name });
      else if (parseOnUpload) toast.info(`${file.name}: parsing supports PDF, DOCX, and TXT only.`);
    }
      if (uploaded) toast.success(`${uploaded} file(s) uploaded`);
      setParseQueue(previous => [...previous, ...pending]);
      await fetchDocuments();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
    finally { setUploading(false); }
  }, [contactId, parseOnUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading || parseQueue.length > 0,
  });

  const downloadFile = async (doc: Document) => {
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

  const deleteDocument = async (doc: Document) => {
    await supabase.storage.from("contact-documents").remove([doc.file_url]);
    const { error } = await supabase.from("crm_contact_documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Failed to delete document");
    } else {
      fetchDocuments();
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id={`parse-upload-${contactId}`} checked={parseOnUpload} disabled={uploading} onCheckedChange={checked => setParseOnUpload(checked === true)} />
          <Label htmlFor={`parse-upload-${contactId}`}>Parse resume after upload</Label>
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? "Drop files here" : "Drag files or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, images, CSV, XLS (max 10MB)</p>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 basis-48">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.file_size_bytes)} • {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canParseResume(doc.file_name) && <Button size="sm" className="gap-2" title="Parse saved resume" disabled={uploading || parseQueue.length > 0} onClick={() => setParseQueue([{ id: doc.id, source: "document", fileName: doc.file_name }])}><ScanText className="w-4 h-4" />Parse resume</Button>}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadFile(doc)}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteDocument(doc)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <ResumeParseDialog contactId={contactId} document={parseQueue[0] || null} onClose={() => setParseQueue(previous => previous.slice(1))} onSaved={onContactUpdated} />
    </Card>
  );
};

export default ContactDocuments;
