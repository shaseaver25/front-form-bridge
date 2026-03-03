import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Users, Clock, CheckCircle2, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface VolunteerPosition {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  skills_required: string[];
  slots_available: number;
  slots_filled: number;
  time_commitment: string | null;
  is_active: boolean;
}

interface BoardInfo {
  id: string;
  name: string;
  description: string | null;
}

export default function PublicVolunteerOpportunities() {
  const { boardId } = useParams<{ boardId: string }>();
  const [selectedPosition, setSelectedPosition] = useState<VolunteerPosition | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['public-board', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('id, name, description')
        .eq('id', boardId)
        .eq('volunteers_needed', true)
        .single();

      if (error) throw error;
      return data as BoardInfo;
    },
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['public-volunteer-positions', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_volunteer_positions')
        .select('*')
        .eq('board_id', boardId)
        .eq('is_active', true);

      if (error) throw error;
      return data as VolunteerPosition[];
    },
    enabled: !!board,
  });

  const submitSignup = useMutation({
    mutationFn: async (data: typeof formData & { position_id: string }) => {
      // First, try to find or create constituent
      let constituentId: string | null = null;

      const { data: existingConstituent } = await supabase
        .from('constituents')
        .select('id')
        .eq('primary_email', data.email.toLowerCase())
        .single();

      if (existingConstituent) {
        constituentId = existingConstituent.id;
      } else {
        // Create new constituent
        const { data: newConstituent, error: createError } = await supabase
          .from('constituents')
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            full_legal_name: `${data.first_name} ${data.last_name}`,
            primary_email: data.email.toLowerCase(),
            phone: data.phone || null,
            donor_type: 'volunteer',
          })
          .select('id')
          .single();

        if (!createError && newConstituent) {
          constituentId = newConstituent.id;
        }
      }

      // Create signup
      const { error: signupError } = await supabase
        .from('project_volunteer_signups')
        .insert({
          position_id: data.position_id,
          constituent_id: constituentId,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          message: data.message || null,
          status: 'pending',
        });

      if (signupError) throw signupError;
    },
    onSuccess: () => {
      setSubmitted(true);
      setSelectedPosition(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
      });
      toast.success('Thank you for signing up!');
    },
    onError: () => {
      toast.error('Failed to submit. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    submitSignup.mutate({
      ...formData,
      position_id: selectedPosition.id,
    });
  };

  const isLoading = boardLoading || positionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading opportunities...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Opportunities Not Found</h2>
            <p className="text-muted-foreground">
              This volunteer opportunity page is not available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your volunteer application has been submitted. We'll be in touch soon!
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              View More Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{board.name}</h1>
          {board.description && (
            <p className="text-lg opacity-90 max-w-2xl mx-auto">{board.description}</p>
          )}
          <p className="mt-4 text-lg opacity-80">
            Join us as a volunteer and make a difference!
          </p>
        </div>
      </div>

      {/* Positions */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Available Positions</h2>

        {positions?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No volunteer positions are currently available. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {positions?.map((position) => {
              const slotsRemaining = position.slots_available - position.slots_filled;
              const isFull = slotsRemaining <= 0;

              return (
                <Card key={position.id} className={isFull ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{position.title}</CardTitle>
                        {position.description && (
                          <CardDescription className="mt-2">
                            {position.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        onClick={() => setSelectedPosition(position)}
                        disabled={isFull}
                      >
                        {isFull ? 'Filled' : 'Sign Up'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {slotsRemaining > 0
                            ? `${slotsRemaining} spot${slotsRemaining === 1 ? '' : 's'} left`
                            : 'Filled'}
                        </span>
                      </div>
                      {position.time_commitment && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{position.time_commitment}</span>
                        </div>
                      )}
                    </div>
                    {position.skills_required?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {position.skills_required.map((skill, i) => (
                          <Badge key={i} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Signup Dialog */}
      <Dialog open={!!selectedPosition} onOpenChange={() => setSelectedPosition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Up: {selectedPosition?.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to volunteer for this position.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about yourself or ask any questions..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedPosition(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitSignup.isPending}>
                {submitSignup.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}