import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import type { Site } from "@/types/sites";

const siteFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  site_type: z.string().default("school"),
  organization_type: z.string().optional().nullable(),
  district_name: z.string().optional().nullable(),
  district_id: z.string().optional().nullable(),
  enrollment: z.coerce.number().optional().nullable(),
  grade_levels: z.array(z.string()).default([]),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().default("MN").nullable(),
  address_zip: z.string().optional().nullable(),
  relationship_status: z.string().default("prospect"),
  relationship_started_at: z.string().optional().nullable(),
  connection_source: z.string().optional().nullable(),
  connection_notes: z.string().optional().nullable(),
  budget_tier: z.string().optional().nullable(),
  decision_timeline: z.string().optional().nullable(),
  tech_readiness: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().or(z.literal("")).nullable(),
  contact_phone: z.string().optional().nullable(),
  instructor_name: z.string().optional().nullable(),
  volunteers_needed: z.boolean().default(false),
  meeting_time: z.string().optional().nullable(),
  meeting_days: z.array(z.string()).default([]),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

const siteTypes = [
  { value: "school", label: "School" },
  { value: "district", label: "School District" },
  { value: "organization", label: "Organization" },
  { value: "partner", label: "Partner" },
  { value: "community_center", label: "Community Center" },
  { value: "programming_site", label: "Programming Site" },
  { value: "field_office", label: "Field Office" },
  { value: "other", label: "Other" },
];

const organizationTypes = [
  { value: "public_school", label: "Public School" },
  { value: "charter", label: "Charter School" },
  { value: "private", label: "Private School" },
  { value: "intermediate_district", label: "Intermediate District" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "corporate", label: "Corporate" },
];

const relationshipStatuses = [
  { value: "prospect", label: "Prospect" },
  { value: "contacted", label: "Contacted" },
  { value: "in_conversation", label: "In Conversation" },
  { value: "pilot", label: "Pilot" },
  { value: "active_partner", label: "Active Partner" },
  { value: "inactive", label: "Inactive" },
  { value: "declined", label: "Declined" },
];

const budgetTiers = [
  { value: "high", label: "High Budget" },
  { value: "medium", label: "Medium Budget" },
  { value: "low", label: "Low Budget" },
  { value: "unknown", label: "Unknown" },
];

const techReadinessLevels = [
  { value: "high", label: "High - Strong tech infrastructure" },
  { value: "medium", label: "Medium - Basic tech in place" },
  { value: "low", label: "Low - Limited tech resources" },
  { value: "unknown", label: "Unknown" },
];

const connectionSources = [
  { value: "network", label: "Personal Network" },
  { value: "referral", label: "Referral" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "event", label: "Event/Conference" },
  { value: "inbound", label: "Inbound Inquiry" },
  { value: "existing_relationship", label: "Existing Relationship" },
];

