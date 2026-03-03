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

interface PoolApplicationTeacherSectionProps {
  form: UseFormReturn<any>;
}

const GRADE_LEVELS = [
  { id: "elementary", label: "Elementary (K-5)" },
  { id: "middle", label: "Middle School (6-8)" },
  { id: "high", label: "High School (9-12)" },
  { id: "adult", label: "Adult Learners" },
];

const TEACHER_SUBJECTS = [
  "Computer Science Fundamentals",
  "Programming/Coding",
  "Robotics",
  "AI/Machine Learning Basics",
  "Digital Literacy",
  "STEM Integration",
  "Math for Technology",
  "Design Thinking",
  "Maker/Fabrication Skills",
  "Career Exploration",
];

export function PoolApplicationTeacherSection({ form }: PoolApplicationTeacherSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="teachingCertifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teaching Certifications</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any teaching certifications, licenses, or credentials..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gradeLevelsComfortable"
          render={() => (
            <FormItem>
              <FormLabel>Comfortable Grade Levels</FormLabel>
              <div className="flex flex-wrap gap-4 mt-2">
                {GRADE_LEVELS.map((level) => (
                  <FormField
                    key={level.id}
                    control={form.control}
                    name="gradeLevelsComfortable"
                    render={({ field }) => (
                      <FormItem
                        key={level.id}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(level.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, level.id]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== level.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {level.label}
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
          name="subjectsQualified"
          render={() => (
            <FormItem>
              <FormLabel>Subjects You Can Teach</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {TEACHER_SUBJECTS.map((subject) => (
                  <FormField
                    key={subject}
                    control={form.control}
                    name="subjectsQualified"
                    render={({ field }) => (
                      <FormItem
                        key={subject}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(subject)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, subject]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== subject));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer text-sm">
                          {subject}
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
          name="classroomManagementExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classroom Management Experience</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your experience managing classrooms, group sizes, and teaching environments..."
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
          name="curriculumDevelopmentExperience"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                I have curriculum development experience
              </FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="backgroundCheckConsent"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0 p-4 border rounded-lg bg-muted/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              </FormControl>
              <div>
                <FormLabel className="font-medium cursor-pointer">
                  Background Check Consent
                </FormLabel>
                <p className="text-sm text-muted-foreground mt-1">
                  I understand that working with students may require a background check, and I
                  consent to undergo one if selected.
                </p>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
