import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Flag, Link2, Building2, DollarSign, Sparkles, Users, UserCircle, X, Search, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BoardCard, BoardMember } from '@/types/boards';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Constituent {
  id: string;
  full_legal_name: string;
  primary_email: string | null;
}

interface LinkedBoard {
  id: string;
  name: string;
}

interface CardDetailsFormProps {
  card: Partial<BoardCard> & { linked_board_id?: string | null };
  members: BoardMember[];
  currentBoardId?: string;
  onChange: (updates: Partial<BoardCard> & { linked_board_id?: string | null }) => void;
  onAiEstimate?: () => void;
  isLoading?: boolean;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-muted' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-destructive' },
];

export function CardDetailsForm({
  card,
  members,
  currentBoardId,
  onChange,
  onAiEstimate,
  isLoading,
}: CardDetailsFormProps) {
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [constituentSearch, setConstituentSearch] = useState('');
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [loadingConstituents, setLoadingConstituents] = useState(false);
  const [linkedConstituent, setLinkedConstituent] = useState<Constituent | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [availableBoards, setAvailableBoards] = useState<LinkedBoard[]>([]);
  const [linkedBoard, setLinkedBoard] = useState<LinkedBoard | null>(null);
  const [boardSearch, setBoardSearch] = useState('');
  const [loadingBoards, setLoadingBoards] = useState(false);
  
  const { members: teamMembers, getDisplayName, getMemberById } = useTeamMembers();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Load linked constituent details
  useEffect(() => {
    if (card.linked_contact_id) {
      supabase
        .from('constituents')
        .select('id, full_legal_name, primary_email')
        .eq('id', card.linked_contact_id)
        .single()
        .then(({ data }) => {
          if (data) setLinkedConstituent(data);
        });
    } else {
      setLinkedConstituent(null);
    }
  }, [card.linked_contact_id]);

  // Load linked board details
  useEffect(() => {
    if (card.linked_board_id) {
      supabase
        .from('boards')
        .select('id, name')
        .eq('id', card.linked_board_id)
        .single()
        .then(({ data }) => {
          if (data) setLinkedBoard(data);
        });
    } else {
      setLinkedBoard(null);
    }
  }, [card.linked_board_id]);

  // Search boards
  useEffect(() => {
    const searchBoards = async () => {
      if (boardSearch.length < 1) {
        // Load all available boards when not searching
        setLoadingBoards(true);
        const { data } = await supabase
          .from('boards')
          .select('id, name')
          .neq('id', currentBoardId || '')
          .eq('is_archived', false)
          .order('name')
          .limit(20);
        
        setAvailableBoards(data || []);
        setLoadingBoards(false);
        return;
      }
      
      setLoadingBoards(true);
      const { data } = await supabase
        .from('boards')
        .select('id, name')
        .neq('id', currentBoardId || '')
        .eq('is_archived', false)
        .ilike('name', `%${boardSearch}%`)
        .limit(10);
      
      setAvailableBoards(data || []);
      setLoadingBoards(false);
    };

    const debounce = setTimeout(searchBoards, 300);
    return () => clearTimeout(debounce);
  }, [boardSearch, currentBoardId]);

  // Search constituents
  useEffect(() => {
    const searchConstituents = async () => {
      if (constituentSearch.length < 2) {
        setConstituents([]);
        return;
      }
      
      setLoadingConstituents(true);
      const { data } = await supabase
        .from('constituents')
        .select('id, full_legal_name, primary_email')
        .ilike('full_legal_name', `%${constituentSearch}%`)
        .limit(10);
      
      setConstituents(data || []);
      setLoadingConstituents(false);
    };

    const debounce = setTimeout(searchConstituents, 300);
    return () => clearTimeout(debounce);
  }, [constituentSearch]);

  const handleDueDateSelect = (date: Date | undefined) => {
    onChange({ due_date: date?.toISOString() || null });
    setDueDateOpen(false);
  };

  const setQuickDueDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange({ due_date: date.toISOString() });
    setDueDateOpen(false);
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const assignee = card.assigned_to ? getMemberById(card.assigned_to) : null;

  return (
    <div className="space-y-4">
      {/* Assignee */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          Assignee (Team Member)
        </Label>
        <Select
          value={card.assigned_to || 'unassigned'}
          onValueChange={(value) => 
            onChange({ assigned_to: value === 'unassigned' ? null : value })
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue>
              {assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(getDisplayName(assignee))}
                    </AvatarFallback>
                  </Avatar>
                  <span>{getDisplayName(assignee)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Unassigned
              </div>
            </SelectItem>
            {currentUserId && (
              <SelectItem value={currentUserId}>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <span>Assign to me</span>
                </div>
              </SelectItem>
            )}
            {teamMembers.filter(m => m.id !== currentUserId).map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(getDisplayName(member))}
                    </AvatarFallback>
                  </Avatar>
                  <span>{getDisplayName(member)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Due Date
        </Label>
        <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !card.due_date && 'text-muted-foreground'
              )}
              disabled={isLoading}
            >
              {card.due_date ? format(new Date(card.due_date), 'PPP') : 'No due date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex gap-1 p-2 border-b">
              <Button size="sm" variant="ghost" onClick={() => setQuickDueDate(0)}>
                Today
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setQuickDueDate(1)}>
                Tomorrow
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setQuickDueDate(7)}>
                Next Week
              </Button>
            </div>
            <CalendarComponent
              mode="single"
              selected={card.due_date ? new Date(card.due_date) : undefined}
              onSelect={handleDueDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
            {card.due_date && (
              <div className="p-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-destructive"
                  onClick={() => handleDueDateSelect(undefined)}
                >
                  Clear due date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <Flag className="h-4 w-4" />
          Priority
        </Label>
        <Select
          value={card.priority || 'medium'}
          onValueChange={(value) => onChange({ priority: value as Priority })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', option.color)} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Estimate */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          Time Estimate
        </Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Hours"
            value={card.estimated_hours || ''}
            onChange={(e) => 
              onChange({ estimated_hours: e.target.value ? parseFloat(e.target.value) : null })
            }
            disabled={isLoading}
            className="flex-1"
          />
          {onAiEstimate && (
            <Button
              variant="outline"
              size="icon"
              onClick={onAiEstimate}
              disabled={isLoading}
              title="Get AI estimate"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Time Logged */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          Time Logged
        </Label>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <span className="text-sm">
            {card.actual_hours ? `${card.actual_hours.toFixed(1)} hours` : 'No time logged'}
          </span>
        </div>
      </div>

      {/* Links Section */}
      <div className="pt-4 border-t space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Links
        </h4>

        {/* Linked Project */}
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-2">
            <FolderKanban className="h-3 w-3" />
            Linked Project
          </Label>
          {linkedBoard ? (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{linkedBoard.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onChange({ linked_board_id: null })}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled={isLoading}>
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Link to Project
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={boardSearch}
                      onChange={(e) => setBoardSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {loadingBoards ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
                    ) : availableBoards.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No projects found
                      </p>
                    ) : (
                      availableBoards.map((b) => (
                        <Button
                          key={b.id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-2"
                          onClick={() => {
                            onChange({ linked_board_id: b.id });
                            setBoardSearch('');
                          }}
                        >
                          <FolderKanban className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{b.name}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Linked Contact / Constituent */}
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-2">
            <Users className="h-3 w-3" />
            Linked Contact
          </Label>
          {linkedConstituent ? (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-accent/20 text-accent-foreground">
                    {getInitials(linkedConstituent.full_legal_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{linkedConstituent.full_legal_name}</p>
                  {linkedConstituent.primary_email && (
                    <p className="text-xs text-muted-foreground">{linkedConstituent.primary_email}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onChange({ linked_contact_id: null })}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled={isLoading}>
                  <Users className="h-4 w-4 mr-2" />
                  Link Contact
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={constituentSearch}
                      onChange={(e) => setConstituentSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {loadingConstituents ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Searching...</p>
                    ) : constituents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {constituentSearch.length < 2 ? 'Type to search...' : 'No results found'}
                      </p>
                    ) : (
                      constituents.map((c) => (
                        <Button
                          key={c.id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-2"
                          onClick={() => {
                            onChange({ linked_contact_id: c.id });
                            setConstituentSearch('');
                          }}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(c.full_legal_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="text-sm font-medium">{c.full_legal_name}</p>
                            {c.primary_email && (
                              <p className="text-xs text-muted-foreground">{c.primary_email}</p>
                            )}
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Linked Job */}
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            Linked Job
          </Label>
          {card.linked_grant_id ? (
            <div className="p-2 bg-muted/50 rounded-md text-sm flex items-center justify-between">
              <span>
                <span className="text-muted-foreground">Job linked</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onChange({ linked_grant_id: null })}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" disabled={isLoading}>
              Link Job
            </Button>
          )}
        </div>

        {/* Linked Donation */}
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-3 w-3" />
            Linked Donation
          </Label>
          {card.linked_donation_id ? (
            <div className="p-2 bg-muted/50 rounded-md text-sm flex items-center justify-between">
              <span>
                <span className="text-muted-foreground">Donation linked</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onChange({ linked_donation_id: null })}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" disabled={isLoading}>
              Link Donation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
