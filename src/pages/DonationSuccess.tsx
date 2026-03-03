import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Heart, ArrowRight, Building2 } from "lucide-react";

export default function DonationSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">createMPLS</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Thank You for Your Generosity!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Your donation has been successfully processed. You'll receive a confirmation
              email shortly with your receipt.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="h-5 w-5" />
                <span className="font-medium">Your Impact</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your contribution helps us provide STEM education and opportunities to
                Minneapolis students. Thank you for making a difference!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/")} className="gap-2">
                Return to Homepage
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/donate")}>
                Make Another Gift
              </Button>
            </div>

            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Reference: {sessionId.slice(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
