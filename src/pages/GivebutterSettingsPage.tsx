import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GivebutterSettings } from "@/components/integrations/GivebutterSettings";
import { useEffect, useState } from "react";

export default function GivebutterSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialTab, setInitialTab] = useState("settings");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setInitialTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/integrations")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Integrations
          </Button>
        </div>

        <GivebutterSettings />
      </div>
    </Layout>
  );
}
