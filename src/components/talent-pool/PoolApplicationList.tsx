import { useState } from "react";
import { usePoolApplications, PoolType, ApplicationStatus, PoolApplication } from "@/hooks/usePoolApplications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Star,
  Mic,
  GraduationCap,
  Eye
} from "lucide-react";
import { PoolApplicationDetailDialog } from "./PoolApplicationDetailDialog";

interface PoolApplicationListProps {
  poolType?: PoolType;
}

const statusColors: Record<ApplicationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  declined: "Declined",
  inactive: "Inactive",
};

export function PoolApplicationList({ poolType }: PoolApplicationListProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<PoolApplication | null>(null);

  const { data: applications, isLoading } = usePoolApplications(
    poolType,
    statusFilter === "all" ? undefined : statusFilter
  );

  const filteredApplications = applications?.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.first_name.toLowerCase().includes(query) ||
      app.last_name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.current_employer?.toLowerCase().includes(query) ||
      app.speaker_topics?.some((t) => t.toLowerCase().includes(query)) ||
      app.subjects_qualified?.some((s) => s.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, employer, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ApplicationStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredApplications?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications?.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {application.pool_type === "speaker" ? (
                          <Mic className="h-5 w-5 text-primary" />
                        ) : (
                          <GraduationCap className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {application.first_name} {application.last_name}
                        </h3>
                        {application.current_title && application.current_employer && (
                          <p className="text-sm text-muted-foreground">
                            {application.current_title} at {application.current_employer}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {application.email}
                      </span>
                      {application.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {application.phone}
                        </span>
                      )}
                      {application.city && application.state && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.city}, {application.state}
                        </span>
                      )}
                      {application.years_of_experience && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {application.years_of_experience} years exp.
                        </span>
                      )}
                      {application.overall_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {application.overall_rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {application.pool_type === "speaker" &&
                        application.speaker_topics?.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      {application.pool_type === "teacher" &&
                        application.subjects_qualified?.slice(0, 3).map((subject) => (
                          <Badge key={subject} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                      {((application.pool_type === "speaker" &&
                        (application.speaker_topics?.length || 0) > 3) ||
                        (application.pool_type === "teacher" &&
                          (application.subjects_qualified?.length || 0) > 3)) && (
                        <Badge variant="outline">
                          +
                          {application.pool_type === "speaker"
                            ? (application.speaker_topics?.length || 0) - 3
                            : (application.subjects_qualified?.length || 0) - 3}{" "}
                          more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusColors[application.application_status]}>
                      {statusLabels[application.application_status]}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PoolApplicationDetailDialog
        application={selectedApplication}
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      />
    </div>
  );
}
