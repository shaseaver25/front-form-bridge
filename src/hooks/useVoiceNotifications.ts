import { useState, useEffect } from "react";

type NotificationPermission = "default" | "granted" | "denied";

interface VoiceNotification {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
}

export function useVoiceNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const showNotification = ({ title, body, tag, icon }: VoiceNotification) => {
    if (!isSupported || permission !== "granted") return;

    try {
      new Notification(title, {
        body,
        tag,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  };

  const notifyDueToday = (taskTitle: string, contactName?: string) => {
    showNotification({
      title: "Follow-up Due Today",
      body: contactName 
        ? `${taskTitle} - ${contactName}` 
        : taskTitle,
      tag: "voice-due-today",
    });
  };

  const notifyOverdue = (taskTitle: string, daysOverdue: number) => {
    showNotification({
      title: `Overdue Task (${daysOverdue} days)`,
      body: taskTitle,
      tag: "voice-overdue",
    });
  };

  const notifyTaskCompleted = (taskTitle: string) => {
    showNotification({
      title: "Task Completed ✓",
      body: taskTitle,
      tag: "voice-completed",
    });
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    notifyDueToday,
    notifyOverdue,
    notifyTaskCompleted,
  };
}
