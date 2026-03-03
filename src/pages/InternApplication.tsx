import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ArrowLeft, ArrowRight, Upload, GraduationCap } from "lucide-react";

const LOCAL_SCHOOLS = [
  "University of Minnesota",
  "Augsburg University",
  "University of St. Thomas",
  "Hamline University",
  "Macalester College",
  "Minneapolis College",
  "North Hennepin Community College",
  "Metropolitan State University",
  "Minnesota State University, Mankato",
  "St. Cloud State University",
  "Dunwoody College of Technology",
  "Minneapolis College of Art and Design",
  "Other",
];

const AREAS_OF_INTEREST = [
  "Software Development",
  "Graphic Design",
  "Marketing & Communications",
  "Event Planning",
  "Community Outreach",
  "Data & Analytics",
  "Video Production",
  "Social Media",
  "Education / Teaching",
  "Nonprofit Administration",
  "AI & Machine Learning",
  "Other",
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["Morning (8am-12pm)", "Afternoon (12pm-5pm)", "Evening (5pm-9pm)"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email is required").max(255),
  phone: z.string().max(20).optional(),
  preferredContactMethod: z.enum(["email", "phone", "text"]).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  school: z.string().min(1, "School is required").max(200),
  otherSchool: z.string().max(200).optional(),
  graduationYear: z.string().min(1, "Expected graduation year is required"),
  major: z.string().min(1, "Major / program of study is required").max(200),
  gpa: z.string().max(10).optional(),
  areasOfInterest: z.array(z.string()).min(1, "Select at least one area of interest"),
  availableDays: z.array(z.string()).optional(),
  preferredTimeSlots: z.array(z.string()).optional(),
  hoursPerWeek: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  availabilityNotes: z.string().max(1000).optional(),
  whyInterested: z.string().min(1, "Please tell us why you're interested").max(2000),
  relevantExperience: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  backgroundCheckConsent: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function InternApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      state: "MN",
      zipCode: "",
      school: "",
      otherSchool: "",
      graduationYear: "",
      major: "",
      gpa: "",
      areasOfInterest: [],
      availableDays: [],
      preferredTimeSlots: [],
      hoursPerWeek: "",
      startDate: "",
      endDate: "",
      availabilityNotes: "",
      whyInterested: "",
      relevantExperience: "",
      linkedinUrl: "",
      websiteUrl: "",
      backgroundCheckConsent: false,
    },
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  const watchSchool = form.watch("school");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const schoolName = data.school === "Other" ? (data.otherSchool || "Other") : data.school;

      const applicationData = {
        pool_type: "intern",
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        preferred_contact_method: data.preferredContactMethod || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zipCode || null,
        current_employer: schoolName,
        current_title: data.major,
        linkedin_url: data.linkedinUrl || null,
        website_url: data.websiteUrl || null,
        available_days: data.availableDays?.length ? data.availableDays : null,
        preferred_time_slots: data.preferredTimeSlots?.length ? data.preferredTimeSlots : null,
        availability_notes: data.availabilityNotes || null,
        speaker_topics: data.areasOfInterest,
        bio: `Graduation: ${data.graduationYear} | GPA: ${data.gpa || "N/A"} | Hours/week: ${data.hoursPerWeek || "Flexible"} | Start: ${data.startDate || "Flexible"} | End: ${data.endDate || "Flexible"}`,
        why_interested: data.whyInterested || null,
        relevant_experience: data.relevantExperience || null,
        background_check_consent: data.backgroundCheckConsent || false,
        application_status: "pending" as const,
        total_engagements: 0,
        organization_id: null,
      };

      const { error } = await supabase
        .from("pool_applications")
        .insert(applicationData);

      if (error) throw error;

      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      setConfirmationNumber(`INT-${timestamp}-${random}`);
      setIsSubmitted(true);
      toast.success("Intern application submitted successfully!");
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
        fieldsToValidate = ["school", "graduationYear", "major", "areasOfInterest"];
        break;
      case 3:
        fieldsToValidate = [];
        break;
    }
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

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
                Your intern application has been received and is now under review.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">Confirmation Number</p>
                <p className="text-xl font-mono font-bold">{confirmationNumber}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Our team will review your application and reach out within 5-7 business days.
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
      <div className="bg-[#0D7377] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Intern Application
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join createMPLS as an intern and gain hands-on experience in nonprofit work,
            technology, education, and community building.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Tell us about yourself</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl><Input placeholder="First name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl><Input placeholder="Last name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl><Input type="email" placeholder="you@school.edu" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="preferredContactMethod" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Contact Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="text">Text Message</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="Minneapolis" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {US_STATES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="zipCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl><Input placeholder="55401" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: School & Program */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Education & Interests</CardTitle>
                    <CardDescription>Tell us about your school and what you'd like to work on</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="school" render={({ field }) => (
                      <FormItem>
                        <FormLabel>School / University *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your school" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {LOCAL_SCHOOLS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {watchSchool === "Other" && (
                      <FormField control={form.control} name="otherSchool" render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl><Input placeholder="Enter your school name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="major" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Major / Program of Study *</FormLabel>
                          <FormControl><Input placeholder="e.g., Computer Science" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="graduationYear" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Graduation *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {["Spring 2025", "Fall 2025", "Spring 2026", "Fall 2026", "Spring 2027", "Fall 2027", "2028+"].map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="gpa" render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA (optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., 3.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormItem>
                      <FormLabel>Areas of Interest *</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
                      <div className="grid grid-cols-2 gap-2">
                        {AREAS_OF_INTEREST.map((area) => (
                          <FormField key={area} control={form.control} name="areasOfInterest" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(area)}
                                  onCheckedChange={(checked) => {
                                    const val = field.value || [];
                                    field.onChange(checked ? [...val, area] : val.filter((v) => v !== area));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{area}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      {form.formState.errors.areasOfInterest && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.areasOfInterest.message}</p>
                      )}
                    </FormItem>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio / Website</FormLabel>
                          <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Availability */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Availability</CardTitle>
                    <CardDescription>When are you available to intern?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Start Date</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred End Date</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="hoursPerWeek" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours Per Week</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="5-10">5-10 hours</SelectItem>
                              <SelectItem value="10-15">10-15 hours</SelectItem>
                              <SelectItem value="15-20">15-20 hours</SelectItem>
                              <SelectItem value="20-30">20-30 hours</SelectItem>
                              <SelectItem value="30-40">30-40 hours (full-time)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormItem>
                      <FormLabel>Available Days</FormLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <FormField key={day} control={form.control} name="availableDays" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day)}
                                  onCheckedChange={(checked) => {
                                    const val = field.value || [];
                                    field.onChange(checked ? [...val, day] : val.filter((v) => v !== day));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{day}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Preferred Time Slots</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <FormField key={slot} control={form.control} name="preferredTimeSlots" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(slot)}
                                  onCheckedChange={(checked) => {
                                    const val = field.value || [];
                                    field.onChange(checked ? [...val, slot] : val.filter((v) => v !== slot));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{slot}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </FormItem>

                    <FormField control={form.control} name="availabilityNotes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any scheduling constraints, class schedule info, etc." className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Motivation & Submit */}
              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tell Us More</CardTitle>
                    <CardDescription>Help us understand your goals and experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="whyInterested" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why are you interested in interning with createMPLS? *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share what excites you about our mission, what you hope to learn, and how this fits your career goals..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="relevantExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relevant Experience or Projects</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe any coursework, projects, volunteer work, or jobs that are relevant..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="backgroundCheckConsent" render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Background Check Consent</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            I consent to a background check if required for this internship position.
                          </p>
                        </div>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {step < totalSteps ? (
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
      </div>
    </div>
  );
}
