import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VolunteerOpportunity } from '@/hooks/volunteers/useVolunteerOpportunities';
import { format } from 'date-fns';

const signupSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(1000).optional(),
});

interface VolunteerSignupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunities: VolunteerOpportunity[];
  preSelectedEventId?: string | null;
}

export function VolunteerSignupForm({
  open,
  onOpenChange,
  opportunities,
  preSelectedEventId,
}: VolunteerSignupFormProps) {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState(preSelectedEventId ?? '');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync pre-selected when dialog opens
  const effectiveEventId = selectedEventId || preSelectedEventId || '';

  const selectedEvent = opportunities.find((o) => o.id === effectiveEventId);
  const isFull = !!(selectedEvent?.max_volunteers && selectedEvent.volunteers_registered >= selectedEvent.max_volunteers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = signupSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!effectiveEventId) {
      toast({ title: 'Please select an event', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-volunteer-registration', {
        body: {
          event_id: effectiveEventId,
          volunteer_data: {
            first_name: parsed.data.first_name,
            last_name: parsed.data.last_name,
            email: parsed.data.email,
            phone: parsed.data.phone || undefined,
            availability_notes: parsed.data.notes || undefined,
          },
          registration_source: 'public_form',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSubmitted(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
      setSelectedEventId('');
      setErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">You&apos;re Registered!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for signing up{selectedEvent ? ` for ${selectedEvent.title}` : ''}. Check your email for confirmation details.
            </p>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Volunteer Sign Up</DialogTitle>
              <DialogDescription>Fill out the form below to sign up for a volunteer opportunity.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event selector */}
              <div className="space-y-2">
                <Label>Opportunity *</Label>
                <Select
                  value={effectiveEventId}
                  onValueChange={(v) => setSelectedEventId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities.filter((o) => o.status === 'open').map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title} — {format(new Date(o.start_date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isFull && (
                  <p className="text-sm text-destructive">This event is full — please select another.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-fn">First Name *</Label>
                  <Input
                    id="signup-fn"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-ln">Last Name *</Label>
                  <Input
                    id="signup-ln"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-phone">Phone</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-notes">Notes</Label>
                <Textarea
                  id="signup-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anything you'd like us to know..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || isFull || !effectiveEventId}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
