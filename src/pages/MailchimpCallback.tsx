import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MailchimpCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract OAuth callback parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Call edge function to complete OAuth flow (POST with body)
        const { data, error: functionError } = await supabase.functions.invoke(
          'mailchimp-oauth',
          {
            body: {
              code,
              state,
            },
          }
        );

        if (functionError) {
          throw functionError;
        }

        toast({
          title: "Connected Successfully",
          description: "Your Mailchimp account has been connected.",
        });

        navigate('/mailchimp-settings?success=true', { replace: true });
      } catch (error) {
        console.error('Mailchimp OAuth callback error:', error);
        
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect Mailchimp",
          variant: "destructive",
        });

        navigate('/mailchimp-settings?error=' + encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        ), { replace: true });
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Completing Mailchimp connection...</p>
      </div>
    </div>
  );
};

export default MailchimpCallback;
