import { useState } from "react";
import { usePoolReferences, PoolReference, useUpdatePoolReference, RecommendationLevel } from "@/hooks/usePoolReferences";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  Building,
  Users,
  CheckCircle,
  Clock,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

interface ReferencesListProps {
  applicationId: string;
}

const recommendationColors: Record<RecommendationLevel, string> = {
  highly_recommend: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  recommend: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  do_not_recommend: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const recommendationLabels: Record<RecommendationLevel, string> = {
  highly_recommend: "Highly Recommend",
  recommend: "Recommend",
  neutral: "Neutral",
  do_not_recommend: "Do Not Recommend",
};

export function ReferencesList({ applicationId }: ReferencesListProps) {
  const { data: references, isLoading } = usePoolReferences(applicationId);
  const updateReference = useUpdatePoolReference();
  const [feedbackRef, setFeedbackRef] = useState<PoolReference | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [recommendation, setRecommendation] = useState<RecommendationLevel | "">("");

  const handleMarkContacted = async (ref: PoolReference) => {
    await updateReference.mutateAsync({
      id: ref.id,
      contacted: true,
      contacted_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleOpenFeedback = (ref: PoolReference) => {
    setFeedbackRef(ref);
    setFeedbackText(ref.feedback || "");
    setRecommendation(ref.recommendation_level || "");
  };

  const handleSaveFeedback = async () => {
    if (!feedbackRef) return;
    await updateReference.mutateAsync({
      id: feedbackRef.id,
      feedback: feedbackText || null,
      recommendation_level: recommendation || null,
      contacted: true,
      contacted_date: feedbackRef.contacted_date || new Date().toISOString().split("T")[0],
    });
    setFeedbackRef(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!references || references.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No references added yet
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {references.map((ref) => (
          <Card key={ref.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{ref.reference_name}</h4>
                    {ref.recommendation_level && (
                      <Badge className={recommendationColors[ref.recommendation_level]}>
                        {recommendationLabels[ref.recommendation_level]}
                      </Badge>
                    )}
                    {ref.contacted && !ref.recommendation_level && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Contacted
                      </Badge>
                    )}
                    {!ref.contacted && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {ref.reference_email && (
                      <a
                        href={`mailto:${ref.reference_email}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-4 w-4" />
                        {ref.reference_email}
                      </a>
                    )}
                    {ref.reference_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {ref.reference_phone}
                      </span>
                    )}
                    {ref.organization && (
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {ref.organization}
                      </span>
                    )}
                    {ref.relationship && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {ref.relationship}
                      </span>
                    )}
                  </div>

                  {ref.feedback && (
                    <p className="text-sm text-muted-foreground italic">
                      "{ref.feedback}"
                    </p>
                  )}

                  {ref.contacted_date && (
                    <p className="text-xs text-muted-foreground">
                      Contacted on {format(new Date(ref.contacted_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {!ref.contacted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkContacted(ref)}
                      disabled={updateReference.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Contacted
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenFeedback(ref)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {ref.feedback ? "Edit Feedback" : "Add Feedback"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!feedbackRef} onOpenChange={(open) => !open && setFeedbackRef(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reference Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recommendation Level</Label>
              <Select
                value={recommendation}
                onValueChange={(v) => setRecommendation(v as RecommendationLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highly_recommend">Highly Recommend</SelectItem>
                  <SelectItem value="recommend">Recommend</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="do_not_recommend">Do Not Recommend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Feedback Notes</Label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Notes from reference check conversation..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFeedbackRef(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFeedback} disabled={updateReference.isPending}>
                {updateReference.isPending ? "Saving..." : "Save Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
