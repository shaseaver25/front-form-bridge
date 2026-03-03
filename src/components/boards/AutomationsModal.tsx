import { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Settings2,
  ArrowRight,
  Bell,
  UserPlus,
  AlertTriangle,
  MoveRight,
  Flag,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BoardColumn, BoardMember } from '@/types/boards';
import { toast } from 'sonner';

interface Automation {
  id: string;
  name: string;
  trigger_type: 'card_moved' | 'card_created' | 'due_date_approaching' | 'card_completed';
  trigger_config: Record<string, unknown>;
  action_type: 'assign_user' | 'set_priority' | 'add_label' | 'notify' | 'move_card';
  action_config: Record<string, unknown>;
  is_active: boolean;
}

interface AutomationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  columns: BoardColumn[];
  members: BoardMember[];
}

type Step = 'list' | 'trigger' | 'action' | 'name';

const TRIGGER_OPTIONS = [
  { value: 'card_moved', label: 'Card is moved to column', icon: MoveRight },
  { value: 'card_created', label: 'Card is created', icon: Plus },
  { value: 'due_date_approaching', label: 'Due date is approaching', icon: Calendar },
  { value: 'card_completed', label: 'Card is marked complete', icon: Flag },
];

const ACTION_OPTIONS = [
  { value: 'assign_user', label: 'Assign to user', icon: UserPlus },
  { value: 'set_priority', label: 'Set priority to', icon: AlertTriangle },
  { value: 'move_card', label: 'Move to column', icon: MoveRight },
  { value: 'notify', label: 'Send notification to', icon: Bell },
];

const NONPROFIT_EXAMPLES = [
  {
    name: 'Notify ED on submission',
    trigger: { type: 'card_moved', label: 'When card moves to "Submitted"' },
    action: { type: 'notify', label: 'Notify executive director' },
  },
  {
    name: 'Deadline reminder',
    trigger: { type: 'due_date_approaching', label: 'When due in 3 days' },
    action: { type: 'notify', label: 'Notify assignee' },
  },
  {
    name: 'Urgent priority',
    trigger: { type: 'card_moved', label: 'When card enters "Urgent"' },
    action: { type: 'set_priority', label: 'Set priority to High' },
  },
];

