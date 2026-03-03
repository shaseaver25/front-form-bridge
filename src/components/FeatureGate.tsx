import { ReactNode } from "react";
import { useBurndownAccess } from "@/hooks/useBurndownAccess";
import { useVoiceNotesAccess } from "@/hooks/useVoiceNotesAccess";
import { useBoardsAccess } from "@/hooks/useBoardsAccess";
import { Skeleton } from "@/components/ui/skeleton";

type FeatureType = "burndown_calculator" | "voice_notes" | "project_boards";

interface FeatureGateProps {
  feature: FeatureType;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showLoading = true 
}: FeatureGateProps) {
  const burndownAccess = useBurndownAccess();
  const voiceNotesAccess = useVoiceNotesAccess();
  const boardsAccess = useBoardsAccess();

  const accessMap: Record<FeatureType, { hasAccess: boolean; isLoading: boolean }> = {
    burndown_calculator: burndownAccess,
    voice_notes: voiceNotesAccess,
    project_boards: boardsAccess,
  };

  const { hasAccess, isLoading } = accessMap[feature];

  if (isLoading && showLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
