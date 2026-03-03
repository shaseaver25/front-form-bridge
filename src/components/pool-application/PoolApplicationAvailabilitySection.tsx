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
import { Checkbox } from "@/components/ui/checkbox";

interface PoolApplicationAvailabilitySectionProps {
  form: UseFormReturn<any>;
}

const DAYS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const TIME_SLOTS = [
  { id: "morning", label: "Morning (8am - 12pm)" },
  { id: "afternoon", label: "Afternoon (12pm - 5pm)" },
  { id: "evening", label: "Evening (5pm - 9pm)" },
];

export function PoolApplicationAvailabilitySection({ form }: PoolApplicationAvailabilitySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="availableDays"
          render={() => (
            <FormItem>
              <FormLabel>Available Days</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {DAYS.map((day) => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem
                        key={day.id}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, day.id]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== day.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {day.label}
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
          name="preferredTimeSlots"
          render={() => (
            <FormItem>
              <FormLabel>Preferred Time Slots</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {TIME_SLOTS.map((slot) => (
                  <FormField
                    key={slot.id}
                    control={form.control}
                    name="preferredTimeSlots"
                    render={({ field }) => (
                      <FormItem
                        key={slot.id}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(slot.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, slot.id]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== slot.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {slot.label}
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
          name="availabilityNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Availability Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific scheduling constraints or preferences..."
                  className="min-h-[80px]"
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
