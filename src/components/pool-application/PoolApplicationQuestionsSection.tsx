import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PoolApplicationQuestionsSectionProps {
  form: UseFormReturn<any>;
  poolType: "speaker" | "teacher";
}

export function PoolApplicationQuestionsSection({ form, poolType }: PoolApplicationQuestionsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell Us More</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="whyInterested"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {poolType === "speaker"
                  ? "Why are you interested in speaking for AI Whisperers?"
                  : "Why are you interested in teaching for createMPLS?"}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    poolType === "speaker"
                      ? "Share your passion for AI education and what motivates you to speak..."
                      : "Share your passion for education and what motivates you to teach..."
                  }
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="relevantExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {poolType === "speaker"
                  ? "Describe your relevant experience with AI and technology"
                  : "Describe your relevant teaching and education experience"}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    poolType === "speaker"
                      ? "Highlight projects, roles, or expertise that make you a great AI speaker..."
                      : "Highlight teaching roles, curriculum work, or student outcomes..."
                  }
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
