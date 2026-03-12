import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ContactResumesProps {
  contactId: string;
}

interface ResumeDoc {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  crelate_id: string | null;
}

const ContactResumes = ({ contactId }: ContactResumesProps) => {
  const [resumes, setResumes] = useState<ResumeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("crm_contact_documents")
        .select("*")
        .eq("contact_id", contactId)
        .not("crelate_id", "is", null)
        .order("created_at", { ascending: false });

      if (!error) setResumes(data || []);
      setLoading(false);
    };
    fetch();
  }, [contactId]);

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Resumes
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            from Crelate
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {resumes.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(doc.file_size_bytes)}
                  {doc.created_at &&
                    ` • ${formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}`}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => downloadFile(doc)}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ContactResumes;
