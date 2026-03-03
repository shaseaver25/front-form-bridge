import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
}

export const useTeamMembers = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .eq("is_active", true)
        .order("first_name", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setMembers([]);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      setError("Failed to fetch team members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (member: TeamMember): string => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    if (member.first_name) {
      return member.first_name;
    }
    if (member.last_name) {
      return member.last_name;
    }
    return "Unknown User";
  };

  const getMemberById = (id: string): TeamMember | undefined => {
    return members.find((m) => m.id === id);
  };

  return {
    members,
    loading,
    error,
    refetch: fetchTeamMembers,
    getDisplayName,
    getMemberById,
  };
};
