import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Plus, X, Tag, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContactTagManagerProps {
  contactId: string;
  tags: { id: string; name: string; category?: string }[];
  onTagsChange: () => void;
}

export default function ContactTagManager({ contactId, tags, onTagsChange }: ContactTagManagerProps) {
  const [allTags, setAllTags] = useState<{ id: string; name: string; category?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("crm_tags")
      .select("id, name, category")
      .order("name")
      .then(({ data }) => setAllTags(data || []));
  }, []);

  const appliedIds = new Set(tags.map((t) => t.id));

  const addTag = useCallback(async (tagId: string) => {
    const { error } = await supabase
      .from("crm_contact_tags")
      .insert({ contact_id: contactId, tag_id: tagId });
    if (error) {
      toast({ title: "Error adding tag", description: error.message, variant: "destructive" });
    } else {
      onTagsChange();
    }
  }, [contactId, onTagsChange, toast]);

  const removeTag = useCallback(async (tagId: string) => {
    const { error } = await supabase
      .from("crm_contact_tags")
      .delete()
      .eq("contact_id", contactId)
      .eq("tag_id", tagId);
    if (error) {
      toast({ title: "Error removing tag", description: error.message, variant: "destructive" });
    } else {
      onTagsChange();
    }
  }, [contactId, onTagsChange, toast]);

  const toggleTag = (tagId: string) => {
    if (appliedIds.has(tagId)) {
      removeTag(tagId);
    } else {
      addTag(tagId);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="text-xs gap-1 pr-1">
          <Tag className="w-3 h-3" />
          {tag.name}
          <button
            onClick={() => removeTag(tag.id)}
            className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full">
            <Plus className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => toggleTag(tag.id)}
                  >
                    <Check className={`w-4 h-4 mr-2 ${appliedIds.has(tag.id) ? "opacity-100" : "opacity-0"}`} />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
