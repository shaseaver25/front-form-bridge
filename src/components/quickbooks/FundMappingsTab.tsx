import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQBFundMappings, useUpdateFundMapping, useDeleteFundMapping } from '@/hooks/useQuickBooks';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FundMappingDialog } from './FundMappingDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type FundMapping = {
  id: string;
  fund_designation: string;
  qb_account_id: string | null;
  qb_account_name: string | null;
  qb_class_id: string | null;
  qb_class_name: string | null;
  is_active: boolean;
};

export function FundMappingsTab() {
  const { data: mappings, isLoading } = useQBFundMappings();
  const updateMutation = useUpdateFundMapping();
  const deleteMutation = useDeleteFundMapping();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<FundMapping | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleActive = (mapping: FundMapping) => {
    updateMutation.mutate({
      id: mapping.id,
      fund_designation: mapping.fund_designation,
      is_active: !mapping.is_active
    });
  };

  const handleEdit = (mapping: FundMapping) => {
    setEditingMapping(mapping);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMapping(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
    setDeleteConfirmOpen(false);
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fund Mappings</CardTitle>
              <CardDescription>Map CRM fund designations to QuickBooks accounts</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mappings?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fund mappings configured</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Designation</TableHead>
                  <TableHead>QB Account Name</TableHead>
                  <TableHead>QB Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings?.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.fund_designation}</TableCell>
                    <TableCell>
                      {mapping.qb_account_name || (
                        <span className="text-muted-foreground italic">Not mapped</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mapping.qb_class_name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={mapping.is_active}
                          onCheckedChange={() => handleToggleActive(mapping as FundMapping)}
                          disabled={updateMutation.isPending}
                        />
                        <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                          {mapping.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(mapping as FundMapping)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FundMappingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mapping={editingMapping}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fund Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fund mapping? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
