import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface Constituent {
  id: string;
  full_legal_name: string;
  primary_email: string | null;
}

interface ConstituentAutocompleteProps {
  value: string;
  onSelect: (constituentId: string, constituent: Constituent) => void;
  excludeIds?: string[];
  disabled?: boolean;
}

// Custom debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ConstituentAutocomplete({
  value,
  onSelect,
  excludeIds = [],
  disabled = false,
}: ConstituentAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConstituent, setSelectedConstituent] = useState<Constituent | null>(null);

  const debouncedSearch = useDebounceValue(searchTerm, 300);

  // Fetch selected constituent on mount if value exists
  useEffect(() => {
    if (value && !selectedConstituent) {
      const fetchSelected = async () => {
        const { data } = await supabase
          .from('constituents')
          .select('id, full_legal_name, primary_email')
          .eq('id', value)
          .single();
        if (data) {
          setSelectedConstituent(data);
        }
      };
      fetchSelected();
    }
  }, [value]);

  // Search constituents
  useEffect(() => {
    const searchConstituents = async () => {
      setLoading(true);
      let query = supabase
        .from('constituents')
        .select('id, full_legal_name, primary_email')
        .order('full_legal_name')
        .limit(20);

      if (debouncedSearch) {
        query = query.or(
          `full_legal_name.ilike.%${debouncedSearch}%,primary_email.ilike.%${debouncedSearch}%`
        );
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out excluded IDs
        const filtered = data.filter((c) => !excludeIds.includes(c.id));
        setConstituents(filtered);
      }
      setLoading(false);
    };

    if (open) {
      searchConstituents();
    }
  }, [debouncedSearch, open, excludeIds]);

  const handleSelect = (constituent: Constituent) => {
    setSelectedConstituent(constituent);
    onSelect(constituent.id, constituent);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedConstituent ? (
            <span className="truncate">{selectedConstituent.full_legal_name}</span>
          ) : (
            <span className="text-muted-foreground">Search constituents...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search by name or email..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : constituents.length === 0 ? (
              <CommandEmpty>No constituents found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {constituents.map((constituent) => (
                  <CommandItem
                    key={constituent.id}
                    value={constituent.id}
                    onSelect={() => handleSelect(constituent)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === constituent.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{constituent.full_legal_name}</span>
                      {constituent.primary_email && (
                        <span className="text-xs text-muted-foreground">
                          {constituent.primary_email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
