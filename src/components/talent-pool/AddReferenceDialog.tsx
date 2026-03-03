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
import { useCreatePoolReference } from "@/hooks/usePoolReferences";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  reference_name: z.string().min(1, "Name is required"),
  reference_email: z.string().email("Invalid email").optional().or(z.literal("")),
  reference_phone: z.string().optional(),
  relationship: z.string().optional(),
  organization: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
}

export function AddReferenceDialog({
  open,
  onOpenChange,
  applicationId,
}: AddReferenceDialogProps) {
  const createReference = useCreatePoolReference();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference_name: "",
      reference_email: "",
      reference_phone: "",
      relationship: "",
      organization: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createReference.mutateAsync({
        application_id: applicationId,
        reference_name: values.reference_name,
        reference_email: values.reference_email || null,
        reference_phone: values.reference_phone || null,
        relationship: values.relationship || null,
        organization: values.organization || null,
        contacted: false,
        contacted_date: null,
        contacted_by: null,
        feedback: null,
        recommendation_level: null,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Reference
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Smith" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="john@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Colleague, Supervisor, Event Organizer..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Company or organization name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReference.isPending}>
                {createReference.isPending ? "Adding..." : "Add Reference"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
