import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CATEGORY_LABELS: Record<string, string> = {
  household: 'Household',
  employment: 'Employment',
  board: 'Board',
  professional: 'Professional',
  family: 'Family',
  other: 'Other'
};

export const CATEGORY_ORDER = ['household', 'family', 'employment', 'board', 'professional', 'other'];

export const useConstituentRelationships = (constituentId: string) => {
  return useQuery({
    queryKey: ['relationships', constituentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('constituent_relationships')
        .select(`
          *,
          to_constituent:constituents!constituent_relationships_to_constituent_id_fkey(id, full_legal_name, primary_email),
          relationship_type:relationship_types(id, name, reciprocal_name, category, icon, affects_household_gifts)
        `)
        .eq('from_constituent_id', constituentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by category
      const grouped = (data || []).reduce((acc, rel) => {
        const category = rel.relationship_type?.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(rel);
        return acc;
      }, {} as Record<string, typeof data>);
      
      return { grouped, all: data || [] };
    },
    enabled: !!constituentId
  });
};

export const useRelationshipTypes = () => {
  return useQuery({
    queryKey: ['relationship-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_types')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Group by category for dropdown
      const grouped = (data || []).reduce((acc, type) => {
        if (!acc[type.category]) acc[type.category] = [];
        acc[type.category].push(type);
        return acc;
      }, {} as Record<string, typeof data>);
      
      return { grouped, all: data || [] };
    }
  });
};

export const useHousehold = (householdId: string | null | undefined) => {
  return useQuery({
    queryKey: ['household', householdId],
    queryFn: async () => {
      if (!householdId) return null;
      
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          primary_contact:constituents!households_primary_contact_constituent_id_fkey(id, full_legal_name)
        `)
        .eq('id', householdId)
        .single();
      
      if (error) throw error;
      
      // Get household members separately
      const { data: members } = await supabase
        .from('constituents')
        .select('id, full_legal_name, primary_email')
        .eq('household_id', householdId);
      
      return { ...data, members: members || [] };
    },
    enabled: !!householdId
  });
};

export const useHouseholdGiftsSummary = (householdId: string | null | undefined) => {
  return useQuery({
    queryKey: ['household-gifts', householdId],
    queryFn: async () => {
      if (!householdId) return null;
      
      // Get all constituent IDs in household
      const { data: members } = await supabase
        .from('constituents')
        .select('id')
        .eq('household_id', householdId);
      
      if (!members || members.length === 0) return null;
      
      const memberIds = members.map(m => m.id);
      
      // Get all gifts from household members
      const { data: gifts, error } = await supabase
        .from('gifts')
        .select('*')
        .in('constituent_id', memberIds)
        .eq('is_pledge', false)
        .order('date_received', { ascending: false });
      
      if (error) throw error;
      
      const totalAmount = (gifts || []).reduce((sum, g) => sum + Number(g.amount), 0);
      const giftCount = gifts?.length || 0;
      const lastGiftDate = gifts?.[0]?.date_received;
      
      return { totalAmount, giftCount, lastGiftDate, gifts: gifts || [] };
    },
    enabled: !!householdId
  });
};

export const useAddRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (relationship: {
      from_constituent_id: string;
      to_constituent_id: string;
      relationship_type_id: string;
      start_date?: string | null;
      end_date?: string | null;
      is_primary?: boolean;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('constituent_relationships')
        .insert({
          ...relationship,
          start_date: relationship.start_date || null,
          end_date: relationship.end_date || null,
          notes: relationship.notes || null
        })
        .select(`
          *,
          to_constituent:constituents!constituent_relationships_to_constituent_id_fkey(full_legal_name),
          relationship_type:relationship_types(name)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', data.from_constituent_id] });
      queryClient.invalidateQueries({ queryKey: ['relationships', data.to_constituent_id] });
      toast.success(`Relationship added: ${data.relationship_type?.name} to ${data.to_constituent?.full_legal_name}`);
    },
    onError: (error: Error) => {
      if (error.message.includes('unique_relationship')) {
        toast.error('This relationship already exists');
      } else {
        toast.error('Failed to add relationship: ' + error.message);
      }
    }
  });
};

export const useDeleteRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      relationshipId, 
      fromId, 
      toId 
    }: { 
      relationshipId: string;
      fromId: string;
      toId: string;
    }) => {
      const { error } = await supabase
        .from('constituent_relationships')
        .delete()
        .eq('id', relationshipId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.fromId] });
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.toId] });
      toast.success('Relationship removed');
    },
    onError: () => {
      toast.error('Failed to delete relationship');
    }
  });
};

export const useCreateHousehold = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (householdData: {
      household_name: string;
      household_type: string;
      greeting_format?: string;
      member_ids: string[];
      primary_contact_id?: string;
      notes?: string;
    }) => {
      // 1. Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          household_name: householdData.household_name,
          household_type: householdData.household_type,
          greeting_format: householdData.greeting_format || null,
          primary_contact_constituent_id: householdData.primary_contact_id || null,
          notes: householdData.notes || null
        })
        .select()
        .single();
      
      if (householdError) throw householdError;
      
      // 2. Link all members to household
      const { error: updateError } = await supabase
        .from('constituents')
        .update({ household_id: household.id })
        .in('id', householdData.member_ids);
      
      if (updateError) throw updateError;
      
      return household;
    },
    onSuccess: (data, variables) => {
      variables.member_ids.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['constituents', id] });
      });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      toast.success(`Household created: ${data.household_name}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to create household: ' + error.message);
    }
  });
};
