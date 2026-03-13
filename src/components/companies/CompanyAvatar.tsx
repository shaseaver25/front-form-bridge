import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyAvatarProps {
  companyId: string;
  iconUrl: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  onUpdate?: (newUrl: string) => void;
}

export default function CompanyAvatar({ companyId, iconUrl, name, size = "lg", onUpdate }: CompanyAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(iconUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = { sm: "w-10 h-10", md: "w-12 h-12", lg: "w-16 h-16" };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `company-logos/${companyId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("contact-documents")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("crm_companies")
        .update({ icon_attachment_url: path })
        .eq("id", companyId);
      if (updateError) throw updateError;

      const { data: signedData } = await supabase.storage
        .from("contact-documents")
        .createSignedUrl(path, 3600);

      setCurrentUrl(signedData?.signedUrl || null);
      onUpdate?.(path);
      toast.success("Company logo updated");
    } catch (err: any) {
      toast.error("Failed to upload logo");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [companyId, onUpdate]);

  const [resolved, setResolved] = useState(false);
  if (!resolved && iconUrl && !iconUrl.startsWith("http")) {
    setResolved(true);
    supabase.storage
      .from("contact-documents")
      .createSignedUrl(iconUrl, 3600)
      .then(({ data }) => { if (data?.signedUrl) setCurrentUrl(data.signedUrl); });
  }

  return (
    <div className="relative group">
      <Avatar className={cn(sizeClasses[size], "cursor-pointer")} onClick={() => fileInputRef.current?.click()}>
        {currentUrl ? <AvatarImage src={currentUrl} alt={name} className="object-cover" /> : null}
        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
          {initials || <Building2 className="w-8 h-8" />}
        </AvatarFallback>
      </Avatar>
      <div
        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}
