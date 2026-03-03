import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ConstituentAutocomplete } from '@/components/soft-credits/ConstituentAutocomplete';

interface Constituent {
  id: string;
  full_legal_name: string;
  primary_email: string | null;
}

interface ManualRecipientSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRecipientCountChange: (count: number) => void;
}

export function ManualRecipientSelector({
  selectedIds,
  onSelectionChange,
  onRecipientCountChange,
}: ManualRecipientSelectorProps) {
  const [selectedConstituents, setSelectedConstituents] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch constituent details for selected IDs
  useEffect(() => {
    const fetchSelectedConstituents = async () => {
      if (selectedIds.length === 0) {
        setSelectedConstituents([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('constituents')
        .select('id, full_legal_name, primary_email')
        .in('id', selectedIds);

      if (!error && data) {
        setSelectedConstituents(data);
      }
      setLoading(false);
    };

    fetchSelectedConstituents();
  }, [selectedIds]);

  // Update recipient count
  useEffect(() => {
    onRecipientCountChange(selectedIds.length);
  }, [selectedIds.length, onRecipientCountChange]);

  const handleSelect = (id: string, constituent: Constituent) => {
    if (!selectedIds.includes(id)) {
      onSelectionChange([...selectedIds, id]);
      setSelectedConstituents([...selectedConstituents, constituent]);
    }
  };

  const handleRemove = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id));
    setSelectedConstituents(selectedConstituents.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
    setSelectedConstituents([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div>
        <ConstituentAutocomplete
          value=""
          onSelect={handleSelect}
          excludeIds={selectedIds}
        />
      </div>

      {/* Recipient Count */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {selectedIds.length} recipient{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        {selectedIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Selected Recipients List */}
      {selectedConstituents.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {selectedConstituents.map((constituent) => (
                  <div
                    key={constituent.id}
                    className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {constituent.full_legal_name}
                      </p>
                      {constituent.primary_email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {constituent.primary_email}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(constituent.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {selectedIds.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Search for constituents above to add them to your campaign</p>
        </div>
      )}
    </div>
  );
}
