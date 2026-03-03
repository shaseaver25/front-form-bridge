import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

interface ConfirmSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  customerName?: string;
}

export function ConfirmSyncDialog({
  open,
  onOpenChange,
  onConfirm,
  customerName,
}: ConfirmSyncDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Configuration
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will push the current configuration to{" "}
            <strong>{customerName || "this customer"}'s</strong> instance. This includes:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Feature toggles and permissions</li>
              <li>Subscription limits</li>
              <li>Custom terminology settings</li>
              <li>Pipeline stage configuration</li>
            </ul>
            <span className="block mt-3">
              The customer's instance will be updated immediately.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Sync Now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
