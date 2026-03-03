import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Users, Pencil, Trash2, Link as LinkIcon, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VolunteerPosition {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  skills_required: string[];
  slots_available: number;
  slots_filled: number;
  time_commitment: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface VolunteerPositionsPanelProps {
  boardId: string;
  boardName: string;
}

export function VolunteerPositionsPanel({ boardId, boardName }: VolunteerPositionsPanelProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<VolunteerPosition | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills_required: '',
    slots_available: 1,
    time_commitment: '',
  });

  const { data: positions, isLoading } = useQuery({
    queryKey: ['volunteer-positions', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_volunteer_positions')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VolunteerPosition[];
    },
  });

  const { data: signups } = useQuery({
    queryKey: ['volunteer-signups', boardId],
    queryFn: async () => {
      if (!positions?.length) return [];
      const positionIds = positions.map(p => p.id);
      const { data, error } = await supabase
        .from('project_volunteer_signups')
        .select('*')
        .in('position_id', positionIds);

      if (error) throw error;
      return data;
    },
    enabled: !!positions?.length,
  });

  const createPosition = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('project_volunteer_positions')
        .insert({
          board_id: boardId,
          title: data.title,
          description: data.description || null,
          skills_required: data.skills_required.split(',').map(s => s.trim()).filter(Boolean),
          slots_available: data.slots_available,
          time_commitment: data.time_commitment || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-positions', boardId] });
      toast.success('Volunteer position created');
      resetForm();
      setShowAddDialog(false);
    },
    onError: () => {
      toast.error('Failed to create position');
    },
  });

  const updatePosition = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('project_volunteer_positions')
        .update({
          title: data.title,
          description: data.description || null,
          skills_required: data.skills_required.split(',').map(s => s.trim()).filter(Boolean),
          slots_available: data.slots_available,
          time_commitment: data.time_commitment || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-positions', boardId] });
      toast.success('Position updated');
      resetForm();
      setEditingPosition(null);
    },
    onError: () => {
      toast.error('Failed to update position');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('project_volunteer_positions')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-positions', boardId] });
    },
  });

  const deletePosition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_volunteer_positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-positions', boardId] });
      toast.success('Position deleted');
    },
    onError: () => {
      toast.error('Failed to delete position');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      skills_required: '',
      slots_available: 1,
      time_commitment: '',
    });
  };

  const handleEdit = (position: VolunteerPosition) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      description: position.description || '',
      skills_required: position.skills_required?.join(', ') || '',
      slots_available: position.slots_available,
      time_commitment: position.time_commitment || '',
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    if (editingPosition) {
      updatePosition.mutate({ id: editingPosition.id, data: formData });
    } else {
      createPosition.mutate(formData);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/volunteer-opportunities/${boardId}`;
    navigator.clipboard.writeText(url);
    toast.success('Public sign-up link copied');
  };

  const getSignupsForPosition = (positionId: string) => {
    return signups?.filter(s => s.position_id === positionId) || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Volunteer Positions</h3>
          <p className="text-sm text-muted-foreground">
            Define volunteer roles needed for this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyPublicLink}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Sign-Up Link
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading positions...</p>
      ) : positions?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">No volunteer positions defined yet</p>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {positions?.map((position) => {
            const positionSignups = getSignupsForPosition(position.id);
            const pendingCount = positionSignups.filter(s => s.status === 'pending').length;
            const approvedCount = positionSignups.filter(s => s.status === 'approved').length;

            return (
              <Card key={position.id} className={cn(!position.is_active && "opacity-60")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {position.title}
                        {!position.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      {position.description && (
                        <p className="text-sm text-muted-foreground">{position.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={position.is_active}
                        onCheckedChange={(checked) => 
                          toggleActive.mutate({ id: position.id, isActive: checked })
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(position)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => deletePosition.mutate(position.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {approvedCount}/{position.slots_available} filled
                      </span>
                    </div>
                    {pendingCount > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {pendingCount} pending
                      </Badge>
                    )}
                    {position.time_commitment && (
                      <span className="text-muted-foreground">{position.time_commitment}</span>
                    )}
                  </div>
                  {position.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {position.skills_required.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={showAddDialog || !!editingPosition} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingPosition(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Edit Volunteer Position' : 'Add Volunteer Position'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Position Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Event Setup Volunteer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the volunteer role..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slots">Slots Available</Label>
                <Input
                  id="slots"
                  type="number"
                  min={1}
                  value={formData.slots_available}
                  onChange={(e) => setFormData({ ...formData, slots_available: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time Commitment</Label>
                <Input
                  id="time"
                  value={formData.time_commitment}
                  onChange={(e) => setFormData({ ...formData, time_commitment: e.target.value })}
                  placeholder="e.g., 4 hours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills Required</Label>
              <Input
                id="skills"
                value={formData.skills_required}
                onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                placeholder="Comma-separated (e.g., communication, lifting)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingPosition(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title.trim() || createPosition.isPending || updatePosition.isPending}
            >
              {editingPosition ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}