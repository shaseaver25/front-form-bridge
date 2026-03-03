import { usePoolEngagements, PoolEngagement, EngagementStatus, useUpdatePoolEngagement } from "@/hooks/usePoolEngagements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Star,
  Video,
  Building,
} from "lucide-react";
import { format } from "date-fns";

interface EngagementsListProps {
  memberId: string;
}

const statusColors: Record<EngagementStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<EngagementStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const typeLabels: Record<string, string> = {
  speaking: "Speaking",
  teaching: "Teaching",
  workshop: "Workshop",
  training: "Training",
  panel: "Panel",
};

export function EngagementsList({ memberId }: EngagementsListProps) {
  const { data: engagements, isLoading } = usePoolEngagements(memberId);
  const updateEngagement = useUpdatePoolEngagement();

  const handleStatusChange = async (engagementId: string, newStatus: EngagementStatus) => {
    await updateEngagement.mutateAsync({
      id: engagementId,
      status: newStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!engagements || engagements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No engagements yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {engagements.map((engagement) => (
        <Card key={engagement.id}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{engagement.event_name}</h4>
                  <Badge variant="outline">
                    {typeLabels[engagement.engagement_type || ""] || engagement.engagement_type}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(engagement.event_date), "MMM d, yyyy")}
                  </span>
                  {engagement.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {engagement.start_time}
                      {engagement.end_time && ` - ${engagement.end_time}`}
                    </span>
                  )}
                  {engagement.location && (
                    <span className="flex items-center gap-1">
                      {engagement.is_virtual ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {engagement.location}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  {engagement.expected_audience_size && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {engagement.actual_audience_size
                        ? `${engagement.actual_audience_size}/${engagement.expected_audience_size}`
                        : engagement.expected_audience_size}{" "}
                      attendees
                    </span>
                  )}
                  {engagement.compensation_type && engagement.compensation_type !== "volunteer" && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {engagement.compensation_amount
                        ? `$${engagement.compensation_amount.toFixed(2)}`
                        : engagement.compensation_type}
                      {engagement.payment_status && engagement.payment_status !== "n/a" && (
                        <Badge
                          variant="outline"
                          className={
                            engagement.payment_status === "paid"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }
                        >
                          {engagement.payment_status}
                        </Badge>
                      )}
                    </span>
                  )}
                  {engagement.organizer_rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {engagement.organizer_rating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={engagement.status}
                  onValueChange={(v) => handleStatusChange(engagement.id, v as EngagementStatus)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
