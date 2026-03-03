import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadState {
  resume: File | null;
  references: File | null;
  headshot: File | null;
}

interface PoolApplicationFilesSectionProps {
  files: FileUploadState;
  setFiles: React.Dispatch<React.SetStateAction<FileUploadState>>;
}

function FileDropzone({
  label,
  description,
  accept,
  maxSize,
  file,
  onDrop,
  onRemove,
  icon: Icon,
}: {
  label: string;
  description: string;
  accept: Record<string, string[]>;
  maxSize: number;
  file: File | null;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
  icon: typeof Upload;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  if (file) {
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-[#0D7377] bg-[#0D7377]/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
    >
      <input {...getInputProps()} />
      <Icon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

export function PoolApplicationFilesSection({ files, setFiles }: PoolApplicationFilesSectionProps) {
  const handleResumeDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFiles((prev) => ({ ...prev, resume: acceptedFiles[0] }));
      }
    },
    [setFiles]
  );

  const handleReferencesDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFiles((prev) => ({ ...prev, references: acceptedFiles[0] }));
      }
    },
    [setFiles]
  );

  const handleHeadshotDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFiles((prev) => ({ ...prev, headshot: acceptedFiles[0] }));
      }
    },
    [setFiles]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Uploads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropzone
          label="Resume/CV"
          description="PDF, DOC, DOCX - Max 5MB"
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          }}
          maxSize={5 * 1024 * 1024}
          file={files.resume}
          onDrop={handleResumeDrop}
          onRemove={() => setFiles((prev) => ({ ...prev, resume: null }))}
          icon={FileText}
        />

        <FileDropzone
          label="References Document"
          description="PDF, DOC, DOCX - Max 5MB"
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          }}
          maxSize={5 * 1024 * 1024}
          file={files.references}
          onDrop={handleReferencesDrop}
          onRemove={() => setFiles((prev) => ({ ...prev, references: null }))}
          icon={FileText}
        />

        <FileDropzone
          label="Professional Headshot"
          description="JPG, PNG - Max 2MB"
          accept={{
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
          }}
          maxSize={2 * 1024 * 1024}
          file={files.headshot}
          onDrop={handleHeadshotDrop}
          onRemove={() => setFiles((prev) => ({ ...prev, headshot: null }))}
          icon={Image}
        />

        <p className="text-xs text-muted-foreground">
          All files are optional but recommended. Uploaded files will be securely stored and only
          accessible to our review team.
        </p>
      </CardContent>
    </Card>
  );
}