const gradeOptions = ["PreK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface SiteFormProps {
  site?: Site;
  onSubmit: (data: SiteFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function SiteForm({ site, onSubmit, isSubmitting }: SiteFormProps) {
  const [tagInput, setTagInput] = useState("");

  // Fetch districts for dropdown
  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name")
        .in("site_type", ["district"])
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: site?.name ?? "",
      description: site?.description ?? "",
      site_type: site?.site_type ?? "school",
      organization_type: site?.organization_type ?? null,
      district_name: site?.district_name ?? null,
      district_id: site?.district_id ?? null,
      enrollment: site?.enrollment ?? null,
      grade_levels: site?.grade_levels ?? [],
      website: site?.website ?? "",
      phone: site?.phone ?? "",
      address_street: site?.address_street ?? "",
      address_city: site?.address_city ?? "",
      address_state: site?.address_state ?? "MN",
      address_zip: site?.address_zip ?? "",
      relationship_status: site?.relationship_status ?? "prospect",
      relationship_started_at: site?.relationship_started_at ?? null,
      connection_source: site?.connection_source ?? null,
      connection_notes: site?.connection_notes ?? "",
      budget_tier: site?.budget_tier ?? null,
      decision_timeline: site?.decision_timeline ?? "",
      tech_readiness: site?.tech_readiness ?? null,
      notes: site?.notes ?? "",
      tags: site?.tags ?? [],
      is_active: site?.is_active ?? true,
      start_date: site?.start_date ?? "",
      end_date: site?.end_date ?? "",
      contact_name: site?.contact_name ?? "",
      contact_email: site?.contact_email ?? "",
      contact_phone: site?.contact_phone ?? "",
      instructor_name: site?.instructor_name ?? "",
      volunteers_needed: site?.volunteers_needed ?? false,
      meeting_time: site?.meeting_time ?? "",
      meeting_days: site?.meeting_days ?? [],
    },
  });

  // Reset form when site changes
  useEffect(() => {
    if (site) {
      form.reset({
        name: site.name ?? "",
        description: site.description ?? "",
        site_type: site.site_type ?? "school",
        organization_type: site.organization_type ?? null,
        district_name: site.district_name ?? null,
        district_id: site.district_id ?? null,
        enrollment: site.enrollment ?? null,
        grade_levels: site.grade_levels ?? [],
        website: site.website ?? "",
        phone: site.phone ?? "",
        address_street: site.address_street ?? "",
        address_city: site.address_city ?? "",
        address_state: site.address_state ?? "MN",
        address_zip: site.address_zip ?? "",
        relationship_status: site.relationship_status ?? "prospect",
        relationship_started_at: site.relationship_started_at ?? null,
        connection_source: site.connection_source ?? null,
        connection_notes: site.connection_notes ?? "",
        budget_tier: site.budget_tier ?? null,
        decision_timeline: site.decision_timeline ?? "",
        tech_readiness: site.tech_readiness ?? null,
        notes: site.notes ?? "",
        tags: site.tags ?? [],
        is_active: site.is_active ?? true,
        start_date: site.start_date ?? "",
        end_date: site.end_date ?? "",
        contact_name: site.contact_name ?? "",
        contact_email: site.contact_email ?? "",
        contact_phone: site.contact_phone ?? "",
        instructor_name: site?.instructor_name ?? "",
        volunteers_needed: site?.volunteers_needed ?? false,
        meeting_time: site?.meeting_time ?? "",
        meeting_days: site?.meeting_days ?? [],
      });
    }
  }, [site, form]);

  const gradeLevels = form.watch("grade_levels") || [];
  const tags = form.watch("tags") || [];
  const meetingDays = form.watch("meeting_days") || [];

  const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day: string) => {
    const current = meetingDays;
    if (current.includes(day)) {
      form.setValue("meeting_days", current.filter((d) => d !== day));
    } else {
      form.setValue("meeting_days", [...current, day]);
    }
  };

  const toggleGrade = (grade: string) => {
    const current = gradeLevels;
    if (current.includes(grade)) {
      form.setValue("grade_levels", current.filter((g) => g !== grade));
    } else {
      form.setValue("grade_levels", [...current, grade]);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      form.setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    form.setValue("tags", tags.filter((t) => t !== tag));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizationTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent District</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "_none" ? null : value)} 
                      value={field.value ?? "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {districts?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enrollment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="500" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>Is this site currently active?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe this site..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Grade Levels</FormLabel>
              <div className="flex flex-wrap gap-2">
                {gradeOptions.map((grade) => (
                  <Badge
                    key={grade}
                    variant={gradeLevels.includes(grade) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGrade(grade)}
                  >
                    {grade}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address_street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="address_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="MN" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="55401" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Relationship */}
        <Card>
          <CardHeader>
            <CardTitle>Relationship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="relationship_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipStatuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="connection_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How did we connect?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {connectionSources.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship_started_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Started</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="connection_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Who introduced us, shared history, key context..." 
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Fit Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Fit Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="budget_tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetTiers.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tech_readiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Readiness</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select readiness" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {techReadinessLevels.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decision_timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Timeline</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spring 2026" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes & Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Key information, recent news, outreach hooks..." 
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Programming Details */}
        <Card>
          <CardHeader>
            <CardTitle>Programming Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="instructor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor / Teacher</FormLabel>
                    <FormControl>
                      <Input placeholder="Who is teaching?" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meeting_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 3:30 PM - 5:00 PM" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="volunteers_needed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Volunteers Needed</FormLabel>
                    <FormDescription>Does this site need volunteers?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Meeting Days</FormLabel>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <Badge
                    key={day}
                    variant={meetingDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Contact & Dates (collapsed section) */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : site ? "Update Site" : "Create Site"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
