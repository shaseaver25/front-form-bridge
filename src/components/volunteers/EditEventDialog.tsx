import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  FormFieldSettingsPanel,
  FormFieldSettings,
  CustomField,
  defaultFormFieldSettings,
} from './FormFieldSettings';

interface VolunteerEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  location_type: string | null;
  virtual_link: string | null;
  max_volunteers: number | null;
  skills_needed: string[] | null;
  public_signup_enabled: boolean | null;
  signup_form_slug: string | null;
  status: string | null;
  form_field_settings: FormFieldSettings | null;
  custom_fields: CustomField[] | null;
  waiver_text: string | null;
}

interface EditEventDialogProps {
  event: VolunteerEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'workshop',
    start_date: '',
    end_date: '',
    location: '',
    location_type: 'in_person',
    virtual_link: '',
    max_volunteers: '',
    skills_needed: '',
    public_signup_enabled: true,
    signup_form_slug: '',
    status: 'open'
  });

  const [formFieldSettings, setFormFieldSettings] = useState<FormFieldSettings>(defaultFormFieldSettings);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [waiverText, setWaiverText] = useState('');

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'workshop',
        start_date: event.start_date ? event.start_date.slice(0, 16) : '',
        end_date: event.end_date ? event.end_date.slice(0, 16) : '',
        location: event.location || '',
        location_type: event.location_type || 'in_person',
        virtual_link: event.virtual_link || '',
        max_volunteers: event.max_volunteers?.toString() || '',
        skills_needed: event.skills_needed?.join(', ') || '',
        public_signup_enabled: event.public_signup_enabled ?? true,
        signup_form_slug: event.signup_form_slug || '',
        status: event.status || 'open'
      });
      setFormFieldSettings(event.form_field_settings || defaultFormFieldSettings);
      setCustomFields(event.custom_fields || []);
      setWaiverText(event.waiver_text || '');
    }
  }, [event]);

  const updateEvent = useMutation({
    mutationFn: async () => {
      if (!event) return;
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        location: formData.location,
        location_type: formData.location_type,
        virtual_link: formData.virtual_link || null,
        max_volunteers: formData.max_volunteers ? parseInt(formData.max_volunteers) : null,
        skills_needed: formData.skills_needed ? formData.skills_needed.split(',').map(s => s.trim()) : [],
        public_signup_enabled: formData.public_signup_enabled,
        signup_form_slug: formData.signup_form_slug || null,
        status: formData.status,
        form_field_settings: formFieldSettings as unknown as import('@/integrations/supabase/types').Json,
        custom_fields: customFields as unknown as import('@/integrations/supabase/types').Json,
        waiver_text: waiverText || null,
      };
      
      const { data, error } = await supabase
        .from('volunteer_events')
        .update(updateData)
        .eq('id', event.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-events'] });
      toast({
        title: 'Event Updated',
        description: 'Volunteer event has been updated successfully.'
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive'
      });
      console.error('Error updating event:', error);
    }
  });

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, signup_form_slug: slug });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Volunteer Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Event Details</TabsTrigger>
              <TabsTrigger value="form-settings">Form Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Spring Buildathon 2025"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the volunteer opportunity..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <select
                    id="event_type"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  >
                    <option value="buildathon">Buildathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="mentoring">Mentoring</option>
                    <option value="community_service">Community Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="full">Full</option>
                    <option value="closed">Closed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="location_type">Location Type</Label>
                  <select
                    id="location_type"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  >
                    <option value="in_person">In Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., 123 Main St, Minneapolis"
                  />
                </div>

                <div>
                  <Label htmlFor="virtual_link">Virtual Meeting Link</Label>
                  <Input
                    id="virtual_link"
                    type="url"
                    value={formData.virtual_link}
                    onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                    placeholder="https://zoom.us/..."
                  />
                </div>

                <div>
                  <Label htmlFor="max_volunteers">Max Volunteers</Label>
                  <Input
                    id="max_volunteers"
                    type="number"
                    min="1"
                    value={formData.max_volunteers}
                    onChange={(e) => setFormData({ ...formData, max_volunteers: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <Label htmlFor="skills_needed">Skills Needed (comma-separated)</Label>
                  <Input
                    id="skills_needed"
                    value={formData.skills_needed}
                    onChange={(e) => setFormData({ ...formData, skills_needed: e.target.value })}
                    placeholder="teaching, technical, organizing"
                  />
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      id="public_signup"
                      checked={formData.public_signup_enabled}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, public_signup_enabled: checked as boolean })
                      }
                    />
                    <Label htmlFor="public_signup" className="cursor-pointer">
                      Enable public sign-up form
                    </Label>
                  </div>

                  {formData.public_signup_enabled && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="slug">Sign-up Form URL Slug</Label>
                        <div className="flex gap-2">
                          <Input
                            id="slug"
                            value={formData.signup_form_slug}
                            onChange={(e) => setFormData({ ...formData, signup_form_slug: e.target.value })}
                            placeholder="spring-buildathon-2025"
                          />
                          <Button type="button" variant="outline" onClick={generateSlug}>
                            Generate
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Public URL: /volunteer/{formData.signup_form_slug || 'your-slug'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="form-settings" className="mt-4">
              <FormFieldSettingsPanel
                settings={formFieldSettings}
                onSettingsChange={setFormFieldSettings}
                customFields={customFields}
                onCustomFieldsChange={setCustomFields}
                waiverText={waiverText}
                onWaiverTextChange={setWaiverText}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEvent.isPending}>
              {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
