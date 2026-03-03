import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFeatureAccess, type TierFeature } from "@/hooks/useFeatureAccess";

interface TierGateProps {
  feature: TierFeature;
  children: ReactNode;
}

/**
 * Route-level guard. If the subscription tier doesn't include `feature`,
 * redirects to /upgrade?feature=<feature>. While loading, shows a centered
 * spinner so the gated page doesn't flash before the redirect fires.
 */
export function TierGate({ feature, children }: TierGateProps) {
  const { hasAccess, isLoading } = useFeatureAccess(feature);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate(`/upgrade?feature=${feature}`, { replace: true });
    }
  }, [isLoading, hasAccess, feature, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
}
