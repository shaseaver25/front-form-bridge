import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

interface ContentAssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  asset?: any;
}

const assetTypes = [
  { value: "document", label: "Document" },
  { value: "template", label: "Template" },
  { value: "proposal", label: "Proposal" },
  { value: "budget", label: "Budget" },
  { value: "report", label: "Report" },
  { value: "presentation", label: "Presentation" },
  { value: "letter", label: "Letter" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "other", label: "Other" },
];

const contentTags = [
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "environment", label: "Environment" },
  { value: "arts_culture", label: "Arts & Culture" },
  { value: "social_services", label: "Social Services" },
  { value: "research", label: "Research" },
  { value: "capital_campaign", label: "Capital Campaign" },
  { value: "operations", label: "Operations" },
  { value: "program_specific", label: "Program Specific" },
  { value: "general", label: "General" },
  { value: "youth", label: "Youth" },
  { value: "senior", label: "Senior" },
  { value: "community", label: "Community" },
  { value: "innovation", label: "Innovation" },
  { value: "equity", label: "Equity" },
  { value: "sustainability", label: "Sustainability" },
];

const contentAssetSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  file_url: z.string().url("Invalid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal("")),
});

const ContentAssetForm = ({ open, onOpenChange, onSuccess, asset }: ContentAssetFormProps) => {
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState("document");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && asset) {
      setTitle(asset.title || "");
      setAssetType(asset.asset_type || "document");
      setSelectedTags(asset.content_tags || []);
      setDescription(asset.description || "");
      setFileUrl(asset.file_url || "");
    } else if (open) {
      setTitle("");
      setAssetType("document");
      setSelectedTags([]);
      setDescription("");
      setFileUrl("");
      setErrors({});
    }
  }, [open, asset]);

  const handleTagToggle = (tagValue: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagValue)
        ? prev.filter((t) => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const validation = contentAssetSchema.safeParse({
      title,
      description,
      file_url: fileUrl,
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const assetData = {
      title: title.trim(),
      asset_type: assetType as Database['public']['Enums']['asset_type'],
      content_tags: selectedTags as Database['public']['Enums']['content_tag'][],
      description: description.trim() || null,
      file_url: fileUrl.trim() || null,
    };

    let error;
    if (asset) {
      ({ error } = await supabase
        .from("content_repository_assets")
        .update(assetData)
        .eq("id", asset.id));
    } else {
      ({ error } = await supabase
        .from("content_repository_assets")
        .insert([assetData]));
    }

    setLoading(false);

    if (error) {
      toast.error(`Failed to ${asset ? "update" : "create"} content asset`);
    } else {
      toast.success(`Content asset ${asset ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit" : "Create"} Content Asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Annual Report Template"
              maxLength={200}
              required
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="assetType">Asset Type *</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Content Tags</Label>
            <div className="grid grid-cols-2 gap-3 mt-2 max-h-48 overflow-y-auto p-3 border rounded-md">
              {contentTags.map((tag) => (
                <div key={tag.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag.value}
                    checked={selectedTags.includes(tag.value)}
                    onCheckedChange={() => handleTagToggle(tag.value)}
                  />
                  <label
                    htmlFor={tag.value}
                    className="text-sm cursor-pointer"
                  >
                    {tag.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this content asset..."
              rows={4}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="fileUrl">File URL (Optional)</Label>
            <Input
              id="fileUrl"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              maxLength={500}
            />
            {errors.file_url && (
              <p className="text-sm text-destructive mt-1">{errors.file_url}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {asset ? "Update" : "Create"} Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentAssetForm;
