import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, AlertCircle, Mail, Phone, MessageSquare, Ban } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type: "grant" | "major-gift" | "communication";
  showIcon?: boolean;
  className?: string;
}

const getGrantStatusConfig = (status: string) => {
  const normalized = status.toLowerCase().replace(/_/g, " ");
  if (normalized === "awarded") return { Icon: CheckCircle, color: "bg-emerald-100 text-emerald-800", label: "Awarded" };
  if (normalized === "submitted") return { Icon: Clock, color: "bg-orange-100 text-orange-800", label: "Submitted" };
  if (normalized === "declined" || normalized === "withdrawn") return { Icon: XCircle, color: "bg-slate-100 text-slate-800", label: status };
  if (normalized.includes("review")) return { Icon: Clock, color: "bg-indigo-100 text-indigo-800", label: "Under Review" };
  if (normalized.includes("progress")) return { Icon: AlertCircle, color: "bg-blue-100 text-blue-800", label: "In Progress" };
  return { Icon: Clock, color: "bg-slate-100 text-slate-800", label: status };
};

const getMajorGiftStatusConfig = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "closed_won" || normalized === "closed won") return { Icon: CheckCircle, color: "bg-emerald-100 text-emerald-800", label: "Closed Won" };
  if (normalized === "closed_lost" || normalized === "closed lost") return { Icon: XCircle, color: "bg-slate-100 text-slate-800", label: "Closed Lost" };
  if (normalized === "solicitation") return { Icon: AlertCircle, color: "bg-orange-100 text-orange-800", label: "Solicitation" };
  if (normalized === "cultivation") return { Icon: Clock, color: "bg-blue-100 text-blue-800", label: "Cultivation" };
  return { Icon: Clock, color: "bg-slate-100 text-slate-800", label: status };
};

const getCommunicationStatusConfig = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "email") return { Icon: Mail, color: "bg-blue-100 text-blue-800", label: "Email" };
  if (normalized === "phone") return { Icon: Phone, color: "bg-emerald-100 text-emerald-800", label: "Phone" };
  if (normalized === "sms") return { Icon: MessageSquare, color: "bg-purple-100 text-purple-800", label: "SMS" };
  if (normalized === "no_contact" || normalized === "no contact") return { Icon: Ban, color: "bg-slate-100 text-slate-800", label: "No Contact" };
  return { Icon: Mail, color: "bg-slate-100 text-slate-800", label: status };
};

export function StatusBadge({ status, type, showIcon = true, className }: StatusBadgeProps) {
  let config;
  if (type === "grant") config = getGrantStatusConfig(status);
  else if (type === "major-gift") config = getMajorGiftStatusConfig(status);
  else config = getCommunicationStatusConfig(status);

  const { Icon, color, label } = config;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-sm", color, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}