import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUpdateFundMapping } from '@/hooks/useQuickBooks';

const formSchema = z.object({
  fund_designation: z.string().min(1, 'Fund designation is required'),
  qb_account_name: z.string().optional(),
  qb_account_id: z.string().optional(),
  qb_class_name: z.string().optional(),
  qb_class_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

type FundMapping = {
  id: string;
  fund_designation: string;
  qb_account_id: string | null;
  qb_account_name: string | null;
  qb_class_id: string | null;
  qb_class_name: string | null;
  is_active: boolean;
};

interface FundMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping: FundMapping | null;
}

export function FundMappingDialog({ open, onOpenChange, mapping }: FundMappingDialogProps) {
  const updateMutation = useUpdateFundMapping();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fund_designation: '',
      qb_account_name: '',
      qb_account_id: '',
      qb_class_name: '',
      qb_class_id: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (mapping) {
      form.reset({
        fund_designation: mapping.fund_designation,
        qb_account_name: mapping.qb_account_name ?? '',
        qb_account_id: mapping.qb_account_id ?? '',
        qb_class_name: mapping.qb_class_name ?? '',
        qb_class_id: mapping.qb_class_id ?? '',
        is_active: mapping.is_active,
      });
    } else {
      form.reset({
        fund_designation: '',
        qb_account_name: '',
        qb_account_id: '',
        qb_class_name: '',
        qb_class_id: '',
        is_active: true,
      });
    }
  }, [mapping, form]);

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(
      {
        id: mapping?.id,
        fund_designation: values.fund_designation,
        qb_account_name: values.qb_account_name || null,
        qb_account_id: values.qb_account_id || null,
        qb_class_name: values.qb_class_name || null,
        qb_class_id: values.qb_class_id || null,
        is_active: values.is_active,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mapping ? 'Edit' : 'Add'} Fund Mapping</DialogTitle>
          <DialogDescription>
            Map a CRM fund designation to a QuickBooks account and class.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fund_designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fund Designation *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., General Fund" {...field} />
                  </FormControl>
                  <FormDescription>
                    The fund name as it appears in your CRM
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qb_account_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QB Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Contributions - Unrestricted" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qb_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QB Account ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qb_class_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QB Class Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Programs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qb_class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QB Class ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Only active mappings will be used during sync
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
