import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QuickBooksCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      // Redirect to integrations page after 2 seconds
      setTimeout(() => {
        navigate('/integrations');
      }, 2000);
    } else if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
    }
  }, [searchParams, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Connection</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your QuickBooks connection...'}
            {status === 'success' && 'Successfully connected to QuickBooks!'}
            {status === 'error' && 'Connection failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {status === 'success' && (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your QuickBooks account has been successfully connected to TailoredU CRM. 
                  You can now sync financial data between QuickBooks and your CRM.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to integrations page...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Error:</strong> {errorMessage}
                </AlertDescription>
              </Alert>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => navigate('/integrations')} variant="outline">
                  Back to Integrations
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickBooksCallback;