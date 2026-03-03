import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Mic,
  Users,
  FileText,
  CheckCircle2,
  UserPlus,
  Download,
  ChevronDown,
  ChevronUp,
  Building,
  ExternalLink,
  Calendar,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTeamActivity, TeamActivityItem } from "@/hooks/useTeamActivity";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function TeamActivityTab() {
  const navigate = useNavigate();
  const [userFilter, setUserFilter] = useState("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [funderSectionOpen, setFunderSectionOpen] = useState(false);

  const { activities, isLoadingActivities, stats, isLoadingStats, recentContacts, isLoadingContacts, teamMembers } =
    useTeamActivity({
      userId: userFilter !== "all" ? userFilter : undefined,
      activityType: activityTypeFilter !== "all" ? activityTypeFilter : undefined,
    });

  const getActivityIcon = (type: TeamActivityItem["type"]) => {
    switch (type) {
      case "recording":
        return <Mic className="w-4 h-4 text-[#FF6B35]" />;
      case "contact_created":
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case "note_added":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleExport = () => {
    const csvContent = [
      ["Date", "User", "Activity Type", "Title", "Description"].join(","),
      ...activities.map((a) =>
        [
          format(new Date(a.timestamp), "yyyy-MM-dd HH:mm"),
          a.user_name,
          a.type,
          `"${a.title}"`,
          `"${a.description}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-activity-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Activity report exported");
  };

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team Recordings</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingStats ? <Skeleton className="h-8 w-12" /> : stats?.recordingsThisMonth || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mic className="w-4 h-4" />
              <span>This month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Contacts</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingStats ? <Skeleton className="h-8 w-12" /> : stats?.contactsThisMonth || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserPlus className="w-4 h-4" />
              <span>Via voice notes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Follow-ups Completed</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingStats ? <Skeleton className="h-8 w-12" /> : stats?.followupsCompleted || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span>This month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Most Active</CardDescription>
            <CardTitle className="text-lg truncate">
              {isLoadingStats ? (
                <Skeleton className="h-6 w-24" />
              ) : stats?.mostActiveUser ? (
                stats.mostActiveUser.name
              ) : (
                "—"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{stats?.mostActiveUser ? `${stats.mostActiveUser.count} recordings` : "No activity"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Export */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="recording">Recordings</SelectItem>
              <SelectItem value="contact_created">Contacts Created</SelectItem>
              <SelectItem value="note_added">Notes Added</SelectItem>
              <SelectItem value="task_completed">Tasks Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Activity Feed</h3>
          
          {isLoadingActivities ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No team activity yet</h3>
                <p className="text-muted-foreground">
                  Voice notes and contact updates from your team will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(activity.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActivityIcon(activity.type)}
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        )}
                        {activity.metadata.event_name && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {activity.metadata.event_name}
                          </Badge>
                        )}
                      </div>
                      {activity.metadata.contact_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/constituents/${activity.metadata.contact_id}`)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recently Added Contacts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recently Added via Voice</CardTitle>
              <CardDescription>New contacts from voice notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingContacts ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              ) : recentContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contacts added via voice yet
                </p>
              ) : (
                recentContacts.slice(0, 6).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/constituents/${contact.id}`)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      {contact.organization && (
                        <p className="text-xs text-muted-foreground truncate">{contact.organization}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{contact.added_by}</p>
                      {contact.event_name && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {contact.event_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Funder Contacts Section */}
          <Collapsible open={funderSectionOpen} onOpenChange={setFunderSectionOpen}>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Funder Contacts Activity
                    </CardTitle>
                    <CardDescription>Recent interactions with foundations</CardDescription>
                  </div>
                  {funderSectionOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Filter funder contacts with organization type "Foundation" to see activity here.
                  </p>
                  <Badge variant="secondary" className="w-full justify-center">
                    Coming Soon
                  </Badge>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
