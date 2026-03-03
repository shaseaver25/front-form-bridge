import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Mail, 
  Calendar, 
  Kanban,
  TrendingUp,
  Settings,
} from "lucide-react";

export function QuickLinks() {
  const navigate = useNavigate();

  const links = [
    { label: "Add Constituent", icon: Users, path: "/" },
    { label: "View Grants", icon: FileText, path: "/grants" },
    { label: "Record Donation", icon: DollarSign, path: "/donations" },
    { label: "Email Marketing", icon: Mail, path: "/email-marketing" },
    { label: "Calendar", icon: Calendar, path: "/calendar" },
    { label: "Projects", icon: Kanban, path: "/projects" },
    { label: "Pipeline", icon: TrendingUp, path: "/pipeline" },
    { label: "Settings", icon: Settings, path: "/settings/account" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {links.map((link) => (
        <Button
          key={link.label}
          variant="outline"
          className="flex flex-col items-center justify-center h-auto py-4 px-3 gap-2 whitespace-normal text-center"
          onClick={() => navigate(link.path)}
        >
          <link.icon className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-xs leading-tight">{link.label}</span>
        </Button>
      ))}
    </div>
  );
}
