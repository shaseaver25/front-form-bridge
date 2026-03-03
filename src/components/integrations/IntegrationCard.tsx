import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, AlertCircle, MoreVertical, ArrowRight, 
  Clock, Loader2, Sparkles 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  status: "connected" | "available" | "error" | "syncing" | "coming-soon";
  lastSync?: string;
  stats?: string;
  href?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  comingSoon?: string;
  color?: string;
}

export function IntegrationCard({
  id,
  name,
  description,
  category,
  icon: Icon,
  status,
  lastSync,
  stats,
  href,
  secondaryHref,
  secondaryLabel,
  comingSoon,
  color = "blue",
}: IntegrationCardProps) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Action Required
          </Badge>
        );
      case "syncing":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case "coming-soon":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Coming Soon
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleConnect = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-600`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {category}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {status === "connected" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleConnect}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Sync Now
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    View Logs
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>

        {status === "connected" && (
          <div className="space-y-2 text-sm">
            {stats && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>📊 {stats}</span>
              </div>
            )}
            {lastSync && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Last sync: {lastSync}</span>
              </div>
            )}
          </div>
        )}

        {status === "coming-soon" && comingSoon && (
          <div className="text-sm text-muted-foreground">
            📅 Expected: {comingSoon}
          </div>
        )}

        <div className="pt-2">
          {status === "connected" ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 group/btn"
                onClick={handleConnect}
              >
                Configure
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
              {secondaryHref && secondaryLabel && (
                <Button 
                  variant="default"
                  className="flex-1"
                  onClick={() => navigate(secondaryHref)}
                >
                  {secondaryLabel}
                </Button>
              )}
            </div>
          ) : status === "coming-soon" ? (
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          ) : (
            <Button className="w-full" onClick={handleConnect}>
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
