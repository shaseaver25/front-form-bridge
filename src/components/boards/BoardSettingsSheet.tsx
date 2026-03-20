import { useState } from 'react';
import { Settings, Archive, Save, Copy, Users, Landmark } from 'lucide-react';
import { syncSiteVolunteerEvent } from '@/utils/siteVolunteerSync';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Board } from '@/types/boards';
import { useUpdateBoard, useDeleteBoard } from '@/hooks/useBoardData';
import { BoardDocumentsSection } from './BoardDocumentsSection';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { DuplicateBoardDialog } from './DuplicateBoardDialog';
import { VolunteerPositionsPanel } from './VolunteerPositionsPanel';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BoardSettingsSheetProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  showCompletedCards: boolean;
  onShowCompletedCardsChange: (show: boolean) => void;
}

export function BoardSettingsSheet({
  board,
  isOpen,
  onClose,
  showCompletedCards,
  onShowCompletedCardsChange,
}: BoardSettingsSheetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [volunteersNeeded, setVolunteersNeeded] = useState(board.volunteers_needed || false);
  
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();

  const handleSave = async () => {
    try {
      await updateBoardMutation.mutateAsync({
        boardId: board.id,
        name,
        description,
      });
      toast.success('Board settings saved');
      onClose();
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleVolunteersToggle = async (enabled: boolean) => {
    setVolunteersNeeded(enabled);
    const { error } = await supabase
      .from('boards')
      .update({ volunteers_needed: enabled })
      .eq('id', board.id);

    if (error) {
      toast.error('Failed to update volunteer settings');
      setVolunteersNeeded(!enabled);
      return;
    }

    // Sync volunteer event for the linked site (or create one using board name)
    const linkedSiteId = board.linked_site_id;
    if (linkedSiteId) {
      // Fetch site data to build the volunteer event
      const { data: site } = await supabase
        .from('sites')
        .select('name, meeting_time, meeting_days, address_street, address_city, address_state, instructor_name')
        .eq('id', linkedSiteId)
        .maybeSingle();

      if (site) {
        await syncSiteVolunteerEvent(linkedSiteId, {
          name: site.name,
          volunteers_needed: enabled,
          meeting_time: site.meeting_time,
          meeting_days: site.meeting_days,
          address_street: site.address_street,
          address_city: site.address_city,
          address_state: site.address_state,
          instructor_name: site.instructor_name,
        });
      }
    } else {
      // No linked site — create a volunteer event using the board name directly
      await syncBoardVolunteerEvent(board.id, board.name, enabled);
    }

    queryClient.invalidateQueries({ queryKey: ['boards'] });
    queryClient.invalidateQueries({ queryKey: ['volunteer-events'] });
    queryClient.invalidateQueries({ queryKey: ['volunteer-opportunities'] });
    toast.success(enabled ? 'Volunteer signups enabled' : 'Volunteer signups disabled');
  };

  const syncBoardVolunteerEvent = async (boardId: string, boardName: string, enabled: boolean) => {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;

    // Check for existing volunteer event linked via description or title pattern
    const { data: existing } = await supabase
      .from('volunteer_events')
      .select('id, is_active')
      .eq('title', `Volunteers: ${boardName}`)
      .eq('created_by', userId!)
      .maybeSingle();

    if (!enabled) {
      if (existing?.is_active) {
        await supabase
          .from('volunteer_events')
          .update({ is_active: false, status: 'closed' })
          .eq('id', existing.id);
      }
      return;
    }

    if (existing) {
      await supabase
        .from('volunteer_events')
        .update({ is_active: true, status: 'open' })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('volunteer_events')
        .insert({
          title: `Volunteers: ${boardName}`,
          description: `Volunteer opportunity for project: ${boardName}`,
          event_type: 'ongoing',
          start_date: new Date().toISOString(),
          location_type: 'in-person',
          status: 'open',
          is_active: true,
          public_signup_enabled: true,
          created_by: userId,
        });
    }
  };


  const handleArchive = async () => {
    try {
      await deleteBoardMutation.mutateAsync(board.id);
      toast.success('Board archived');
      navigate('/projects');
    } catch {
      toast.error('Failed to archive board');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-background p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Board Settings
          </SheetTitle>
          <SheetDescription>
            Configure your board preferences
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] px-6 pb-6">
        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="volunteers" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Volunteers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            {/* Board Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="board-name">Board Name</Label>
                <Input
                  id="board-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-description">Description</Label>
                <Textarea
                  id="board-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>

            <Separator />


            <Separator />

            {/* Template & Duplicate Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Board Actions</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveAsTemplate(true)}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDuplicate(true)}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </div>

            <Separator />

            {/* Documents Section */}
            <BoardDocumentsSection boardId={board.id} />

            <Separator />

            {/* View Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">View Options</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-completed">Show Completed Cards</Label>
                  <p className="text-xs text-muted-foreground">
                    Display cards in the Done column
                  </p>
                </div>
                <Switch
                  id="show-completed"
                  checked={showCompletedCards}
                  onCheckedChange={onShowCompletedCardsChange}
                />
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Board
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive this board?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive the board and hide it from your boards list. 
                      You can restore it later from the archived boards section.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive}>
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="volunteers" className="mt-6 space-y-6">
            {/* Volunteer Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="volunteers-needed" className="text-base font-medium">
                    Volunteers Needed
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable public volunteer sign-ups for this project
                  </p>
                </div>
                <Switch
                  id="volunteers-needed"
                  checked={volunteersNeeded}
                  onCheckedChange={handleVolunteersToggle}
                />
              </div>
            </div>

            {volunteersNeeded && (
              <>
                <Separator />
                <VolunteerPositionsPanel boardId={board.id} boardName={board.name} />
              </>
            )}
          </TabsContent>
        </Tabs>
        </ScrollArea>
      </SheetContent>

      {/* Template Dialog */}
      <SaveAsTemplateDialog
        open={showSaveAsTemplate}
        onOpenChange={setShowSaveAsTemplate}
        boardId={board.id}
        boardName={board.name}
      />

      {/* Duplicate Dialog */}
      <DuplicateBoardDialog
        open={showDuplicate}
        onOpenChange={setShowDuplicate}
        boardId={board.id}
        boardName={board.name}
      />
    </Sheet>
  );
}