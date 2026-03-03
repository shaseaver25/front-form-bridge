import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePoolMember } from "@/hooks/usePoolMembers";
import { useSubmitFeedback } from "@/hooks/useEmployeeFeedback";
import {
  getRatingCategories,
  getQuestionsForEvaluator,
  type FeedbackType,
  type EvaluatorType,
} from "@/types/employee-feedback";

export default function FeedbackForm() {
  const { type, employeeId } = useParams<{ type: FeedbackType; employeeId: string }>();
  const navigate = useNavigate();
  const feedbackType = type as FeedbackType;

  const { data: employee, isLoading } = usePoolMember(employeeId || "");
  const submitFeedback = useSubmitFeedback();

  const [evaluatorType, setEvaluatorType] = useState<EvaluatorType | "">("");
  const [evaluatorName, setEvaluatorName] = useState("");
  const [evaluatorEmail, setEvaluatorEmail] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const ratingCategories = getRatingCategories(feedbackType);
  const questions = evaluatorType ? getQuestionsForEvaluator(feedbackType, evaluatorType) : [];

  const evaluatorOptions: { value: EvaluatorType; label: string }[] =
    feedbackType === "speaker"
      ? [
          { value: "site_manager", label: "Site Manager" },
          { value: "audience", label: "Audience Member" },
        ]
      : [
          { value: "site_manager", label: "Site Manager" },
          { value: "student", label: "Student" },
          { value: "parent", label: "Parent" },
        ];

  const handleRatingChange = (category: string, score: number) => {
    setRatings((prev) => ({ ...prev, [category]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!evaluatorType || !evaluatorName || !eventName || !eventDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const allRated = ratingCategories.every((cat) => ratings[cat.key]);
    if (!allRated) {
      toast.error("Please provide all ratings");
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        employee_id: employeeId!,
        feedback_type: feedbackType,
        evaluator_type: evaluatorType,
        evaluator_name: evaluatorName,
        evaluator_email: evaluatorEmail || undefined,
        event_date: eventDate,
        event_name: eventName,
        ratings: Object.entries(ratings).map(([category, score]) => ({
          category,
          score,
        })),
        comments: Object.entries(comments)
          .filter(([_, response]) => response.trim())
          .map(([question_key, response]) => ({
            question_key,
            response,
          })),
      });

      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Employee not found</p>
            <Button className="mt-4" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback for {employee.first_name} {employee.last_name} has been submitted successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Your responses are confidential and will be used to improve our programs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">
                {employee.first_name?.[0]}
                {employee.last_name?.[0]}
              </span>
            </div>
            <CardTitle>
              {feedbackType === "speaker" ? "Speaker" : "Teacher"} Feedback
            </CardTitle>
            <CardDescription>
              {employee.first_name} {employee.last_name}
            </CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Evaluator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evaluatorType">Your Role *</Label>
                <Select value={evaluatorType} onValueChange={(v) => setEvaluatorType(v as EvaluatorType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluatorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluatorName">Your Name *</Label>
                <Input
                  id="evaluatorName"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluatorEmail">Your Email (optional)</Label>
                <Input
                  id="evaluatorEmail"
                  type="email"
                  value={evaluatorEmail}
                  onChange={(e) => setEvaluatorEmail(e.target.value)}
                  placeholder="For follow-up questions"
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event/Program Name *</Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter the event or program name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ratings</CardTitle>
              <CardDescription>Rate each category from 1 (Poor) to 5 (Excellent)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ratingCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label className="font-medium">{category.label}</Label>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleRatingChange(category.key, score)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            ratings[category.key] >= score
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Feedback</CardTitle>
                <CardDescription>Your detailed feedback helps us improve</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((q) => (
                  <div key={q.key} className="space-y-2">
                    <Label htmlFor={q.key}>{q.label}</Label>
                    <Textarea
                      id={q.key}
                      value={comments[q.key] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({ ...prev, [q.key]: e.target.value }))
                      }
                      placeholder="Enter your response"
                      rows={3}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitFeedback.isPending}
          >
            {submitFeedback.isPending ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
