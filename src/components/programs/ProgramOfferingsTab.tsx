import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProgramOffering, useProgramOfferings, useDeleteProgramOffering } from "@/hooks/useProgramOfferings";
import { OfferingDialog } from "./OfferingDialog";
import { OfferingEnrollmentsDialog } from "./OfferingEnrollmentsDialog";
import { Plus, Calendar, DollarSign, Users, MapPin, Pencil, Trash2, Eye, Package } from "lucide-react";
import { format } from "date-fns";

interface ProgramOfferingsTabProps {
  programId: string;
}

export function ProgramOfferingsTab({ programId }: ProgramOfferingsTabProps) {
  const { data: offerings = [], isLoading } = useProgramOfferings(programId);
  const deleteOffering = useDeleteProgramOffering();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingOffering, setEditingOffering] = useState<ProgramOffering | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProgramOffering | null>(null);
  const [enrollmentsOffering, setEnrollmentsOffering] = useState<ProgramOffering | null>(null);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleEdit = (offering: ProgramOffering) => {
    setEditingOffering(offering);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteOffering.mutateAsync({ id: deleteConfirm.id, programId });
    setDeleteConfirm(null);
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading offerings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Program Offerings</h3>
          <p className="text-sm text-muted-foreground">
            Sessions, cohorts, or instances of this program that people can enroll in
          </p>
        </div>
        <Button onClick={() => { setEditingOffering(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Offering
        </Button>
      </div>

      {/* Offerings List */}
      {offerings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No offerings yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first offering to accept enrollments
            </p>
            <Button onClick={() => { setEditingOffering(null); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Offering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offerings.map((offering) => (
            <Card key={offering.id} className={!offering.is_active ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{offering.name}</h4>
                    {offering.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {offering.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {offering.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  {(offering.start_date || offering.end_date) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {offering.start_date && format(new Date(offering.start_date), "MMM d")}
                        {offering.start_date && offering.end_date && " - "}
                        {offering.end_date && format(new Date(offering.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(offering.price)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {offering.capacity
                        ? `${offering.enrolled_count} / ${offering.capacity}`
                        : `${offering.enrolled_count} enrolled`}
                    </span>
                  </div>

                  {offering.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{offering.location}</span>
                    </div>
                  )}
                </div>

                {offering.registration_deadline && (
                  <p className={`text-xs mb-4 ${isDeadlinePassed(offering.registration_deadline) ? "text-destructive" : "text-muted-foreground"}`}>
                    Registration deadline: {format(new Date(offering.registration_deadline), "MMM d, yyyy")}
                    {isDeadlinePassed(offering.registration_deadline) && " (passed)"}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(offering)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEnrollmentsOffering(offering)}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Enrollments
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(offering)}
                    disabled={offering.enrolled_count > 0}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <OfferingDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        programId={programId}
        offering={editingOffering}
      />

      {/* Enrollments Dialog */}
      <OfferingEnrollmentsDialog
        open={!!enrollmentsOffering}
        onOpenChange={(open) => !open && setEnrollmentsOffering(null)}
        offering={enrollmentsOffering}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offering?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirm?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
