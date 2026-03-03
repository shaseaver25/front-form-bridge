import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreatePoolApplication, PoolType } from "@/hooks/usePoolApplications";
import { Mic, GraduationCap } from "lucide-react";

const formSchema = z.object({
  pool_type: z.enum(["speaker", "teacher", "intern"]),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  preferred_contact_method: z.enum(["email", "phone", "text"]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  availability_notes: z.string().optional(),
  available_days: z.array(z.string()).optional(),
  preferred_time_slots: z.array(z.string()).optional(),
  current_employer: z.string().optional(),
  current_title: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
  years_of_experience: z.number().optional(),
  // Teacher fields
  teaching_certifications: z.string().optional(),
  grade_levels_comfortable: z.array(z.string()).optional(),
  subjects_qualified: z.array(z.string()).optional(),
  classroom_management_experience: z.string().optional(),
  curriculum_development_experience: z.boolean().optional(),
  background_check_consent: z.boolean().optional(),
  // Speaker fields
  speaker_topics: z.array(z.string()).optional(),
  speaker_experience_level: z.enum(["beginner", "intermediate", "experienced", "professional"]).optional(),
  previous_speaking_engagements: z.string().optional(),
  audience_sizes_comfortable: z.array(z.string()).optional(),
  presentation_style: z.array(z.string()).optional(),
  equipment_needs: z.string().optional(),
  speaker_fee_expectations: z.string().optional(),
  willing_to_volunteer: z.boolean().optional(),
  // Application content
  bio: z.string().optional(),
  why_interested: z.string().optional(),
  relevant_experience: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPoolApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPoolType: PoolType;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["Morning (8am-12pm)", "Afternoon (12pm-5pm)", "Evening (5pm-9pm)"];
const GRADE_LEVELS = ["Elementary (K-5)", "Middle School (6-8)", "High School (9-12)", "Adult/Professional"];
const AUDIENCE_SIZES = ["Small (1-25)", "Medium (25-100)", "Large (100+)"];
const PRESENTATION_STYLES = ["Lecture", "Workshop", "Panel", "Q&A", "Hands-on Demo"];

export function AddPoolApplicationDialog({
  open,
  onOpenChange,
  defaultPoolType,
}: AddPoolApplicationDialogProps) {
  const [step, setStep] = useState(1);
  const createApplication = useCreatePoolApplication();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pool_type: defaultPoolType,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      state: "MN",
      available_days: [],
      preferred_time_slots: [],
      grade_levels_comfortable: [],
      subjects_qualified: [],
      speaker_topics: [],
      audience_sizes_comfortable: [],
      presentation_style: [],
      curriculum_development_experience: false,
      background_check_consent: false,
      willing_to_volunteer: false,
    },
  });

  const poolType = form.watch("pool_type");

  const onSubmit = async (values: FormValues) => {
    try {
      await createApplication.mutateAsync({
        pool_type: values.pool_type,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || null,
        preferred_contact_method: values.preferred_contact_method || null,
        city: values.city || null,
        state: values.state || null,
        zip_code: values.zip_code || null,
        availability_notes: values.availability_notes || null,
        available_days: values.available_days || null,
        preferred_time_slots: values.preferred_time_slots || null,
        current_employer: values.current_employer || null,
        current_title: values.current_title || null,
        linkedin_url: values.linkedin_url || null,
        website_url: values.website_url || null,
        years_of_experience: values.years_of_experience || null,
        teaching_certifications: values.teaching_certifications || null,
        grade_levels_comfortable: values.grade_levels_comfortable || null,
        subjects_qualified: values.subjects_qualified || null,
        classroom_management_experience: values.classroom_management_experience || null,
        curriculum_development_experience: values.curriculum_development_experience || false,
        background_check_consent: values.background_check_consent || false,
        speaker_topics: values.speaker_topics || null,
        speaker_experience_level: values.speaker_experience_level || null,
        previous_speaking_engagements: values.previous_speaking_engagements || null,
        audience_sizes_comfortable: values.audience_sizes_comfortable || null,
        presentation_style: values.presentation_style || null,
        equipment_needs: values.equipment_needs || null,
        speaker_fee_expectations: values.speaker_fee_expectations || null,
        willing_to_volunteer: values.willing_to_volunteer || false,
        bio: values.bio || null,
        why_interested: values.why_interested || null,
        relevant_experience: values.relevant_experience || null,
        application_status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        overall_rating: null,
        total_engagements: 0,
        last_engagement_date: null,
        resume_file_path: null,
        references_file_path: null,
        headshot_file_path: null,
        organization_id: null,
      });
      onOpenChange(false);
      form.reset();
      setStep(1);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {poolType === "speaker" ? (
              <Mic className="h-5 w-5" />
            ) : (
              <GraduationCap className="h-5 w-5" />
            )}
            Add {poolType === "speaker" ? "Speaker" : "Teacher"} Application
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <Tabs value={String(step)} onValueChange={(v) => setStep(Number(v))}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="1">Basic Info</TabsTrigger>
                  <TabsTrigger value="2">Professional</TabsTrigger>
                  <TabsTrigger value="3">{poolType === "speaker" ? "Speaker" : "Teacher"}</TabsTrigger>
                  <TabsTrigger value="4">Application</TabsTrigger>
                </TabsList>

                <TabsContent value="1" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="pool_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pool Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pool type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="speaker">AI Whisperers Speaker</SelectItem>
                            <SelectItem value="teacher">createMPLS Teacher</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferred_contact_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Contact</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormItem>
                    <FormLabel>Available Days</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day}
                          control={form.control}
                          name="available_days"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, day]);
                                    } else {
                                      field.onChange(value.filter((v) => v !== day));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{day}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Preferred Time Slots</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <FormField
                          key={slot}
                          control={form.control}
                          name="preferred_time_slots"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(slot)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, slot]);
                                    } else {
                                      field.onChange(value.filter((v) => v !== slot));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{slot}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="availability_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Any specific availability constraints..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="2" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="current_employer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Employer</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="current_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="years_of_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://linkedin.com/in/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="3" className="space-y-4 mt-4">
                  {poolType === "speaker" ? (
                    <>
                      <FormField
                        control={form.control}
                        name="speaker_experience_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speaking Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="experienced">Experienced</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="speaker_topics"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speaker Topics (comma-separated)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value?.join(", ") || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                                  )
                                }
                                placeholder="AI Ethics, Machine Learning, Prompt Engineering..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel>Audience Sizes Comfortable With</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {AUDIENCE_SIZES.map((size) => (
                            <FormField
                              key={size}
                              control={form.control}
                              name="audience_sizes_comfortable"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(size)}
                                      onCheckedChange={(checked) => {
                                        const value = field.value || [];
                                        if (checked) {
                                          field.onChange([...value, size]);
                                        } else {
                                          field.onChange(value.filter((v) => v !== size));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{size}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>

                      <FormItem>
                        <FormLabel>Presentation Styles</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {PRESENTATION_STYLES.map((style) => (
                            <FormField
                              key={style}
                              control={form.control}
                              name="presentation_style"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(style)}
                                      onCheckedChange={(checked) => {
                                        const value = field.value || [];
                                        if (checked) {
                                          field.onChange([...value, style]);
                                        } else {
                                          field.onChange(value.filter((v) => v !== style));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{style}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>

                      <FormField
                        control={form.control}
                        name="previous_speaking_engagements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Speaking Engagements</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Describe previous speaking experiences..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="equipment_needs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipment Needs</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Projector, microphone, etc." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="speaker_fee_expectations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fee Expectations</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Fee range or hourly rate" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="willing_to_volunteer"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Willing to volunteer for select events</FormLabel>
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="teaching_certifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teaching Certifications</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="List any teaching certifications..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel>Grade Levels Comfortable With</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {GRADE_LEVELS.map((level) => (
                            <FormField
                              key={level}
                              control={form.control}
                              name="grade_levels_comfortable"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(level)}
                                      onCheckedChange={(checked) => {
                                        const value = field.value || [];
                                        if (checked) {
                                          field.onChange([...value, level]);
                                        } else {
                                          field.onChange(value.filter((v) => v !== level));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{level}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>

                      <FormField
                        control={form.control}
                        name="subjects_qualified"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subjects Qualified (comma-separated)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value?.join(", ") || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                                  )
                                }
                                placeholder="STEM, AI Literacy, Computer Science..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="classroom_management_experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Classroom Management Experience</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Describe your classroom management experience..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="curriculum_development_experience"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Has curriculum development experience</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="background_check_consent"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Consents to background check</FormLabel>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="4" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Professional bio..." rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="why_interested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why are you interested?</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="What motivates you to join this pool..." rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relevant_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relevant Experience</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe relevant experience..." rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <div className="flex justify-between pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                {step < 4 ? (
                  <Button type="button" onClick={() => setStep(step + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={createApplication.isPending}>
                    {createApplication.isPending ? "Creating..." : "Create Application"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
