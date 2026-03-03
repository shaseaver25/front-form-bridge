import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Loader2 } from "lucide-react";

interface SuperAdminGuardProps {
  children: ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { isSuperAdmin, isLoading } = useSuperAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      toast.error("Access denied");
      navigate("/");
    }
  }, [isLoading, isSuperAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
