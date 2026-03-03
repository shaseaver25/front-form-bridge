import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Heart, 
  Users, 
  Rocket, 
  Gift, 
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Landmark
} from 'lucide-react';
import { BOARD_TEMPLATES, BOARD_COLORS, BoardTemplate } from '@/data/boardTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Calendar,
  Heart,
  Users,
  Rocket,
  Gift,
  Plus,
};

interface NewBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBoardModal({ open, onOpenChange }: NewBoardModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [linkedGrantId, setLinkedGrantId] = useState<string>('');
  const [linkedCampaignId, setLinkedCampaignId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0].value);
  const [includeSuggestedTasks, setIncludeSuggestedTasks] = useState(true);
  const [volunteersNeeded, setVolunteersNeeded] = useState(false);
  const [isBoardInitiative, setIsBoardInitiative] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [grants, setGrants] = useState<{ id: string; title: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (open) {
      const fetchLinkOptions = async () => {
        const [grantsRes, campaignsRes] = await Promise.all([
          supabase
            .from('grant_opportunities')
            .select('id, title')
            .in('status_stage', ['prospecting', 'submitted', 'awarded'])
            .order('title'),
          supabase
            .from('donation_campaigns')
            .select('id, name')
            .eq('status', 'active')
            .order('name')
        ]);
        
        if (grantsRes.data) setGrants(grantsRes.data);
        if (campaignsRes.data) setCampaigns(campaignsRes.data);
      };
      fetchLinkOptions();
    }
  }, [open]);

  const resetModal = () => {
    setStep(1);
    setSelectedTemplate(null);
    setBoardName('');
    setBoardDescription('');
    setLinkedGrantId('');
    setLinkedCampaignId('');
    setSelectedColor(BOARD_COLORS[0].value);
    setIncludeSuggestedTasks(true);
    setVolunteersNeeded(false);
    setIsBoardInitiative(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const handleSelectTemplate = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    setBoardName(template.id === 'blank' ? '' : template.name);
    setStep(2);
  };

  const handleCreateBoard = async () => {
    if (!selectedTemplate || !boardName.trim()) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const boardType = selectedTemplate.id === 'grant-application' ? 'grant_application' : 
                       selectedTemplate.id === 'annual-campaign' ? 'campaign' : 
                       selectedTemplate.id === 'event-planning' ? 'event' : 'general';

      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: boardName.trim(),
          description: boardDescription.trim() || null,
          board_type: boardType,
          theme_color: selectedColor,
          linked_grant_id: linkedGrantId || null,
          linked_campaign_id: linkedCampaignId || null,
          volunteers_needed: volunteersNeeded,
          is_board_initiative: isBoardInitiative,
          created_by: user.id,
        })
        .select()
        .single();

      if (boardError) throw boardError;

      await supabase
        .from('board_members')
        .insert({
          board_id: board.id,
          user_id: user.id,
          role: 'owner',
        });

      const columnMap: Record<string, string> = {};
      for (let i = 0; i < selectedTemplate.columns.length; i++) {
        const col = selectedTemplate.columns[i];
        const { data: column, error: colError } = await supabase
          .from('board_columns')
          .insert({
            board_id: board.id,
            title: col.title,
            column_type: col.type,
            is_done_column: col.isDoneColumn || false,
            position: i,
          })
          .select()
          .single();

        if (colError) throw colError;
        columnMap[col.title] = column.id;
      }

      if (includeSuggestedTasks && selectedTemplate.suggestedCards.length > 0) {
        const cardPositions: Record<string, number> = {};
        
        for (const card of selectedTemplate.suggestedCards) {
          const columnId = columnMap[card.column];
          if (!columnId) continue;
          
          const position = cardPositions[columnId] || 0;
          cardPositions[columnId] = position + 1;

          await supabase
            .from('board_cards')
            .insert({
              board_id: board.id,
              column_id: columnId,
              headline: card.headline,
              description: card.description || null,
              priority: card.priority || 'medium',
              position,
              created_by: user.id,
              is_suggested: true,
            });
        }
      }

      // If volunteers needed, create a volunteer event for this board
      if (volunteersNeeded) {
        await supabase
          .from('volunteer_events')
          .insert({
            title: `Volunteers: ${boardName.trim()}`,
            description: `Volunteer opportunity for project: ${boardName.trim()}`,
            event_type: 'ongoing',
            start_date: new Date().toISOString(),
            location_type: 'in-person',
            status: 'open',
            is_active: true,
            public_signup_enabled: true,
            created_by: user.id,
          });
      }

      toast.success('Board created successfully!');
      handleClose();
      navigate(`/projects/${board.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Choose a Template'}
            {step === 2 && 'Board Details'}
            {step === 3 && 'Confirm & Create'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {BOARD_TEMPLATES.map((template) => {
              const Icon = ICON_MAP[template.icon] || Plus;
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  {template.suggestedCards.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {template.suggestedCards.length} suggested tasks
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && selectedTemplate && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Board Name *</Label>
              <Input
                id="boardName"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Enter board name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="boardDescription">Description</Label>
              <Textarea
                id="boardDescription"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link to Grant</Label>
                <Select value={linkedGrantId || "none"} onValueChange={(v) => setLinkedGrantId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {grants.map((grant) => (
                      <SelectItem key={grant.id} value={grant.id}>
                        {grant.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link to Campaign</Label>
                <Select value={linkedCampaignId || "none"} onValueChange={(v) => setLinkedCampaignId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Board Color</Label>
              <div className="flex gap-2">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="volunteersNeeded"
                  checked={volunteersNeeded}
                  onCheckedChange={(checked) => setVolunteersNeeded(checked === true)}
                />
                <div>
                  <Label htmlFor="volunteersNeeded" className="text-sm cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Volunteers Needed
                    </span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable public volunteer sign-ups for this project
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isBoardInitiative"
                  checked={isBoardInitiative}
                  onCheckedChange={(checked) => setIsBoardInitiative(checked === true)}
                />
                <div>
                  <Label htmlFor="isBoardInitiative" className="text-sm cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-blue-600" />
                      Board of Directors Initiative
                    </span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mark as a project from the Board of Directors
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)}
                disabled={!boardName.trim()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && selectedTemplate && (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="font-medium">{boardName}</span>
              </div>
              {boardDescription && (
                <p className="text-sm text-muted-foreground">{boardDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Columns</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.columns.map((col, i) => (
                  <Badge key={i} variant="outline">
                    {col.title}
                    {col.isDoneColumn && ' ✓'}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedTemplate.suggestedCards.length > 0 && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="includeTasks"
                  checked={includeSuggestedTasks}
                  onCheckedChange={(checked) => setIncludeSuggestedTasks(checked === true)}
                />
                <Label htmlFor="includeTasks" className="text-sm cursor-pointer">
                  Include {selectedTemplate.suggestedCards.length} suggested tasks
                </Label>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleCreateBoard}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Board
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
