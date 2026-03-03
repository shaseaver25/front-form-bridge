import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useVoiceNotifications } from "@/hooks/useVoiceNotifications";

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
}

export function NotificationPermissionBanner({ onDismiss }: NotificationPermissionBannerProps) {
  const { permission, isSupported, requestPermission } = useVoiceNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this banner
    const wasDismissed = localStorage.getItem("voice-notification-banner-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    await requestPermission();
    setIsLoading(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("voice-notification-banner-dismissed", "true");
    onDismiss?.();
  };

  // Don't show if already granted, denied, dismissed, or not supported
  if (!isSupported || permission !== "default" || dismissed) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20 mb-4">
      <CardContent className="py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Enable notifications</p>
              <p className="text-xs text-muted-foreground">
                Get reminders about your follow-up tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-muted-foreground"
            >
              Not Now
            </Button>
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
            >
              Enable
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
