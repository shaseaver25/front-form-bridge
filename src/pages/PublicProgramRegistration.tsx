import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, DollarSign, Users, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function useOffering(offeringId: string | undefined) {
  return useQuery({
    queryKey: ["public-offering", offeringId],
    queryFn: async () => {
      if (!offeringId) return null;
      const { data, error } = await supabase
        .from("program_offerings")
        .select(`
          *,
          program:programs(*)
        `)
        .eq("id", offeringId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!offeringId,
  });
}

export default function PublicProgramRegistration() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const sessionId = searchParams.get("session_id");
  
  const { data: offering, isLoading } = useOffering(offeringId);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Enrollment Complete!</CardTitle>
            <CardDescription>
              Thank you for enrolling. You will receive a confirmation email shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionId && (
              <p className="text-sm text-muted-foreground">
                Reference: {sessionId.slice(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Program Not Found</CardTitle>
            <CardDescription>
              This program offering doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const program = offering.program;
  const isFree = Number(offering.price) === 0;
  const isFull = offering.capacity !== null && offering.enrolled_count >= offering.capacity;
  const isDeadlinePassed = offering.registration_deadline && new Date(offering.registration_deadline) < new Date();
  const isActive = offering.is_active;

  const canEnroll = isActive && !isFull && !isDeadlinePassed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-program-checkout", {
        body: {
          offeringId: offering.id,
          enrolleeName: formData.name,
          enrolleeEmail: formData.email,
          enrolleePhone: formData.phone,
          successUrl: `${window.location.origin}/register/program/${offeringId}?success=true`,
          cancelUrl: window.location.href,
        },
      });

      if (error) throw error;

      if (data.free || data.enrolled) {
        toast.success("Enrollment complete!");
        window.location.href = `${window.location.origin}/register/program/${offeringId}?success=true`;
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process enrollment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Program Header */}
        <Card>
          <CardHeader>
            <div>
              {program && (
                <Badge variant="secondary" className="mb-2">
                  {program.name}
                </Badge>
              )}
              <CardTitle className="text-3xl">{offering.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {offering.description && (
              <p className="text-muted-foreground">{offering.description}</p>
            )}
            
            <div className="grid gap-3 sm:grid-cols-2">
              {(offering.start_date || offering.end_date) && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {offering.start_date && format(new Date(offering.start_date), "MMM d")}
                    {offering.start_date && offering.end_date && " - "}
                    {offering.end_date && format(new Date(offering.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {isFree ? "Free" : `$${Number(offering.price).toFixed(2)}`}
                </span>
              </div>

              {offering.capacity && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {offering.enrolled_count} / {offering.capacity} enrolled
                  </span>
                </div>
              )}

              {offering.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{offering.location}</span>
                </div>
              )}
            </div>

            {offering.registration_deadline && (
              <p className={`text-sm ${isDeadlinePassed ? "text-destructive" : "text-muted-foreground"}`}>
                Registration deadline: {format(new Date(offering.registration_deadline), "MMMM d, yyyy")}
                {isDeadlinePassed && " (passed)"}
              </p>
            )}

            {isFull && (
              <Badge variant="destructive">This offering is full</Badge>
            )}

            {!isActive && (
              <Badge variant="secondary">Registration is currently closed</Badge>
            )}
          </CardContent>
        </Card>

        {/* Registration Form */}
        {canEnroll && (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Enroll Now</CardTitle>
                <CardDescription>Enter your information to enroll in this program</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">
                      {isFree ? "Free" : `$${Number(offering.price).toFixed(2)}`}
                    </span>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isFree ? (
                      "Enroll Now"
                    ) : (
                      `Pay $${Number(offering.price).toFixed(2)}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}
