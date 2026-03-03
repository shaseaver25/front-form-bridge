import { useState } from "react";
import { Plus, Link2, Unlink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useSitePrograms } from "@/hooks/useSitePrograms";
import { usePrograms } from "@/hooks/useMissionImpact";
import { AddProgramDialog } from "@/components/mission-impact/AddProgramDialog";
import { format } from "date-fns";

interface SiteProgramsSectionProps {
  siteId: string;
}

export function SiteProgramsSection({ siteId }: SiteProgramsSectionProps) {
  const { programs, isLoading, linkProgram, unlinkProgram } = useSitePrograms(siteId);
  const { data: allPrograms, isLoading: isLoadingPrograms } = usePrograms();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const linkedProgramIds = programs.map((p) => p.program_id);
  const availablePrograms = allPrograms?.filter((p) => !linkedProgramIds.includes(p.id)) ?? [];

  const handleLinkProgram = async () => {
    if (!selectedProgramId) return;
    await linkProgram.mutateAsync({
      site_id: siteId,
      program_id: selectedProgramId,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      notes: notes || undefined,
    });
    setIsDialogOpen(false);
    setSelectedProgramId("");
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Linked Programs</CardTitle>
          <CardDescription>Programs operating at this site</CardDescription>
        </div>
        <div className="flex gap-2">
          <AddProgramDialog />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={availablePrograms.length === 0}>
                <Link2 className="mr-2 h-4 w-4" />
                Link Existing
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Program to Site</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPrograms ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      availablePrograms.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any notes about this program at this site..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleLinkProgram} 
                  disabled={!selectedProgramId || linkProgram.isPending}
                >
                  {linkProgram.isPending ? "Linking..." : "Link Program"}
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <EmptyState
            type="no-data"
            entityName="Program"
            onAction={() => setIsDialogOpen(true)}
            actionLabel="Link Program"
          />
        ) : (
          <div className="space-y-4">
            {programs.map((siteProgram) => (
              <div
                key={siteProgram.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {siteProgram.program?.name ?? "Unknown Program"}
                    </span>
                  </div>
                  {siteProgram.program?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {siteProgram.program.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {siteProgram.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(siteProgram.start_date), "MMM d, yyyy")}
                        {siteProgram.end_date && ` - ${format(new Date(siteProgram.end_date), "MMM d, yyyy")}`}
                      </span>
                    )}
                    {siteProgram.notes && (
                      <Badge variant="outline">{siteProgram.notes}</Badge>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unlink Program</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to unlink this program from the site?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => unlinkProgram.mutate(siteProgram.id)}>
                        Unlink
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
