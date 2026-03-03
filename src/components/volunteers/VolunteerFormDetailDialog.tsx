import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { User, Mail, Phone, Calendar, MapPin, MessageSquare, FileText, Briefcase } from 'lucide-react';

interface CustomField {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

interface VolunteerFormDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: any;
  event: any;
}

export function VolunteerFormDetailDialog({ 
  open, 
  onOpenChange, 
  registration, 
  event 
}: VolunteerFormDetailDialogProps) {
  if (!registration) return null;

  const customFields = Array.isArray(event?.custom_fields) ? event.custom_fields as CustomField[] : [];

  const getCustomFieldLabel = (fieldId: string) => {
    const field = customFields.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Volunteer Registration Form
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {registration.constituent?.first_name} {registration.constituent?.last_name}
                  </p>
                </div>
              </div>
              
              {registration.constituent?.primary_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${registration.constituent.primary_email}`}
                    className="text-primary hover:underline"
                  >
                    {registration.constituent.primary_email}
                  </a>
                </div>
              )}
              
              {registration.constituent?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${registration.constituent.phone}`}
                    className="text-primary hover:underline"
                  >
                    {registration.constituent.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {(registration.company || registration.job_title) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Professional Information
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  {registration.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{registration.company}</span>
                    </div>
                  )}
                  {registration.job_title && (
                    <div className="text-sm text-muted-foreground ml-6">
                      {registration.job_title}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Registration Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Registration Details
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={registration.status === 'confirmed' ? 'default' : 'outline'}>
                  {registration.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registered On</span>
                <span className="text-sm font-medium">
                  {format(new Date(registration.registration_date), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registration Source</span>
                <span className="text-sm font-medium">
                  {registration.registration_source === 'public_form' ? 'Public Form' : registration.registration_source || 'N/A'}
                </span>
              </div>
              {registration.waiver_signed && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Waiver Signed</span>
                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Custom Form Responses */}
          {registration.custom_responses && 
           typeof registration.custom_responses === 'object' && 
           Object.keys(registration.custom_responses).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Custom Questions
                </h3>
                <div className="space-y-4">
                  {Object.entries(registration.custom_responses as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {getCustomFieldLabel(key)}
                      </p>
                      <p className="text-sm">{String(value) || 'No response'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Availability */}
          {registration.availability_notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Availability
                </h3>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{registration.availability_notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Skills */}
          {registration.skills_offered?.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Skills Offered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {registration.skills_offered.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Referral Source */}
          {registration.referral_source && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  How They Heard About This
                </h3>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{registration.referral_source}</p>
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          {(registration.dietary_restrictions || registration.special_accommodations || registration.shirt_size) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Additional Information
                </h3>
                <div className="grid gap-3">
                  {registration.dietary_restrictions && (
                    <div>
                      <span className="text-sm text-muted-foreground">Dietary Restrictions: </span>
                      <span className="text-sm">{registration.dietary_restrictions}</span>
                    </div>
                  )}
                  {registration.special_accommodations && (
                    <div>
                      <span className="text-sm text-muted-foreground">Special Accommodations: </span>
                      <span className="text-sm">{registration.special_accommodations}</span>
                    </div>
                  )}
                  {registration.shirt_size && (
                    <div>
                      <span className="text-sm text-muted-foreground">Shirt Size: </span>
                      <span className="text-sm">{registration.shirt_size}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Emergency Contact */}
          {(registration.emergency_contact_name || registration.emergency_contact_phone) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Emergency Contact
                </h3>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  {registration.emergency_contact_name && (
                    <p className="text-sm font-medium">{registration.emergency_contact_name}</p>
                  )}
                  {registration.emergency_contact_phone && (
                    <p className="text-sm text-muted-foreground">{registration.emergency_contact_phone}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
