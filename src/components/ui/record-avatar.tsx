import { DollarSign, FileText, Target, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordAvatarProps {
  type: "constituent" | "grant" | "major-gift";
  name?: string;
  imageUrl?: string | null;
  status?: string;
  amount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name || name.trim().length === 0) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getColorFromLetter = (letter: string): string => {
  if (!letter || letter.length === 0) return "bg-blue-500";
  const charCode = letter.toUpperCase().charCodeAt(0);
  if (charCode >= 65 && charCode <= 69) return "bg-blue-500";
  if (charCode >= 70 && charCode <= 74) return "bg-emerald-500";
  if (charCode >= 75 && charCode <= 79) return "bg-purple-500";
  if (charCode >= 80 && charCode <= 84) return "bg-orange-500";
  return "bg-pink-500";
};

const getGrantStatusIcon = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "awarded") return { Icon: DollarSign, color: "text-emerald-600 bg-emerald-100" };
  if (normalized.includes("submit")) return { Icon: FileText, color: "text-orange-600 bg-orange-100" };
  if (normalized === "prospecting") return { Icon: Target, color: "text-slate-600 bg-slate-100" };
  if (normalized === "research") return { Icon: Search, color: "text-blue-600 bg-blue-100" };
  if (normalized.includes("review")) return { Icon: Clock, color: "text-indigo-600 bg-indigo-100" };
  return { Icon: FileText, color: "text-slate-600 bg-slate-100" };
};

const getMajorGiftTierColor = (amount: number): string => {
  if (amount >= 50000) return "text-emerald-600 bg-emerald-100";
  if (amount >= 10000) return "text-blue-600 bg-blue-100";
  if (amount >= 5000) return "text-sky-600 bg-sky-100";
  return "text-slate-600 bg-slate-100";
};

export function RecordAvatar({ type, name = "", status = "", amount = 0, size = "md", className }: RecordAvatarProps) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-base" };

  if (type === "constituent") {
    const initials = getInitials(name);
    const bgColor = getColorFromLetter(initials[0]);
    return (
      <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shadow-sm", bgColor, sizeClasses[size], className)}>
        {initials}
      </div>
    );
  }

  if (type === "grant") {
    const { Icon, color } = getGrantStatusIcon(status);
    return (
      <div className={cn("rounded-lg flex items-center justify-center shadow-sm", color, sizeClasses[size], className)}>
        <Icon className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5"} />
      </div>
    );
  }

  if (type === "major-gift") {
    const tierColor = getMajorGiftTierColor(amount);
    return (
      <div className={cn("rounded-lg flex items-center justify-center shadow-sm", tierColor, sizeClasses[size], className)}>
        <DollarSign className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5"} />
      </div>
    );
  }

  return null;
}