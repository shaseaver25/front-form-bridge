import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PoolApplicationSpeakerSectionProps {
  form: UseFormReturn<any>;
}

const SPEAKER_TOPICS = [
  "Introduction to AI/ML",
  "ChatGPT & Large Language Models",
  "AI Ethics & Responsible Use",
  "AI in Education",
  "AI for Business/Nonprofits",
  "Prompt Engineering",
  "AI Art & Creative Tools",
  "AI Career Pathways",
  "AI Safety & Security",
  "Hands-on AI Workshops",
  "AI Policy & Regulation",
  "Future of Work with AI",
  "Other (specify)",
];

const AUDIENCE_SIZES = [
  { id: "small", label: "Small (1-25)" },
  { id: "medium", label: "Medium (25-100)" },
  { id: "large", label: "Large (100+)" },
];

const PRESENTATION_STYLES = [
  { id: "lecture", label: "Lecture" },
  { id: "workshop", label: "Workshop" },
  { id: "panel", label: "Panel Discussion" },
  { id: "qa", label: "Q&A Session" },
];

export function PoolApplicationSpeakerSection({ form }: PoolApplicationSpeakerSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Speaker Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="speakerTopics"
          render={() => (
            <FormItem>
              <FormLabel>AI Topics You Can Speak On</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {SPEAKER_TOPICS.map((topic) => (
                  <FormField
                    key={topic}
                    control={form.control}
                    name="speakerTopics"
                    render={({ field }) => (
                      <FormItem
                        key={topic}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(topic)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, topic]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== topic));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer text-sm">
                          {topic}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("speakerTopics")?.includes("Other (specify)") && (
          <FormField
            control={form.control}
            name="speakerTopicsOther"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other Topics (please specify)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your other AI topics, separated by commas..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="speakerExperienceLevel"
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
                  <SelectItem value="beginner">Beginner (0-5 presentations)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (5-20 presentations)</SelectItem>
                  <SelectItem value="experienced">Experienced (20-50 presentations)</SelectItem>
                  <SelectItem value="professional">Professional (50+ presentations)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousSpeakingEngagements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Speaking Engagements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your previous speaking experience, notable events, or conferences..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audienceSizesComfortable"
          render={() => (
            <FormItem>
              <FormLabel>Comfortable Audience Sizes</FormLabel>
              <div className="flex flex-wrap gap-4 mt-2">
                {AUDIENCE_SIZES.map((size) => (
                  <FormField
                    key={size.id}
                    control={form.control}
                    name="audienceSizesComfortable"
                    render={({ field }) => (
                      <FormItem
                        key={size.id}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(size.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, size.id]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== size.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {size.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="presentationStyle"
          render={() => (
            <FormItem>
              <FormLabel>Preferred Presentation Styles</FormLabel>
              <div className="flex flex-wrap gap-4 mt-2">
                {PRESENTATION_STYLES.map((style) => (
                  <FormField
                    key={style.id}
                    control={form.control}
                    name="presentationStyle"
                    render={({ field }) => (
                      <FormItem
                        key={style.id}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(style.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, style.id]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== style.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {style.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipmentNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A/V or Equipment Needs</FormLabel>
              <FormControl>
                <Input placeholder="Projector, microphone, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="speakerFeeExpectations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Expectations</FormLabel>
              <FormControl>
                <Input placeholder="e.g., $200-500 per engagement, negotiable, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="willingToVolunteer"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                I am willing to volunteer for select events
              </FormLabel>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
