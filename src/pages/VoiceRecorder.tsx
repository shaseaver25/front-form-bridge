import { FeatureGate } from "@/components/FeatureGate";
import { VoiceUpgradePrompt } from "@/components/voice/VoiceUpgradePrompt";
import { VoiceRecorderComponent } from "@/components/voice/VoiceRecorderComponent";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVoiceNoteSave } from "@/hooks/useVoiceNoteSave";
import type { ProcessedVoiceData } from "@/types/voice-notes";

export default function VoiceRecorder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const constituentId = searchParams.get('constituentId');
  const constituentName = searchParams.get('constituentName');
  const { saveVoiceNote } = useVoiceNoteSave();

  const handleSave = async (data: ProcessedVoiceData, transcript: string, eventName?: string) => {
    const result = await saveVoiceNote({
      transcript,
      processedData: data,
      eventName,
    });
    
    if (result) {
      navigate('/voice-notes');
    }
  };

  const handleCancel = () => {
    navigate('/voice-notes');
  };

  return (
    <Layout>
      <FeatureGate 
        feature="voice_notes" 
        fallback={<VoiceUpgradePrompt />}
      >
        <div className="container mx-auto py-6 px-4 max-w-2xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/voice-notes')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Voice Notes
          </Button>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Record Voice Note</CardTitle>
              <CardDescription>
                {constituentName 
                  ? `Adding note for ${constituentName}`
                  : "Speak naturally about contacts, notes, and follow-up tasks"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceRecorderComponent
                onSave={handleSave}
                onCancel={handleCancel}
                initialContactId={constituentId || undefined}
                initialContactName={constituentName || undefined}
              />
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    </Layout>
  );
}
