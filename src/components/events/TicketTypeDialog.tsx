import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  EventTicketType,
  useCreateTicketType,
  useUpdateTicketType,
  useEventTicketTypes,
} from "@/hooks/useEventRegistrations";
import { toast } from "sonner";

interface TicketTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  ticketType?: EventTicketType | null;
}

// Helper to format date for datetime-local input
const formatForInput = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
};

export function TicketTypeDialog({
  open,
  onOpenChange,
  eventId,
  ticketType,
}: TicketTypeDialogProps) {
  const createTicketType = useCreateTicketType();
  const updateTicketType = useUpdateTicketType();
  const { data: existingTickets = [] } = useEventTicketTypes(eventId);

  const isEditing = !!ticketType;

  const [earlyBirdOpen, setEarlyBirdOpen] = useState(false);
  const [salesWindowOpen, setSalesWindowOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0",
    quantity_available: "",
    early_bird_price: "",
    early_bird_ends_at: "",
    sales_start_at: "",
    sales_end_at: "",
    is_active: true,
    sort_order: "0",
  });

  // Reset form when dialog opens/closes or ticket changes
  useEffect(() => {
    if (open) {
      if (ticketType) {
        setFormData({
          name: ticketType.name,
          description: ticketType.description || "",
          price: ticketType.price.toString(),
          quantity_available: ticketType.quantity_available?.toString() || "",
          early_bird_price: ticketType.early_bird_price?.toString() || "",
          early_bird_ends_at: formatForInput(ticketType.early_bird_ends_at),
          sales_start_at: formatForInput(ticketType.sales_start_at),
          sales_end_at: formatForInput(ticketType.sales_end_at),
          is_active: ticketType.is_active,
          sort_order: ticketType.sort_order.toString(),
        });
        setEarlyBirdOpen(!!ticketType.early_bird_price);
        setSalesWindowOpen(!!ticketType.sales_start_at || !!ticketType.sales_end_at);
      } else {
        // New ticket - calculate next sort order
        const nextSortOrder = existingTickets.length > 0
          ? Math.max(...existingTickets.map(t => t.sort_order)) + 1
          : 0;
        
        setFormData({
          name: "",
          description: "",
          price: "0",
          quantity_available: "",
          early_bird_price: "",
          early_bird_ends_at: "",
          sales_start_at: "",
          sales_end_at: "",
          is_active: true,
          sort_order: nextSortOrder.toString(),
        });
        setEarlyBirdOpen(false);
        setSalesWindowOpen(false);
      }
    }
  }, [open, ticketType, existingTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Ticket type name is required");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      const data = {
        event_id: eventId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price,
        quantity_available: formData.quantity_available
          ? parseInt(formData.quantity_available)
          : null,
        early_bird_price: formData.early_bird_price
          ? parseFloat(formData.early_bird_price)
          : null,
        early_bird_ends_at: formData.early_bird_ends_at || null,
        sales_start_at: formData.sales_start_at || null,
        sales_end_at: formData.sales_end_at || null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      if (isEditing && ticketType) {
        await updateTicketType.mutateAsync({
          id: ticketType.id,
          ...data,
        });
        toast.success("Ticket type updated");
      } else {
        await createTicketType.mutateAsync(data);
        toast.success("Ticket type created");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving ticket type:", error);
      toast.error(isEditing ? "Failed to update ticket type" : "Failed to create ticket type");
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPending = createTicketType.isPending || updateTicketType.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Ticket Type" : "Add Ticket Type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., General Admission, VIP, Student"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="What's included with this ticket?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="0 for free"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_available">Quantity Available</Label>
                <Input
                  id="quantity_available"
                  type="number"
                  min="1"
                  value={formData.quantity_available}
                  onChange={(e) => updateField("quantity_available", e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </div>

          {/* Early Bird Pricing */}
          <Collapsible open={earlyBirdOpen} onOpenChange={setEarlyBirdOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="font-medium">Early Bird Pricing</span>
                {earlyBirdOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="early_bird_price">Early Bird Price ($)</Label>
                  <Input
                    id="early_bird_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.early_bird_price}
                    onChange={(e) => updateField("early_bird_price", e.target.value)}
                    placeholder="Discounted price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="early_bird_ends_at">Ends At</Label>
                  <Input
                    id="early_bird_ends_at"
                    type="datetime-local"
                    value={formData.early_bird_ends_at}
                    onChange={(e) => updateField("early_bird_ends_at", e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Sales Window */}
          <Collapsible open={salesWindowOpen} onOpenChange={setSalesWindowOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="font-medium">Sales Window</span>
                {salesWindowOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sales_start_at">Sales Start</Label>
                  <Input
                    id="sales_start_at"
                    type="datetime-local"
                    value={formData.sales_start_at}
                    onChange={(e) => updateField("sales_start_at", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales_end_at">Sales End</Label>
                  <Input
                    id="sales_end_at"
                    type="datetime-local"
                    value={formData.sales_end_at}
                    onChange={(e) => updateField("sales_end_at", e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Status & Order */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive tickets won't be shown to registrants
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField("is_active", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Display Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => updateField("sort_order", e.target.value)}
                className="max-w-24"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Ticket Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
