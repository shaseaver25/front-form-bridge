import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Heart, List, CalendarDays, Loader2 } from 'lucide-react';
import { useVolunteerOpportunities } from '@/hooks/volunteers/useVolunteerOpportunities';
import { OpportunitiesList } from '@/components/volunteers/public/OpportunitiesList';
import { OpportunitiesCalendar } from '@/components/volunteers/public/OpportunitiesCalendar';
import { VolunteerSignupForm } from '@/components/volunteers/public/VolunteerSignupForm';

export default function PublicVolunteerEvents() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [preSelectedEventId, setPreSelectedEventId] = useState<string | null>(null);

  const { data: opportunities = [], isLoading } = useVolunteerOpportunities({ publicOnly: true });

  const handleSignUp = (eventId: string) => {
    setPreSelectedEventId(eventId);
    setSignupOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Volunteer Opportunities</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Make a difference in your community. Browse upcoming opportunities and sign up today!
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="list">
            <TabsList className="mb-6">
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" /> List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="h-4 w-4" /> Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <OpportunitiesList opportunities={opportunities} onSignUp={handleSignUp} />
            </TabsContent>

            <TabsContent value="calendar">
              <OpportunitiesCalendar opportunities={opportunities} onSignUp={handleSignUp} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <VolunteerSignupForm
        open={signupOpen}
        onOpenChange={setSignupOpen}
        opportunities={opportunities}
        preSelectedEventId={preSelectedEventId}
      />
    </div>
  );
}