export function AutomationsModal({ 
  isOpen, 
  onClose, 
  boardId, 
  columns, 
  members 
}: AutomationsModalProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [step, setStep] = useState<Step>('list');
  const [isLoading, setIsLoading] = useState(false);
  
  // New automation form state
  const [selectedTrigger, setSelectedTrigger] = useState<string>('');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});
  const [automationName, setAutomationName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAutomations();
    }
  }, [isOpen, boardId]);

  const loadAutomations = async () => {
    const { data, error } = await supabase
      .from('board_automations')
      .select('*')
      .eq('board_id', boardId);

    if (error) {
      console.error(error);
      return;
    }

    setAutomations(data as Automation[]);
  };

  const resetForm = () => {
    setStep('list');
    setSelectedTrigger('');
    setTriggerConfig({});
    setSelectedAction('');
    setActionConfig({});
    setAutomationName('');
  };

  const handleToggleAutomation = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('board_automations')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update automation');
      return;
    }

    setAutomations(prev => 
      prev.map(a => a.id === id ? { ...a, is_active: isActive } : a)
    );
  };

  const handleDeleteAutomation = async (id: string) => {
    const { error } = await supabase
      .from('board_automations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete automation');
      return;
    }

    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automation deleted');
  };

  const handleCreateAutomation = async () => {
    if (!automationName || !selectedTrigger || !selectedAction) return;

    setIsLoading(true);
    try {
      const triggerType = selectedTrigger as 'card_moved' | 'card_created' | 'due_date_approaching' | 'card_completed';
      const actionType = selectedAction as 'assign_user' | 'set_priority' | 'add_label' | 'notify' | 'move_card';
      
      const { error } = await supabase
        .from('board_automations')
        .insert([{
          board_id: boardId,
          name: automationName,
          trigger_type: triggerType,
          trigger_config: JSON.parse(JSON.stringify(triggerConfig)),
          action_type: actionType,
          action_config: JSON.parse(JSON.stringify(actionConfig)),
          is_active: true,
        }]);

      if (error) throw error;

      toast.success('Automation created');
      await loadAutomations();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create automation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTriggerConfig = () => {
    switch (selectedTrigger) {
      case 'card_moved':
        return (
          <div className="space-y-2">
            <Label>When card moves to</Label>
            <Select
              value={triggerConfig.column_id as string}
              onValueChange={(v) => setTriggerConfig({ ...triggerConfig, column_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'due_date_approaching':
        return (
          <div className="space-y-2">
            <Label>Days before due date</Label>
            <Select
              value={String(triggerConfig.days_before || 3)}
              onValueChange={(v) => setTriggerConfig({ ...triggerConfig, days_before: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="2">2 days</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="5">5 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'card_created':
        return (
          <div className="space-y-2">
            <Label>In column (optional)</Label>
            <Select
              value={triggerConfig.column_id as string || 'any'}
              onValueChange={(v) => setTriggerConfig({ ...triggerConfig, column_id: v === 'any' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any column</SelectItem>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionConfig = () => {
    switch (selectedAction) {
      case 'assign_user':
        return (
          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select
              value={actionConfig.user_id as string}
              onValueChange={(v) => setActionConfig({ ...actionConfig, user_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.user_id}>
                    {member.user_id.slice(0, 8)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'set_priority':
        return (
          <div className="space-y-2">
            <Label>Set priority to</Label>
            <Select
              value={actionConfig.priority as string}
              onValueChange={(v) => setActionConfig({ ...actionConfig, priority: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'move_card':
        return (
          <div className="space-y-2">
            <Label>Move to column</Label>
            <Select
              value={actionConfig.column_id as string}
              onValueChange={(v) => setActionConfig({ ...actionConfig, column_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'notify':
        return (
          <div className="space-y-2">
            <Label>Notify</Label>
            <Select
              value={actionConfig.notify_type as string || 'assignee'}
              onValueChange={(v) => setActionConfig({ ...actionConfig, notify_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignee">Card assignee</SelectItem>
                <SelectItem value="creator">Card creator</SelectItem>
                <SelectItem value="all_members">All board members</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Board Automations
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            {step === 'list' && (
              <div className="space-y-6">
                {/* Existing Automations */}
                {automations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Active Automations</h3>
                    {automations.map((automation) => {
                      const TriggerIcon = TRIGGER_OPTIONS.find(t => t.value === automation.trigger_type)?.icon || Zap;
                      const ActionIcon = ACTION_OPTIONS.find(a => a.value === automation.action_type)?.icon || Zap;
                      
                      return (
                        <Card key={automation.id} className="group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <Switch
                                  checked={automation.is_active}
                                  onCheckedChange={(checked) => handleToggleAutomation(automation.id, checked)}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{automation.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <TriggerIcon className="h-3 w-3" />
                                    <span>{TRIGGER_OPTIONS.find(t => t.value === automation.trigger_type)?.label}</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <ActionIcon className="h-3 w-3" />
                                    <span>{ACTION_OPTIONS.find(a => a.value === automation.action_type)?.label}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive"
                                onClick={() => handleDeleteAutomation(automation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => setStep('trigger')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Automation
                </Button>

                {/* Suggested automations for nonprofits */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Suggested for Nonprofits</h3>
                  {NONPROFIT_EXAMPLES.map((example, i) => (
                    <Card key={i} className="bg-muted/30 border-dashed">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{example.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {example.trigger.label} → {example.action.label}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 'trigger' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">When...</h3>
                <div className="grid grid-cols-1 gap-2">
                  {TRIGGER_OPTIONS.map((trigger) => (
                    <Card 
                      key={trigger.value}
                      className={`cursor-pointer transition-colors ${selectedTrigger === trigger.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedTrigger(trigger.value)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <trigger.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{trigger.label}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedTrigger && (
                  <div className="pt-4 border-t">
                    {renderTriggerConfig()}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button 
                    onClick={() => setStep('action')}
                    disabled={!selectedTrigger}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 'action' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Then...</h3>
                <div className="grid grid-cols-1 gap-2">
                  {ACTION_OPTIONS.map((action) => (
                    <Card 
                      key={action.value}
                      className={`cursor-pointer transition-colors ${selectedAction === action.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedAction(action.value)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <action.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{action.label}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedAction && (
                  <div className="pt-4 border-t">
                    {renderActionConfig()}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep('trigger')}>Back</Button>
                  <Button 
                    onClick={() => setStep('name')}
                    disabled={!selectedAction}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 'name' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Name your automation</h3>
                
                <div className="space-y-2">
                  <Label>Automation Name</Label>
                  <Input
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                    placeholder="e.g., Notify on submission"
                  />
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Summary</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>When {TRIGGER_OPTIONS.find(t => t.value === selectedTrigger)?.label.toLowerCase()}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{ACTION_OPTIONS.find(a => a.value === selectedAction)?.label.toLowerCase()}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep('action')}>Back</Button>
                  <Button 
                    onClick={handleCreateAutomation}
                    disabled={!automationName || isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Automation'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
