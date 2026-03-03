import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Ticket, Edit, Trash2, Clock } from "lucide-react";
import {
  useEventTicketTypes,
  useDeleteTicketType,
  EventTicketType,
} from "@/hooks/useEventRegistrations";
import { TicketTypeDialog } from "./TicketTypeDialog";
import { toast } from "sonner";

interface EventTicketTypesTabProps {
  eventId: string;
}

export function EventTicketTypesTab({ eventId }: EventTicketTypesTabProps) {
  const { data: ticketTypes = [], isLoading } = useEventTicketTypes(eventId);
  const deleteTicketType = useDeleteTicketType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicketType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<EventTicketType | null>(null);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isEarlyBirdActive = (ticket: EventTicketType) => {
    if (!ticket.early_bird_price || !ticket.early_bird_ends_at) return false;
    return new Date(ticket.early_bird_ends_at) > new Date();
  };

  const handleEdit = (ticket: EventTicketType) => {
    setEditingTicket(ticket);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTicket(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (ticket: EventTicketType) => {
    if (ticket.quantity_sold > 0) {
      toast.error("Cannot delete ticket type with sold tickets");
      return;
    }
    setTicketToDelete(ticket);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    
    try {
      await deleteTicketType.mutateAsync({
        id: ticketToDelete.id,
        eventId,
      });
      toast.success("Ticket type deleted");
    } catch (error) {
      console.error("Error deleting ticket type:", error);
      toast.error("Failed to delete ticket type");
    } finally {
      setDeleteConfirmOpen(false);
      setTicketToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ticket Types</h2>
          <p className="text-sm text-muted-foreground">
            Manage ticket tiers and pricing for this event
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Ticket Type
        </Button>
      </div>

      {/* Ticket Types List */}
      {ticketTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No ticket types yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first ticket type to enable registrations
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ticket Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ticketTypes.map((ticket) => {
            const earlyBirdActive = isEarlyBirdActive(ticket);
            const currentPrice = earlyBirdActive ? ticket.early_bird_price! : ticket.price;
            
            // Capacity warnings
            const isSoldOut = ticket.quantity_available && ticket.quantity_sold >= ticket.quantity_available;
            const isNearingCapacity = ticket.quantity_available && 
              !isSoldOut && 
              ((ticket.quantity_available - ticket.quantity_sold) / ticket.quantity_available) <= 0.1;
            
            return (
              <Card key={ticket.id} className={`${!ticket.is_active ? "opacity-60" : ""} ${isSoldOut ? "border-red-300 dark:border-red-800" : isNearingCapacity ? "border-amber-300 dark:border-amber-800" : ""}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{ticket.name}</h3>
                        {!ticket.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                        {isSoldOut && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                            Sold Out
                          </Badge>
                        )}
                        {isNearingCapacity && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                            Almost Full
                          </Badge>
                        )}
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(currentPrice)}
                      </span>
                      {earlyBirdActive && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(ticket.price)}
                          </span>
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Early Bird
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      {ticket.quantity_available ? (
                        <>
                          <span className="font-medium text-foreground">
                            {ticket.quantity_sold}
                          </span>
                          {" / "}
                          {ticket.quantity_available} sold
                          {isNearingCapacity && !isSoldOut && (
                            <span className="text-amber-600 dark:text-amber-400 ml-2">
                              ({ticket.quantity_available - ticket.quantity_sold} left!)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">
                            {ticket.quantity_sold}
                          </span>
                          {" sold (unlimited)"}
                        </>
                      )}
                    </p>
                    {ticket.quantity_available && (
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isSoldOut 
                              ? "bg-red-500" 
                              : isNearingCapacity 
                                ? "bg-amber-500" 
                                : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(
                              (ticket.quantity_sold / ticket.quantity_available) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ticket)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(ticket)}
                      disabled={ticket.quantity_sold > 0}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <TicketTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={eventId}
        ticketType={editingTicket}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket type?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{ticketToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
