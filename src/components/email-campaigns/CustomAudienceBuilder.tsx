import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Users, Filter, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface SegmentCriteria {
  searchTerm?: string;
  donorTypes?: string[];
  givingLevels?: string[];
  minLifetimeGiving?: number;
  maxLifetimeGiving?: number;
  firstGiftDateAfter?: string;
  firstGiftDateBefore?: string;
  lastGiftDateAfter?: string;
  lastGiftDateBefore?: string;
  cities?: string[];
  states?: string[];
}

interface CustomAudienceBuilderProps {
  criteria: SegmentCriteria;
  onCriteriaChange: (criteria: SegmentCriteria) => void;
  onRecipientCountChange: (count: number) => void;
}

const donorTypeOptions = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Organization', label: 'Organization' },
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Corporation', label: 'Corporation' },
];

const givingLevelOptions = [
  { value: 'Major Donor', label: 'Major Donor ($1,000+)' },
  { value: 'Mid-Level', label: 'Mid-Level ($250-$999)' },
  { value: 'General', label: 'General (<$250)' },
];

export function CustomAudienceBuilder({
  criteria,
  onCriteriaChange,
  onRecipientCountChange,
}: CustomAudienceBuilderProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Build query based on criteria
  const buildQuery = () => {
    let query = supabase
      .from('constituents')
      .select('id, full_legal_name, primary_email, donor_type, giving_level, total_lifetime_giving')
      .not('primary_email', 'is', null)
      .eq('do_not_email', false);

    if (criteria.searchTerm) {
      query = query.or(
        `full_legal_name.ilike.%${criteria.searchTerm}%,primary_email.ilike.%${criteria.searchTerm}%`
      );
    }
    if (criteria.donorTypes?.length) {
      query = query.in('donor_type', criteria.donorTypes);
    }
    if (criteria.givingLevels?.length) {
      query = query.in('giving_level', criteria.givingLevels);
    }
    if (criteria.minLifetimeGiving !== undefined) {
      query = query.gte('total_lifetime_giving', criteria.minLifetimeGiving);
    }
    if (criteria.maxLifetimeGiving !== undefined) {
      query = query.lte('total_lifetime_giving', criteria.maxLifetimeGiving);
    }
    if (criteria.firstGiftDateAfter) {
      query = query.gte('first_gift_date', criteria.firstGiftDateAfter);
    }
    if (criteria.firstGiftDateBefore) {
      query = query.lte('first_gift_date', criteria.firstGiftDateBefore);
    }
    if (criteria.lastGiftDateAfter) {
      query = query.gte('last_gift_date', criteria.lastGiftDateAfter);
    }
    if (criteria.lastGiftDateBefore) {
      query = query.lte('last_gift_date', criteria.lastGiftDateBefore);
    }
    if (criteria.cities?.length) {
      query = query.in('mailing_city', criteria.cities);
    }
    if (criteria.states?.length) {
      query = query.in('mailing_state', criteria.states);
    }

    return query;
  };

  // Get recipient count
  const { data: countData, isLoading: countLoading } = useQuery({
    queryKey: ['custom-audience-count', criteria],
    queryFn: async () => {
      let query = supabase
        .from('constituents')
        .select('id', { count: 'exact', head: true })
        .not('primary_email', 'is', null)
        .eq('do_not_email', false);

      if (criteria.searchTerm) {
        query = query.or(
          `full_legal_name.ilike.%${criteria.searchTerm}%,primary_email.ilike.%${criteria.searchTerm}%`
        );
      }
      if (criteria.donorTypes?.length) {
        query = query.in('donor_type', criteria.donorTypes);
      }
      if (criteria.givingLevels?.length) {
        query = query.in('giving_level', criteria.givingLevels);
      }
      if (criteria.minLifetimeGiving !== undefined) {
        query = query.gte('total_lifetime_giving', criteria.minLifetimeGiving);
      }
      if (criteria.maxLifetimeGiving !== undefined) {
        query = query.lte('total_lifetime_giving', criteria.maxLifetimeGiving);
      }
      if (criteria.firstGiftDateAfter) {
        query = query.gte('first_gift_date', criteria.firstGiftDateAfter);
      }
      if (criteria.firstGiftDateBefore) {
        query = query.lte('first_gift_date', criteria.firstGiftDateBefore);
      }
      if (criteria.lastGiftDateAfter) {
        query = query.gte('last_gift_date', criteria.lastGiftDateAfter);
      }
      if (criteria.lastGiftDateBefore) {
        query = query.lte('last_gift_date', criteria.lastGiftDateBefore);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // Get preview list
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['custom-audience-preview', criteria],
    queryFn: async () => {
      const query = buildQuery().limit(10);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: showPreview,
  });

  useEffect(() => {
    if (countData !== undefined) {
      onRecipientCountChange(countData);
    }
  }, [countData, onRecipientCountChange]);

  const updateCriteria = (updates: Partial<SegmentCriteria>) => {
    onCriteriaChange({ ...criteria, ...updates });
  };

  const toggleArrayValue = (
    field: keyof SegmentCriteria,
    value: string
  ) => {
    const current = (criteria[field] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateCriteria({ [field]: updated.length ? updated : undefined });
  };

  const activeFilterCount = [
    criteria.searchTerm,
    criteria.donorTypes?.length,
    criteria.givingLevels?.length,
    criteria.minLifetimeGiving !== undefined,
    criteria.maxLifetimeGiving !== undefined,
    criteria.firstGiftDateAfter,
    criteria.firstGiftDateBefore,
    criteria.lastGiftDateAfter,
    criteria.lastGiftDateBefore,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={criteria.searchTerm || ''}
          onChange={(e) => updateCriteria({ searchTerm: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      {/* Recipient Count */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {countLoading ? (
              <Loader2 className="h-4 w-4 animate-spin inline" />
            ) : (
              `${countData?.toLocaleString() || 0} recipients match`
            )}
          </span>
        </div>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">
            <Filter className="h-3 w-3 mr-1" />
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters Accordion */}
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="donor-type">
          <AccordionTrigger className="text-sm">
            Donor Type
            {criteria.donorTypes?.length ? (
              <Badge variant="secondary" className="ml-2">
                {criteria.donorTypes.length}
              </Badge>
            ) : null}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {donorTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`donor-type-${option.value}`}
                    checked={criteria.donorTypes?.includes(option.value)}
                    onCheckedChange={() => toggleArrayValue('donorTypes', option.value)}
                  />
                  <Label htmlFor={`donor-type-${option.value}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="giving-level">
          <AccordionTrigger className="text-sm">
            Giving Level
            {criteria.givingLevels?.length ? (
              <Badge variant="secondary" className="ml-2">
                {criteria.givingLevels.length}
              </Badge>
            ) : null}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {givingLevelOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`giving-level-${option.value}`}
                    checked={criteria.givingLevels?.includes(option.value)}
                    onCheckedChange={() => toggleArrayValue('givingLevels', option.value)}
                  />
                  <Label htmlFor={`giving-level-${option.value}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="lifetime-giving">
          <AccordionTrigger className="text-sm">
            Total Lifetime Giving
            {(criteria.minLifetimeGiving !== undefined || criteria.maxLifetimeGiving !== undefined) && (
              <Badge variant="secondary" className="ml-2">1</Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Minimum ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={criteria.minLifetimeGiving || ''}
                  onChange={(e) =>
                    updateCriteria({
                      minLifetimeGiving: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Maximum ($)</Label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={criteria.maxLifetimeGiving || ''}
                  onChange={(e) =>
                    updateCriteria({
                      maxLifetimeGiving: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="gift-dates">
          <AccordionTrigger className="text-sm">
            Gift Date Range
            {(criteria.firstGiftDateAfter || criteria.lastGiftDateAfter) && (
              <Badge variant="secondary" className="ml-2">1</Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">First Gift Date</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">After</Label>
                    <Input
                      type="date"
                      value={criteria.firstGiftDateAfter || ''}
                      onChange={(e) => updateCriteria({ firstGiftDateAfter: e.target.value || undefined })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Before</Label>
                    <Input
                      type="date"
                      value={criteria.firstGiftDateBefore || ''}
                      onChange={(e) => updateCriteria({ firstGiftDateBefore: e.target.value || undefined })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Gift Date</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">After</Label>
                    <Input
                      type="date"
                      value={criteria.lastGiftDateAfter || ''}
                      onChange={(e) => updateCriteria({ lastGiftDateAfter: e.target.value || undefined })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Before</Label>
                    <Input
                      type="date"
                      value={criteria.lastGiftDateBefore || ''}
                      onChange={(e) => updateCriteria({ lastGiftDateBefore: e.target.value || undefined })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Preview Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowPreview(!showPreview)}
      >
        <Eye className="h-4 w-4 mr-2" />
        {showPreview ? 'Hide Preview' : 'Preview Recipients'}
      </Button>

      {/* Preview List */}
      {showPreview && (
        <Card>
          <CardContent className="p-3">
            {previewLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : previewData?.length ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Showing first 10 of {countData?.toLocaleString()} recipients
                </p>
                {previewData.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50 text-sm"
                  >
                    <span className="font-medium truncate">{recipient.full_legal_name}</span>
                    <span className="text-muted-foreground text-xs truncate ml-2">
                      {recipient.primary_email}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recipients match your criteria
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
