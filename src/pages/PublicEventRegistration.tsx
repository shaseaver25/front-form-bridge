import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useEvent, useEventTicketTypes, useCreateEventCheckout } from "@/hooks/useEventRegistrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, Ticket, CheckCircle, Minus, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PublicEventRegistration() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const sessionId = searchParams.get("session_id");
  
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: ticketTypes, isLoading: ticketsLoading } = useEventTicketTypes(eventId);
  const createCheckout = useCreateEventCheckout();
  
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>
              Thank you for registering. You will receive a confirmation email shortly.
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

  if (eventLoading || ticketsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              This event doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const selectedTicketData = ticketTypes?.find(t => t.id === selectedTicket);
  const now = new Date();
  
  const getTicketPrice = (ticket: typeof selectedTicketData) => {
    if (!ticket) return 0;
    if (ticket.early_bird_price && ticket.early_bird_ends_at && new Date(ticket.early_bird_ends_at) > now) {
      return Number(ticket.early_bird_price);
    }
    return Number(ticket.price);
  };

  const getAvailability = (ticket: typeof selectedTicketData) => {
    if (!ticket || ticket.quantity_available === null) return null;
    return ticket.quantity_available - (ticket.quantity_sold || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket) {
      toast.error("Please select a ticket type");
      return;
    }

    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      const result = await createCheckout.mutateAsync({
        eventId: eventId!,
        ticketTypeId: selectedTicket,
        quantity,
        registrantName: formData.name,
        registrantEmail: formData.email,
        registrantPhone: formData.phone,
        successUrl: `${window.location.origin}/register/event/${eventId}?success=true`,
        cancelUrl: window.location.href,
      });

      if (result.free) {
        toast.success("Registration complete!");
        window.location.href = `${window.location.origin}/register/event/${eventId}?success=true`;
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process registration");
    }
  };

  const totalPrice = selectedTicketData ? getTicketPrice(selectedTicketData) * quantity : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Event Header */}
        <Card className="overflow-hidden">
          {event.hero_image_url && (
            <div className="h-48 overflow-hidden">
              <img
                src={event.hero_image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{event.name}</CardTitle>
                {event.event_type && (
                  <Badge variant="secondary" className="mt-2">
                    {event.event_type}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
            
            <div className="grid gap-3 sm:grid-cols-2">
              {event.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.start_date), "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
              )}
              {event.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.start_date), "h:mm a")}
                    {event.end_date && ` - ${format(new Date(event.end_date), "h:mm a")}`}
                  </span>
                </div>
              )}
              {(event.location || event.is_virtual) && (
                <div className="flex items-center gap-2 text-sm sm:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.is_virtual ? "Virtual Event" : event.location}
                    {event.address && `, ${event.address}`}
                    {event.city && `, ${event.city}`}
                    {event.state && `, ${event.state}`}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ticket Selection */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Select Tickets
              </h2>
              
              <div className="space-y-3">
                {ticketTypes?.filter(t => t.is_active).map((ticket) => {
                  const price = getTicketPrice(ticket);
                  const availability = getAvailability(ticket);
                  const isEarlyBird = ticket.early_bird_price && ticket.early_bird_ends_at && 
                    new Date(ticket.early_bird_ends_at) > now;
                  const isSoldOut = availability !== null && availability <= 0;
                  const isSelected = selectedTicket === ticket.id;
                  
                  return (
                    <Card
                      key={ticket.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary" : ""
                      } ${isSoldOut ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => !isSoldOut && setSelectedTicket(ticket.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{ticket.name}</h3>
                              {isEarlyBird && (
                                <Badge variant="secondary" className="text-xs">
                                  Early Bird
                                </Badge>
                              )}
                              {isSoldOut && (
                                <Badge variant="destructive" className="text-xs">
                                  Sold Out
                                </Badge>
                              )}
                            </div>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {ticket.description}
                              </p>
                            )}
                            {availability !== null && !isSoldOut && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {availability} remaining
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                            </p>
                            {isEarlyBird && ticket.price && (
                              <p className="text-sm text-muted-foreground line-through">
                                ${Number(ticket.price).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedTicketData && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Label>Quantity:</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const availability = getAvailability(selectedTicketData);
                        if (availability === null || quantity < availability) {
                          setQuantity(q => q + 1);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Registrant Info */}
              <h2 className="text-xl font-semibold pt-4">Your Information</h2>
              <Card>
                <CardContent className="p-4 space-y-4">
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
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-4 space-y-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {selectedTicketData ? (
                    <>
                      <div className="flex justify-between">
                        <span>{selectedTicketData.name}</span>
                        <span>x{quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${getTicketPrice(selectedTicketData).toFixed(2)} each</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>
                            {totalPrice === 0 ? "Free" : `$${totalPrice.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Select a ticket to continue
                    </p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={!selectedTicket || createCheckout.isPending}
                  >
                    {createCheckout.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : totalPrice === 0 ? (
                      "Register Now"
                    ) : (
                      `Pay $${totalPrice.toFixed(2)}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
