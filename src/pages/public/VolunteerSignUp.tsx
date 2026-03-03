import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { FormFieldSettings, CustomField } from '@/components/volunteers/FormFieldSettings';

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
  volunteers_registered: number;
  status: string;
  skills_needed: string[] | null;
  image_url: string | null;
  form_field_settings: FormFieldSettings | null;
  custom_fields: CustomField[] | null;
  waiver_text: string | null;
}

const defaultFormFieldSettings: FormFieldSettings = {
  phone: { show: true, required: true },
  company: { show: true, required: true },
  job_title: { show: true, required: true },
  skills: { show: true, required: false },
  availability_notes: { show: true, required: false },
  emergency_contact: { show: true, required: true },
  shirt_size: { show: true, required: false },
  dietary_restrictions: { show: true, required: false },
  referral_source: { show: true, required: false },
  waiver: { show: true, required: true },
};

const defaultWaiverText = `I understand that volunteering involves certain risks and I agree to release the organization 
from any liability for injuries sustained during volunteer activities. I also agree to 
follow all safety guidelines and instructions provided.`;

export default function VolunteerSignUp() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<VolunteerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    skills_offered: [] as string[],
    availability_notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    dietary_restrictions: '',
    shirt_size: '',
    referral_source: '',
    waiver_signed: false
  });

  const [customResponses, setCustomResponses] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_events')
        .select('*')
        .eq('signup_form_slug', slug)
        .eq('public_signup_enabled', true)
        .single();

      if (error) throw error;
      
      if (data.status === 'full' || data.status === 'closed') {
        toast({
          title: 'Registration Closed',
          description: 'This event is no longer accepting registrations.',
          variant: 'destructive'
        });
      }

      setEvent(data as unknown as VolunteerEvent);
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: 'Event Not Found',
        description: 'This volunteer opportunity is not available.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldSettings = event?.form_field_settings || defaultFormFieldSettings;
  const customFields = event?.custom_fields || [];
  const waiverText = event?.waiver_text || defaultWaiverText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fieldSettings.waiver?.show && fieldSettings.waiver?.required && !formData.waiver_signed) {
      toast({
        title: 'Waiver Required',
        description: 'Please agree to the waiver to continue.',
        variant: 'destructive'
      });
      return;
    }

    // Validate custom required fields
    for (const field of customFields) {
      if (field.required) {
        const value = customResponses[field.id];
        if (value === undefined || value === '' || value === false) {
          toast({
            title: 'Required Field',
            description: `Please fill in: ${field.label}`,
            variant: 'destructive'
          });
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-volunteer-registration', {
        body: {
          event_id: event?.id,
          volunteer_data: {
            ...formData,
            custom_responses: customResponses
          },
          registration_source: 'public_form'
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
      toast({
        title: 'Registration Complete!',
        description: 'Thank you for volunteering. Check your email for details.'
      });

    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: 'Registration Failed',
        description: 'Please try again or contact us directly.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = customResponses[field.id];
    const updateValue = (newValue: string | boolean) => {
      setCustomResponses(prev => ({ ...prev, [field.id]: newValue }));
    };

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.id}
              required={field.required}
              value={(value as string) || ''}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Textarea
              id={field.id}
              required={field.required}
              value={(value as string) || ''}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <select
              id={field.id}
              required={field.required}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              value={(value as string) || ''}
              onChange={(e) => updateValue(e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center gap-3">
            <Checkbox
              id={field.id}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => updateValue(checked as boolean)}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label} {field.required && '*'}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id}>
            <Label>
              {field.label} {field.required && '*'}
            </Label>
            <RadioGroup
              value={(value as string) || ''}
              onValueChange={(newValue) => updateValue(newValue)}
              className="mt-2 space-y-2"
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">This volunteer opportunity is not available.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're All Set!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for signing up to volunteer for {event.title}.
            We've sent a confirmation email with all the details.
          </p>
          <p className="text-sm text-muted-foreground">
            We look forward to seeing you on {format(new Date(event.start_date), 'MMMM d, yyyy')}!
          </p>
        </Card>
      </div>
    );
  }

  const isFull = event.max_volunteers && event.volunteers_registered >= event.max_volunteers;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Event Header */}
        <Card className="overflow-hidden mb-6">
          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {event.event_type && (
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {event.event_type}
                </span>
              )}
              {isFull && (
                <span className="px-3 py-1 bg-destructive/10 text-destructive text-sm font-medium rounded-full">
                  Event Full
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
            {event.description && (
              <p className="text-muted-foreground mb-6">{event.description}</p>
            )}

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.start_date), 'h:mm a')}
                    {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    {event.location_type && (
                      <p className="text-sm text-muted-foreground capitalize">{event.location_type.replace('_', ' ')}</p>
                    )}
                  </div>
                </div>
              )}

              {event.max_volunteers && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {event.volunteers_registered} / {event.max_volunteers} volunteers
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.max_volunteers - event.volunteers_registered} spots remaining
                    </p>
                  </div>
                </div>
              )}

              {event.skills_needed && event.skills_needed.length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Skills Needed:</p>
                    <p className="text-sm text-muted-foreground">
                      {event.skills_needed.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Volunteer Registration</h2>
          
          {isFull ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">This Event is Full</h3>
              <p className="text-muted-foreground">
                We've reached our maximum number of volunteers for this event.
                Check back soon for other opportunities!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information - Always Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                {fieldSettings.phone?.show && (
                  <div>
                    <Label htmlFor="phone">
                      Phone {fieldSettings.phone.required && '*'}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required={fieldSettings.phone.required}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                )}
              </div>

              {/* Professional Information */}
              {(fieldSettings.company?.show || fieldSettings.job_title?.show) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldSettings.company?.show && (
                    <div>
                      <Label htmlFor="company">
                        Company {fieldSettings.company.required && '*'}
                      </Label>
                      <Input
                        id="company"
                        required={fieldSettings.company.required}
                        placeholder="Your company or organization"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                      />
                    </div>
                  )}

                  {fieldSettings.job_title?.show && (
                    <div>
                      <Label htmlFor="job_title">
                        Job Title {fieldSettings.job_title.required && '*'}
                      </Label>
                      <Input
                        id="job_title"
                        required={fieldSettings.job_title.required}
                        placeholder="Your current job title"
                        value={formData.job_title}
                        onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Skills */}
              {fieldSettings.skills?.show && event.skills_needed && event.skills_needed.length > 0 && (
                <div>
                  <Label>
                    Skills You Can Offer {fieldSettings.skills.required && '*'}
                  </Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {event.skills_needed.map(skill => (
                      <div key={skill} className="flex items-center gap-2">
                        <Checkbox
                          id={`skill-${skill}`}
                          checked={formData.skills_offered.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                skills_offered: [...formData.skills_offered, skill]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                skills_offered: formData.skills_offered.filter(s => s !== skill)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer">
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fieldSettings.availability_notes?.show && (
                <div>
                  <Label htmlFor="availability_notes">
                    Availability / Additional Notes {fieldSettings.availability_notes.required && '*'}
                  </Label>
                  <Textarea
                    id="availability_notes"
                    required={fieldSettings.availability_notes.required}
                    placeholder="Any scheduling constraints or notes..."
                    value={formData.availability_notes}
                    onChange={(e) => setFormData({...formData, availability_notes: e.target.value})}
                  />
                </div>
              )}

              {/* Emergency Contact */}
              {fieldSettings.emergency_contact?.show && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">
                        Contact Name {fieldSettings.emergency_contact.required && '*'}
                      </Label>
                      <Input
                        id="emergency_contact_name"
                        required={fieldSettings.emergency_contact.required}
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_phone">
                        Contact Phone {fieldSettings.emergency_contact.required && '*'}
                      </Label>
                      <Input
                        id="emergency_contact_phone"
                        type="tel"
                        required={fieldSettings.emergency_contact.required}
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {(fieldSettings.shirt_size?.show || fieldSettings.dietary_restrictions?.show) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldSettings.shirt_size?.show && (
                    <div>
                      <Label htmlFor="shirt_size">
                        T-Shirt Size {fieldSettings.shirt_size.required && '*'}
                      </Label>
                      <select
                        id="shirt_size"
                        required={fieldSettings.shirt_size.required}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.shirt_size}
                        onChange={(e) => setFormData({...formData, shirt_size: e.target.value})}
                      >
                        <option value="">Select Size</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                  )}

                  {fieldSettings.dietary_restrictions?.show && (
                    <div>
                      <Label htmlFor="dietary_restrictions">
                        Dietary Restrictions {fieldSettings.dietary_restrictions.required && '*'}
                      </Label>
                      <Input
                        id="dietary_restrictions"
                        required={fieldSettings.dietary_restrictions.required}
                        placeholder="Allergies, vegetarian, etc."
                        value={formData.dietary_restrictions}
                        onChange={(e) => setFormData({...formData, dietary_restrictions: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              )}

              {fieldSettings.referral_source?.show && (
                <div>
                  <Label htmlFor="referral_source">
                    How did you hear about this? {fieldSettings.referral_source.required ? '*' : '(Optional)'}
                  </Label>
                  <Input
                    id="referral_source"
                    required={fieldSettings.referral_source.required}
                    placeholder="LinkedIn, friend, website, etc."
                    value={formData.referral_source}
                    onChange={(e) => setFormData({...formData, referral_source: e.target.value})}
                  />
                </div>
              )}

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Additional Questions</h3>
                  {customFields.map(renderCustomField)}
                </div>
              )}

              {/* Waiver */}
              {fieldSettings.waiver?.show && (
                <div className="border-t pt-6">
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Checkbox
                      id="waiver"
                      checked={formData.waiver_signed}
                      onCheckedChange={(checked) => setFormData({...formData, waiver_signed: checked as boolean})}
                    />
                    <div className="flex-1">
                      <label htmlFor="waiver" className="text-sm cursor-pointer">
                        <strong>I agree to the volunteer waiver {fieldSettings.waiver.required && '*'}</strong>
                        <p className="text-muted-foreground mt-2 whitespace-pre-line">
                          {waiverText}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Questions? Contact us at volunteer@creatempls.org</p>
        </div>
      </div>
    </div>
  );
}
