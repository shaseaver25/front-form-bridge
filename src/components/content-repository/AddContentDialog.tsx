import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddContent, ContentItem, useUpdateContent } from "@/hooks/useContentRepository";
import { CONTENT_TYPE_LABELS } from "./ContentTypeFilter";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  content_type: z.string().min(1, "Content type is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().optional(),
  tags: z.string().optional(),
  is_template: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: ContentItem | null;
}

export function AddContentDialog({ open, onOpenChange, editItem }: AddContentDialogProps) {
  const addContent = useAddContent();
  const updateContent = useUpdateContent();
  const isEditing = !!editItem;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editItem?.title || "",
      content_type: editItem?.content_type || "",
      content: editItem?.content || "",
      category: editItem?.category || "",
      tags: editItem?.tags?.join(", ") || "",
      is_template: editItem?.is_template || false,
    },
  });

  // Reset form when editItem changes
  useState(() => {
    if (editItem) {
      form.reset({
        title: editItem.title,
        content_type: editItem.content_type,
        content: editItem.content,
        category: editItem.category || "",
        tags: editItem.tags?.join(", ") || "",
        is_template: editItem.is_template,
      });
    } else {
      form.reset({
        title: "",
        content_type: "",
        content: "",
        category: "",
        tags: "",
        is_template: false,
      });
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);

    // If it's a text file, read and populate content
    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue("content", text);
        if (!form.getValues("title")) {
          form.setValue("title", file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsText(file);
    } else {
      // For other files, just set the title
      if (!form.getValues("title")) {
        form.setValue("title", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'text/plain': ['.txt', '.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const onSubmit = async (values: FormValues) => {
    const tags = values.tags
      ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

    const payload = {
      title: values.title,
      content_type: values.content_type,
      content: values.content,
      category: values.category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      is_template: values.is_template,
    };

    try {
      if (isEditing && editItem) {
        await updateContent.mutateAsync({ id: editItem.id, ...payload });
      } else {
        await addContent.mutateAsync(payload);
      }
      form.reset();
      setUploadedFile(null);
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = addContent.isPending || updateContent.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Content" : "Add New Content"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Upload Dropzone */}
            {!isEditing && (
              <div className="space-y-2">
                <FormLabel>Upload File (Optional)</FormLabel>
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{uploadedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive
                        ? "Drop the file here..."
                        : "Drag & drop a file, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports TXT, MD, PDF, DOC, DOCX
                    </p>
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Organization Mission Statement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reusable content..."
                      rows={10}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Youth Programs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Separate tags with commas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_template"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as Template</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}