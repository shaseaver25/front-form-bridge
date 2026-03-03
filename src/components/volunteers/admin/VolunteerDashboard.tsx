import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, CheckCircle, XCircle, Clock, User, Mail, Phone, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useVolunteerOpportunities } from '@/hooks/volunteers/useVolunteerOpportunities';
import { useVolunteerSignups, useUpdateSignupStatus } from '@/hooks/volunteers/useVolunteerSignups';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function VolunteerDashboard() {
  const { toast } = useToast();
  const [startFilter, setStartFilter] = useState('');
  const [endFilter, setEndFilter] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: opportunities = [], isLoading } = useVolunteerOpportunities({
    startAfter: startFilter ? new Date(startFilter) : undefined,
    startBefore: endFilter ? new Date(endFilter) : undefined,
  });

  const { data: signups = [], isLoading: signupsLoading } = useVolunteerSignups(selectedEventId ?? undefined);
  const updateStatus = useUpdateSignupStatus();

  const selectedEvent = opportunities.find((o) => o.id === selectedEventId);

  // Summary stats
  const totalNeeded = opportunities.reduce((s, o) => s + (o.max_volunteers ?? 0), 0);
  const totalRegistered = opportunities.reduce((s, o) => s + o.volunteers_registered, 0);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      registered: { icon: <Clock className="h-3 w-3" />, label: 'Registered', className: '' },
      confirmed: { icon: <CheckCircle className="h-3 w-3" />, label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
      attended: { icon: <CheckCircle className="h-3 w-3" />, label: 'Attended', className: 'bg-green-100 text-green-800' },
      no_show: { icon: <XCircle className="h-3 w-3" />, label: 'No Show', className: 'bg-red-100 text-red-800' },
      cancelled: { icon: <XCircle className="h-3 w-3" />, label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    };
    const entry = map[status] ?? { icon: null, label: status, className: '' };
    return (
      <Badge variant="outline" className={`gap-1 ${entry.className}`}>
        {entry.icon} {entry.label}
      </Badge>
    );
  };

  const handleStatusChange = (registrationId: string, status: string) => {
    updateStatus.mutate(
      { registrationId, status },
      {
        onSuccess: () => toast({ title: 'Status updated' }),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{opportunities.length}</p>
                <p className="text-sm text-muted-foreground">Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalRegistered}</p>
                <p className="text-sm text-muted-foreground">Signed Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{Math.max(totalNeeded - totalRegistered, 0)}</p>
                <p className="text-sm text-muted-foreground">Spots Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={startFilter}
            onChange={(e) => setStartFilter(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={endFilter}
            onChange={(e) => setEndFilter(e.target.value)}
            className="w-40"
          />
        </div>
        {(startFilter || endFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartFilter('');
              setEndFilter('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Opportunities table */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Event</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-center p-3 font-medium">Needed</th>
                <th className="text-center p-3 font-medium">Signed Up</th>
                <th className="text-center p-3 font-medium">Remaining</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {opportunities.map((o) => {
                const remaining = o.max_volunteers ? Math.max(o.max_volunteers - o.volunteers_registered, 0) : '∞';
                return (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{o.title}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(o.start_date), 'MMM d, yyyy')}</td>
                    <td className="p-3 text-center">{o.max_volunteers ?? '∞'}</td>
                    <td className="p-3 text-center">{o.volunteers_registered}</td>
                    <td className="p-3 text-center">{remaining}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">{o.status}</Badge>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedEventId(o.id)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No opportunities found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Signups Sheet */}
      <Sheet open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedEvent?.title ?? 'Signups'}</SheetTitle>
          </SheetHeader>

          {selectedEvent && (
            <div className="p-4 bg-muted rounded-lg mt-4 text-sm">
              <p>{format(new Date(selectedEvent.start_date), 'EEEE, MMMM d, yyyy · h:mm a')}</p>
              <p className="font-medium mt-1">
                {selectedEvent.volunteers_registered} / {selectedEvent.max_volunteers ?? '∞'} volunteers
              </p>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {signupsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : signups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No signups yet.</p>
            ) : (
              signups.map((s) => (
                <div key={s.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {s.constituent?.first_name} {s.constituent?.last_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {s.constituent?.primary_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {s.constituent.primary_email}
                            </span>
                          )}
                          {s.constituent?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {s.constituent.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(s.status)}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'confirmed')} disabled={s.status === 'confirmed'}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'attended')} disabled={s.status === 'attended'}>
                      Attended
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(s.id, 'no_show')} disabled={s.status === 'no_show'}>
                      No Show
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Registered {format(new Date(s.registration_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
