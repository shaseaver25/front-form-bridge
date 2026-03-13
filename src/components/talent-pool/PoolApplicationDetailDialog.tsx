import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  PoolApplication,
  ApplicationStatus,
  useUpdatePoolApplication,
} from "@/hooks/usePoolApplications";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Mic,
  GraduationCap,
  Calendar,
  ExternalLink,
  Clock,
  CheckCircle2,
  Plus,
  UserPlus,
  FileText,
  Image,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { EngagementsList } from "./EngagementsList";
import { AddEngagementDialog } from "./AddEngagementDialog";
import { ReferencesList } from "./ReferencesList";
import { AddReferenceDialog } from "./AddReferenceDialog";
import { toast } from "sonner";

interface PoolApplicationDetailDialogProps {
  application: PoolApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function FilesSection({ application }: { application: PoolApplication }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = async (filePath: string, fileName: string) => {
    setDownloading(filePath);
    try {
      const { data, error } = await supabase.storage
        .from("pool-application-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  const viewFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("pool-application-files")
        .createSignedUrl(filePath, 3600);

      if (error || !data?.signedUrl) {
        throw new Error("Failed to generate signed URL");
      }

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view file");
    }
  };

  const hasFiles = application.resume_file_path || application.references_file_path || application.headshot_file_path;

  if (!hasFiles) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No files uploaded with this application
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {application.resume_file_path && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Resume/CV</p>
                <p className="text-xs text-muted-foreground">
                  {application.resume_file_path.split("/").pop()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(application.resume_file_path!, "Resume.pdf")}
              disabled={downloading === application.resume_file_path}
            >
              {downloading === application.resume_file_path ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {application.references_file_path && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">References</p>
                <p className="text-xs text-muted-foreground">
                  {application.references_file_path.split("/").pop()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(application.references_file_path!, "References.pdf")}
              disabled={downloading === application.references_file_path}
            >
              {downloading === application.references_file_path ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {application.headshot_file_path && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Headshot</p>
                <p className="text-xs text-muted-foreground">
                  {application.headshot_file_path.split("/").pop()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewFile(application.headshot_file_path!)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(application.headshot_file_path!, "Headshot.jpg")}
                disabled={downloading === application.headshot_file_path}
              >
                {downloading === application.headshot_file_path ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PoolApplicationDetailDialog({
  application,
  open,
  onOpenChange,
}: PoolApplicationDetailDialogProps) {
  const [newStatus, setNewStatus] = useState<ApplicationStatus | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showAddEngagement, setShowAddEngagement] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);
  const updateApplication = useUpdatePoolApplication();

  if (!application) return null;

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    await updateApplication.mutateAsync({
      id: application.id,
      application_status: newStatus,
      review_notes: reviewNotes || application.review_notes,
      reviewed_at: new Date().toISOString(),
    });
    setNewStatus(null);
    setReviewNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {application.pool_type === "speaker" ? (
                <Mic className="h-5 w-5" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
              {application.first_name} {application.last_name}
            </DialogTitle>
            <Badge className={statusColors[application.application_status]}>
              {statusLabels[application.application_status]}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">
                {application.pool_type === "speaker" ? "Speaker Details" : "Teacher Details"}
              </TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="engagements">Engagements</TabsTrigger>
              <TabsTrigger value="references">References</TabsTrigger>
              <TabsTrigger value="application">Application</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${application.email}`} className="hover:underline">
                      {application.email}
                    </a>
                  </span>
                  {application.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {application.phone}
                    </span>
                  )}
                  {application.city && application.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {application.city}, {application.state} {application.zip_code}
                    </span>
                  )}
                </div>

                {(application.current_employer || application.current_title) && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {application.current_title}
                      {application.current_title && application.current_employer && " at "}
                      {application.current_employer}
                    </span>
                  </div>
                )}

                <div className="flex gap-4">
                  {application.linkedin_url && (
                    <a
                      href={application.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {application.website_url && (
                    <a
                      href={application.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Availability
                  </h4>
                  {application.available_days && application.available_days.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {application.available_days.map((day) => (
                        <Badge key={day} variant="outline">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {application.preferred_time_slots && application.preferred_time_slots.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {application.preferred_time_slots.map((slot) => (
                        <Badge key={slot} variant="secondary">
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {application.availability_notes && (
                    <p className="text-sm text-muted-foreground mt-2">{application.availability_notes}</p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{application.total_engagements}</div>
                    <div className="text-sm text-muted-foreground">Engagements</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      {application.overall_rating ? (
                        <>
                          <Star className="h-5 w-5 text-yellow-500" />
                          {application.overall_rating.toFixed(1)}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {application.years_of_experience ?? "—"}
                    </div>
                    <div className="text-sm text-muted-foreground">Years Exp.</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 mt-4">
              {application.pool_type === "speaker" ? (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Experience Level</h4>
                    <Badge>
                      {application.speaker_experience_level
                        ? application.speaker_experience_level.charAt(0).toUpperCase() +
                          application.speaker_experience_level.slice(1)
                        : "Not specified"}
                    </Badge>
                  </div>

                  {application.speaker_topics && application.speaker_topics.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Speaker Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.speaker_topics.map((topic) => (
                          <Badge key={topic} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {application.audience_sizes_comfortable && application.audience_sizes_comfortable.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Comfortable Audience Sizes</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.audience_sizes_comfortable.map((size) => (
                          <Badge key={size} variant="outline">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {application.presentation_style && application.presentation_style.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Presentation Styles</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.presentation_style.map((style) => (
                          <Badge key={style} variant="outline">
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {application.previous_speaking_engagements && (
                    <div>
                      <h4 className="font-medium mb-2">Previous Speaking Engagements</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.previous_speaking_engagements}
                      </p>
                    </div>
                  )}

                  {application.equipment_needs && (
                    <div>
                      <h4 className="font-medium mb-2">Equipment Needs</h4>
                      <p className="text-sm text-muted-foreground">{application.equipment_needs}</p>
                    </div>
                  )}

                  {application.speaker_fee_expectations && (
                    <div>
                      <h4 className="font-medium mb-2">Fee Expectations</h4>
                      <p className="text-sm text-muted-foreground">{application.speaker_fee_expectations}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        application.willing_to_volunteer ? "text-green-500" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">
                      {application.willing_to_volunteer
                        ? "Willing to volunteer for select events"
                        : "Not available for volunteer events"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {application.teaching_certifications && (
                    <div>
                      <h4 className="font-medium mb-2">Teaching Certifications</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.teaching_certifications}
                      </p>
                    </div>
                  )}

                  {application.grade_levels_comfortable && application.grade_levels_comfortable.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Grade Levels</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.grade_levels_comfortable.map((level) => (
                          <Badge key={level} variant="secondary">
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {application.subjects_qualified && application.subjects_qualified.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Subjects Qualified</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.subjects_qualified.map((subject) => (
                          <Badge key={subject} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {application.classroom_management_experience && (
                    <div>
                      <h4 className="font-medium mb-2">Classroom Management Experience</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.classroom_management_experience}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          application.curriculum_development_experience
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm">
                        {application.curriculum_development_experience
                          ? "Has curriculum development experience"
                          : "No curriculum development experience"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          application.background_check_consent
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm">
                        {application.background_check_consent
                          ? "Consents to background check"
                          : "Background check consent not given"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              <h4 className="font-medium">Uploaded Files</h4>
              <FilesSection application={application} />
            </TabsContent>

            <TabsContent value="engagements" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Engagement History</h4>
                {application.application_status === "approved" && (
                  <Button size="sm" onClick={() => setShowAddEngagement(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Book Engagement
                  </Button>
                )}
              </div>
              <EngagementsList memberId={application.id} />
            </TabsContent>

            <TabsContent value="references" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">References</h4>
                <Button size="sm" onClick={() => setShowAddReference(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Reference
                </Button>
              </div>
              <ReferencesList applicationId={application.id} />
            </TabsContent>

            <TabsContent value="application" className="space-y-6 mt-4">
              {application.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{application.bio}</p>
                </div>
              )}

              {application.why_interested && (
                <div>
                  <h4 className="font-medium mb-2">Why Interested</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.why_interested}
                  </p>
                </div>
              )}

              {application.relevant_experience && (
                <div>
                  <h4 className="font-medium mb-2">Relevant Experience</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.relevant_experience}
                  </p>
                </div>
              )}

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>
                  Applied on{" "}
                  {format(new Date(application.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                {application.last_engagement_date && (
                  <p>
                    Last engagement on{" "}
                    {format(new Date(application.last_engagement_date), "MMMM d, yyyy")}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-6 mt-4">
              <div>
                <h4 className="font-medium mb-2">Current Status</h4>
                <Badge className={statusColors[application.application_status]}>
                  {statusLabels[application.application_status]}
                </Badge>
                {application.reviewed_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last reviewed on {format(new Date(application.reviewed_at), "MMMM d, yyyy")}
                  </p>
                )}
              </div>

              {application.review_notes && (
                <div>
                  <h4 className="font-medium mb-2">Review Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.review_notes}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Update Status</h4>

                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select
                    value={newStatus || ""}
                    onValueChange={(v) => setNewStatus(v as ApplicationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updateApplication.isPending}
                >
                  {updateApplication.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>

      <AddEngagementDialog
        open={showAddEngagement}
        onOpenChange={setShowAddEngagement}
        member={application}
      />

      <AddReferenceDialog
        open={showAddReference}
        onOpenChange={setShowAddReference}
        applicationId={application.id}
      />
    </Dialog>
  );
}
