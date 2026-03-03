import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreateBurndownExpenseEntry,
  useUpdateBurndownExpenseEntry,
} from "@/hooks/useBurndownData";
import {
  BurndownExpenseEntry,
  BurndownExpenseCategory,
  EXPENSE_STATUS_LABELS,
  RECURRENCE_INTERVAL_LABELS,
  ExpenseStatus,
  RecurrenceInterval,
} from "@/types/burndown";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  vendor_name: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  due_date: z.date({ required_error: "Due date is required" }),
  status: z.enum(["projected", "approved", "paid"]),
  is_recurring: z.boolean(),
  recurrence_interval: z.enum(["monthly", "quarterly", "annually"]).optional(),
  recurrence_end_date: z.date().optional().nullable(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseEntryFormProps {
  orgId: string;
  categories: BurndownExpenseCategory[];
  entry: BurndownExpenseEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseEntryForm({
  orgId,
  categories,
  entry,
  open,
  onOpenChange,
}: ExpenseEntryFormProps) {
  const createMutation = useCreateBurndownExpenseEntry();
  const updateMutation = useUpdateBurndownExpenseEntry();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      vendor_name: "",
      category_id: "",
      amount: 0,
      due_date: new Date(),
      status: "projected",
      is_recurring: false,
      recurrence_interval: undefined,
      recurrence_end_date: null,
      notes: "",
    },
  });

  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      form.reset({
        description: entry.description || "",
        vendor_name: entry.vendor_name || "",
        category_id: entry.category_id || "",
        amount: entry.amount,
        due_date: new Date(entry.due_date),
        status: entry.status,
        is_recurring: entry.is_recurring,
        recurrence_interval: entry.is_recurring ? "monthly" : undefined,
        recurrence_end_date: entry.recurrence_end_date
          ? new Date(entry.recurrence_end_date)
          : null,
        notes: entry.notes || "",
      });
    } else {
      form.reset({
        description: "",
        vendor_name: "",
        category_id: "",
        amount: 0,
        due_date: new Date(),
        status: "projected",
        is_recurring: false,
        recurrence_interval: undefined,
        recurrence_end_date: null,
        notes: "",
      });
    }
  }, [entry, form]);

  const watchIsRecurring = form.watch("is_recurring");

  const onSubmit = async (values: FormValues) => {
    try {
      const data = {
        organization_id: orgId,
        description: values.description,
        vendor_name: values.vendor_name || null,
        category_id: values.category_id,
        amount: values.amount,
        due_date: format(values.due_date, "yyyy-MM-dd"),
        status: values.status,
        is_recurring: values.is_recurring,
        recurrence_end_date: values.recurrence_end_date
          ? format(values.recurrence_end_date, "yyyy-MM-dd")
          : null,
        notes: values.notes || null,
      };

      if (entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          ...data,
        });
        toast.success("Expense entry updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Expense entry created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(entry ? "Failed to update entry" : "Failed to create entry");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{entry ? "Edit Expense Entry" : "Add Expense Entry"}</SheetTitle>
          <SheetDescription>
            {entry
              ? "Update the details for this expense."
              : "Add a new expense to your runway projection."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly rent payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Property Management" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(EXPENSE_STATUS_LABELS) as ExpenseStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {EXPENSE_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Recurring Expense</FormLabel>
                    <FormDescription>
                      This expense repeats on a regular schedule
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchIsRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurrence_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Interval</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(RECURRENCE_INTERVAL_LABELS) as RecurrenceInterval[]).map(
                            (interval) => (
                              <SelectItem key={interval} value={interval}>
                                {RECURRENCE_INTERVAL_LABELS[interval]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrence_end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Recurrence End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "No end date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Leave empty for indefinite recurrence</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details or context..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : entry
                  ? "Update"
                  : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
