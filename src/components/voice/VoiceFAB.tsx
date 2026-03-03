import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceNotesAccess } from "@/hooks/useVoiceNotesAccess";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceFABProps {
  onClick?: () => void;
  constituentContext?: {
    id: string;
    name: string;
  };
}

export function VoiceFAB({ onClick, constituentContext }: VoiceFABProps) {
  const { hasAccess, isLoading } = useVoiceNotesAccess();
  const navigate = useNavigate();

  if (isLoading || !hasAccess) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to voice recorder with optional constituent context
      const params = constituentContext 
        ? `?constituentId=${constituentContext.id}&constituentName=${encodeURIComponent(constituentContext.name)}`
        : '';
      navigate(`/voice-notes/record${params}`);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
          size="icon"
        >
          <Mic className="w-6 h-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Record Voice Note</p>
      </TooltipContent>
    </Tooltip>
  );
}
