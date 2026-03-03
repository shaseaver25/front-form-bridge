import { useSuperAdmin } from "@/hooks/useSuperAdmin";

export function SupportModeBanner() {
  const { isSuperAdmin, isLoading } = useSuperAdmin();

  if (isLoading || !isSuperAdmin) return null;

  return (
    <div className="bg-yellow-500 text-yellow-950 text-center text-sm font-medium py-1.5 px-4">
      ⚠️ Support Mode Active — TailoredU team is viewing this instance
    </div>
  );
}
