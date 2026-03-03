import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Mail, Phone, Star, Crown } from "lucide-react";
import { AddSiteContactDialog } from "./AddSiteContactDialog";
import { toast } from "sonner";

interface SiteContactsSectionProps {
  siteId: string;
}

export function SiteContactsSection({ siteId }: SiteContactsSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["site-contacts", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_contacts")
        .select(`
          *,
          constituent:constituents(
            id,
            full_legal_name,
            first_name,
            last_name,
            primary_email,
            phone,
            title
          )
        `)
        .eq("site_id", siteId)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("site_contacts")
        .delete()
        .eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-contacts", siteId] });
      toast.success("Contact removed");
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Contacts ({contacts?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Contact
        </Button>
      </div>

      {contacts && contacts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {contact.constituent?.first_name} {contact.constituent?.last_name}
                      </span>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      {contact.is_decision_maker && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Decision Maker
                        </Badge>
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    )}
                    {contact.constituent?.primary_email && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {contact.constituent.primary_email}
                      </p>
                    )}
                    {contact.constituent?.phone && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {contact.constituent.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No contacts linked to this site yet.
          </CardContent>
        </Card>
      )}

      <AddSiteContactDialog
        siteId={siteId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
