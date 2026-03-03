import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Mic, BookOpen, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { PoolApplicationPersonalSection } from "@/components/pool-application/PoolApplicationPersonalSection";
import { PoolApplicationProfessionalSection } from "@/components/pool-application/PoolApplicationProfessionalSection";
import { PoolApplicationAvailabilitySection } from "@/components/pool-application/PoolApplicationAvailabilitySection";
import { PoolApplicationSpeakerSection } from "@/components/pool-application/PoolApplicationSpeakerSection";
import { PoolApplicationTeacherSection } from "@/components/pool-application/PoolApplicationTeacherSection";
import { PoolApplicationQuestionsSection } from "@/components/pool-application/PoolApplicationQuestionsSection";
import { PoolApplicationFilesSection } from "@/components/pool-application/PoolApplicationFilesSection";

const formSchema = z.object({
  poolType: z.enum(["speaker", "teacher"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "text"]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  currentEmployer: z.string().optional(),
  currentTitle: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  yearsOfExperience: z.number().optional(),
  bio: z.string().optional(),
  availableDays: z.array(z.string()).optional(),
  preferredTimeSlots: z.array(z.string()).optional(),
  availabilityNotes: z.string().optional(),
  teachingCertifications: z.string().optional(),
  gradeLevelsComfortable: z.array(z.string()).optional(),
  subjectsQualified: z.array(z.string()).optional(),
  classroomManagementExperience: z.string().optional(),
  curriculumDevelopmentExperience: z.boolean().optional(),
  backgroundCheckConsent: z.boolean().optional(),
  speakerTopics: z.array(z.string()).optional(),
  speakerExperienceLevel: z.enum(["beginner", "intermediate", "experienced", "professional"]).optional(),
  previousSpeakingEngagements: z.string().optional(),
  audienceSizesComfortable: z.array(z.string()).optional(),
  presentationStyle: z.array(z.string()).optional(),
  equipmentNeeds: z.string().optional(),
  speakerFeeExpectations: z.string().optional(),
  willingToVolunteer: z.boolean().optional(),
  whyInterested: z.string().optional(),
  relevantExperience: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PoolApplicationProps {
  defaultPoolType?: "speaker" | "teacher";
}

export default function PoolApplication({ defaultPoolType }: PoolApplicationProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(defaultPoolType ? 1 : 0);
  const [poolType, setPoolType] = useState<"speaker" | "teacher" | null>(defaultPoolType || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [files, setFiles] = useState<{
    resume: File | null;
    references: File | null;
    headshot: File | null;
  }>({ resume: null, references: null, headshot: null });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poolType: defaultPoolType,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      state: "MN",
      zipCode: "",
      currentEmployer: "",
      currentTitle: "",
      linkedinUrl: "",
      websiteUrl: "",
      bio: "",
      availableDays: [],
      preferredTimeSlots: [],
      availabilityNotes: "",
      teachingCertifications: "",
      gradeLevelsComfortable: [],
      subjectsQualified: [],
      classroomManagementExperience: "",
      curriculumDevelopmentExperience: false,
      backgroundCheckConsent: false,
      speakerTopics: [],
      previousSpeakingEngagements: "",
      audienceSizesComfortable: [],
      presentationStyle: [],
      equipmentNeeds: "",
      speakerFeeExpectations: "",
      willingToVolunteer: false,
      whyInterested: "",
      relevantExperience: "",
    },
  });

  const totalSteps = 6;
  const progress = ((step + 1) / totalSteps) * 100;

  const selectPoolType = (type: "speaker" | "teacher") => {
    setPoolType(type);
    form.setValue("poolType", type);
    setStep(1);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileName = `${folder}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("pool-application-files")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        toast.error(`File upload failed: ${error.message}. Your application will still be submitted.`);
        return null;
      }
      return fileName;
    } catch (err) {
      console.error("Upload exception:", err);
      toast.error("File upload failed. Your application will still be submitted.");
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let resumePath = null;
      let referencesPath = null;
      let headshotPath = null;

      if (files.resume) {
        resumePath = await uploadFile(files.resume, "resumes");
      }
      if (files.references) {
        referencesPath = await uploadFile(files.references, "references");
      }
      if (files.headshot) {
        headshotPath = await uploadFile(files.headshot, "headshots");
      }

      const applicationData = {
        pool_type: data.poolType,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        preferred_contact_method: data.preferredContactMethod || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zipCode || null,
        current_employer: data.currentEmployer || null,
        current_title: data.currentTitle || null,
        linkedin_url: data.linkedinUrl || null,
        website_url: data.websiteUrl || null,
        years_of_experience: data.yearsOfExperience || null,
        bio: data.bio || null,
        available_days: data.availableDays?.length ? data.availableDays : null,
        preferred_time_slots: data.preferredTimeSlots?.length ? data.preferredTimeSlots : null,
        availability_notes: data.availabilityNotes || null,
        teaching_certifications: data.teachingCertifications || null,
        grade_levels_comfortable: data.gradeLevelsComfortable?.length ? data.gradeLevelsComfortable : null,
        subjects_qualified: data.subjectsQualified?.length ? data.subjectsQualified : null,
        classroom_management_experience: data.classroomManagementExperience || null,
        curriculum_development_experience: data.curriculumDevelopmentExperience || false,
        background_check_consent: data.backgroundCheckConsent || false,
        speaker_topics: data.speakerTopics?.length ? data.speakerTopics : null,
        speaker_experience_level: data.speakerExperienceLevel || null,
        previous_speaking_engagements: data.previousSpeakingEngagements || null,
        audience_sizes_comfortable: data.audienceSizesComfortable?.length ? data.audienceSizesComfortable : null,
        presentation_style: data.presentationStyle?.length ? data.presentationStyle : null,
        equipment_needs: data.equipmentNeeds || null,
        speaker_fee_expectations: data.speakerFeeExpectations || null,
        willing_to_volunteer: data.willingToVolunteer || false,
        why_interested: data.whyInterested || null,
        relevant_experience: data.relevantExperience || null,
        resume_file_path: resumePath,
        references_file_path: referencesPath,
        headshot_file_path: headshotPath,
        application_status: "pending" as const,
        total_engagements: 0,
        organization_id: null,
      };

      const { error } = await supabase
        .from("pool_applications")
        .insert(applicationData);

      if (error) throw error;

      // Generate confirmation number from timestamp and random string
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const confNum = `APP-${timestamp}-${random}`;
      setConfirmationNumber(confNum);
      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "email"];
        break;
      case 2:
        fieldsToValidate = [];
        break;
      case 3:
        fieldsToValidate = [];
        break;
      case 4:
        fieldsToValidate = [];
        break;
      case 5:
        fieldsToValidate = [];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  };

  const prevStep = () => {
    if (step === 1) {
      setPoolType(null);
      setStep(0);
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-[#0D7377] text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Application Submitted</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-4">
                Your application has been received and is now under review.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">Confirmation Number</p>
                <p className="text-xl font-mono font-bold">{confirmationNumber}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                A confirmation email has been sent to your email address. Our team will review your
                application and reach out within 5-7 business days.
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-[#0D7377] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Join Our Educator & Speaker Network
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Share your expertise with our community through AI Whisperers speaking engagements or
            createMPLS teaching opportunities.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {step === 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              How would you like to contribute?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:border-[#0D7377]"
                onClick={() => selectPoolType("speaker")}
              >
                <CardHeader className="text-center">
                  <div className="h-16 w-16 bg-[#0D7377]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Mic className="h-8 w-8 text-[#0D7377]" />
                  </div>
                  <CardTitle>Speaker</CardTitle>
                  <CardDescription>AI Whisperers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Share your AI expertise with our community through presentations, workshops, and
                    panel discussions.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:border-[#0D7377]"
                onClick={() => selectPoolType("teacher")}
              >
                <CardHeader className="text-center">
                  <div className="h-16 w-16 bg-[#0D7377]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="h-8 w-8 text-[#0D7377]" />
                  </div>
                  <CardTitle>Teacher</CardTitle>
                  <CardDescription>createMPLS</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Inspire the next generation of innovators through STEM and AI literacy programs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {step} of {totalSteps - 1}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && <PoolApplicationPersonalSection form={form} />}
                {step === 2 && <PoolApplicationProfessionalSection form={form} />}
                {step === 3 && <PoolApplicationAvailabilitySection form={form} />}
                {step === 4 && (
                  poolType === "speaker" ? (
                    <PoolApplicationSpeakerSection form={form} />
                  ) : (
                    <PoolApplicationTeacherSection form={form} />
                  )
                )}
                {step === 5 && (
                  <div className="space-y-6">
                    <PoolApplicationQuestionsSection form={form} poolType={poolType!} />
                    <PoolApplicationFilesSection files={files} setFiles={setFiles} />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  {step < 5 ? (
                    <Button type="button" onClick={nextStep} className="bg-[#0D7377] hover:bg-[#0D7377]/90">
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-[#0D7377] hover:bg-[#0D7377]/90">
                      {isSubmitting ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
