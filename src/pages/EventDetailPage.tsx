import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Users, CheckCircle, DollarSign, UserCheck } from "lucide-react";
import { useEvent } from "@/hooks/useEventRegistrations";
import { useEventStats } from "@/hooks/useEventStats";
import { EventOverviewTab } from "@/components/events/EventOverviewTab";
import { EventSettingsTab } from "@/components/events/EventSettingsTab";
import { EventTicketTypesTab } from "@/components/events/EventTicketTypesTab";
import { EventRegistrationsTab } from "@/components/events/EventRegistrationsTab";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: stats, isLoading: statsLoading } = useEventStats(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (eventLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <Button variant="outline" onClick={() => navigate("/events")}>
            Back to Events
          </Button>
        </div>
      </Layout>
    );
  }

  const capacityDisplay = event.capacity 
    ? `${stats?.totalRegistrations || 0} / ${event.capacity}`
    : "Unlimited";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/events")}
              className="mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
                <Badge className={statusColors[event.status] || statusColors.draft}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>
              {event.event_type && (
                <p className="text-muted-foreground capitalize">{event.event_type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {event.status === "published" ? (
              <Button variant="outline" asChild>
                <a href={`/register/event/${event.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </a>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                disabled
                title="Publish the event to view the public registration page"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
            )}
            <Button onClick={() => setActiveTab("settings")}>
              Edit Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalRegistrations || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.confirmedRegistrations || 0}</p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.revenue || 0)}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{capacityDisplay}</p>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <EventOverviewTab event={event} onEdit={() => setActiveTab("settings")} />
          </TabsContent>
          
          <TabsContent value="tickets" className="mt-6">
            <EventTicketTypesTab eventId={event.id} />
          </TabsContent>
          
          <TabsContent value="registrations" className="mt-6">
            <EventRegistrationsTab eventId={event.id} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <EventSettingsTab event={event} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
