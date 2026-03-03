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
import { AlertTriangle } from "lucide-react";

interface ConfirmFeatureToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  featureName: string;
  isDisabling: boolean;
}

export function ConfirmFeatureToggleDialog({
  open,
  onOpenChange,
  onConfirm,
  featureName,
  isDisabling,
}: ConfirmFeatureToggleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDisabling && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            {isDisabling ? "Disable Feature?" : "Enable Feature"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDisabling ? (
              <>
                You are about to disable <strong>{featureName}</strong> for this customer.
                They will lose access to this feature after the next config sync.
              </>
            ) : (
              <>
                You are about to enable <strong>{featureName}</strong> for this customer.
                They will gain access after the next config sync.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isDisabling ? "Disable" : "Enable"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
