import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { COLLABORATOR_ROLES, type CollaboratorRole } from '@/constants/collaboratorRoles';

interface InviteExternalCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectType: 'grant' | 'board' | 'site';
  projectId: string;
  projectName: string;
}

export function InviteExternalCollaboratorDialog({
  open,
  onOpenChange,
  projectType,
  projectId,
  projectName
}: InviteExternalCollaboratorDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('contributor');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email || !name) {
      toast.error('Please provide email and name');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-external-collaborator', {
        body: {
          email,
          name,
          organization,
          project_type: projectType,
          project_id: projectId,
          project_name: projectName,
          role,
          invitation_message: message,
          access_expires_at: expiresAt?.toISOString()
        }
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${email}`);
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setName('');
      setOrganization('');
      setRole('contributor');
      setMessage('');
      setExpiresAt(undefined);

    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setEmail('');
    setName('');
    setOrganization('');
    setRole('contributor');
    setMessage('');
    setExpiresAt(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite External Collaborator</DialogTitle>
          <DialogDescription>
            Give limited access to: {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborator@partner.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Partner Organization Name"
            />
          </div>

          <div className="space-y-2">
            <Label>Access Level</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CollaboratorRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COLLABORATOR_ROLES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">{config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Welcome Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="We're excited to collaborate with you on this grant..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Access Expiration (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP") : "No expiration"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
                {expiresAt && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setExpiresAt(undefined)}
                    >
                      Clear expiration
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Access will expire on {format(expiresAt, "PPPP")}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading || !email || !name}>
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
