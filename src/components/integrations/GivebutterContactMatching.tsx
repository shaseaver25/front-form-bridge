import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Users, 
  UserPlus, 
  Link2, 
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
} from "lucide-react";
import { 
  useGivebutterContacts, 
  useMatchContact, 
  useCreateConstituentFromContact,
  GivebutterContact,
} from "@/hooks/useGivebutter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function GivebutterContactMatching() {
  const [statusFilter, setStatusFilter] = useState<string>("unmatched");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<GivebutterContact | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [importAllDialogOpen, setImportAllDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch unmatched contacts (not in constituent list)
  const { data: contacts, isLoading } = useGivebutterContacts(
    statusFilter === "all" ? undefined : 
    statusFilter === "unmatched" ? "pending" : statusFilter
  );
  
  const { mutate: matchContact, isPending: matching } = useMatchContact();
  const { mutate: createConstituent, isPending: creating } = useCreateConstituentFromContact();

  // Get count of unmatched contacts for the import all feature
  const unmatchedContacts = contacts?.filter(
    c => c.match_status !== "matched" && c.match_status !== "new_created"
  ) || [];

  // Bulk import mutation
  const bulkImport = useMutation({
    mutationFn: async (contactsToImport: GivebutterContact[]) => {
      const results = [];
      let skipped = 0;
      
      // Get all existing constituent emails to check for duplicates
      const emails = contactsToImport
        .map(c => c.email)
        .filter((email): email is string => !!email);
      
      const { data: existingConstituents } = await supabase
        .from("constituents")
        .select("id, primary_email")
        .in("primary_email", emails);
      
      const existingEmails = new Set(
        existingConstituents?.map(c => c.primary_email?.toLowerCase()) || []
      );
      
      for (const contact of contactsToImport) {
        // Skip if email already exists in constituents
        if (contact.email && existingEmails.has(contact.email.toLowerCase())) {
          // Just link the existing constituent
          const existing = existingConstituents?.find(
            c => c.primary_email?.toLowerCase() === contact.email?.toLowerCase()
          );
          if (existing) {
            await supabase
              .from("givebutter_contacts")
              .update({
                constituent_id: existing.id,
                match_status: "matched",
                match_confidence: 1.0,
              })
              .eq("id", contact.id);
          }
          skipped++;
          continue;
        }
        
        // Create constituent
        const { data: constituent, error: constituentError } = await supabase
          .from("constituents")
          .insert({
            full_legal_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email || "Unknown",
            first_name: contact.first_name,
            last_name: contact.last_name,
            primary_email: contact.email,
            phone: contact.phone,
            employer: contact.company,
            total_lifetime_giving: contact.total_contributions || 0,
          })
          .select()
          .single();

        if (constituentError) {
          console.error("Error creating constituent:", constituentError);
          continue;
        }

        // Update givebutter contact with constituent link
        const { error: updateError } = await supabase
          .from("givebutter_contacts")
          .update({
            constituent_id: constituent.id,
            match_status: "new_created",
            match_confidence: 1.0,
          })
          .eq("id", contact.id);

        if (updateError) {
          console.error("Error updating contact:", updateError);
        } else {
          results.push(constituent);
        }
      }
      
      return { imported: results, skipped };
    },
    onSuccess: ({ imported, skipped }) => {
      const message = skipped > 0 
        ? `Imported ${imported.length} new contacts. ${skipped} already existed and were linked.`
        : `Successfully imported ${imported.length} contacts as new constituents`;
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["givebutter-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["constituents"] });
      setImportAllDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to import contacts: " + error.message);
    },
  });

  // Search constituents for manual matching
  const { data: searchResults } = useQuery({
    queryKey: ["constituents-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from("constituents")
        .select("id, full_legal_name, first_name, last_name, primary_email")
        .or(`primary_email.ilike.%${searchQuery}%,full_legal_name.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "matched":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Matched</Badge>;
      case "new_created":
        return <Badge className="bg-blue-500"><UserPlus className="h-3 w-3 mr-1" />Created</Badge>;
      case "manual_review":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Review</Badge>;
      default:
        return <Badge variant="outline"><HelpCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    
    const percent = Math.round(confidence * 100);
    const variant = percent >= 80 ? "default" : percent >= 50 ? "secondary" : "outline";
    
    return <Badge variant={variant}>{percent}%</Badge>;
  };

  const handleMatch = (constituentId: string) => {
    if (!selectedContact) return;
    
    matchContact({
      contactId: selectedContact.id,
      constituentId,
    }, {
      onSuccess: () => {
        setMatchDialogOpen(false);
        setSelectedContact(null);
        setSearchQuery("");
      },
    });
  };

  const handleCreateNew = () => {
    if (!selectedContact) return;
    
    createConstituent(selectedContact, {
      onSuccess: () => {
        setMatchDialogOpen(false);
        setSelectedContact(null);
      },
    });
  };

  const handleImportAll = () => {
    bulkImport.mutate(unmatchedContacts);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Matching
              </CardTitle>
              <CardDescription>
                {statusFilter === "unmatched" 
                  ? `${unmatchedContacts.length} Givebutter contacts not yet in your constituent list.`
                  : "Match Givebutter contacts to existing constituents or create new records."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {unmatchedContacts.length > 0 && (
                <Button
                  onClick={() => setImportAllDialogOpen(true)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Import All ({unmatchedContacts.length})
                </Button>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="new_created">Created</SelectItem>
                  <SelectItem value="manual_review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!contacts?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found with the selected filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Giving</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        {contact.company && (
                          <div className="text-sm text-muted-foreground">
                            {contact.company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contact.email || "-"}
                    </TableCell>
                    <TableCell>
                      ${(contact.total_contributions || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(contact.match_status)}</TableCell>
                    <TableCell>{getConfidenceBadge(contact.match_confidence)}</TableCell>
                    <TableCell>
                      {contact.match_status !== "matched" && contact.match_status !== "new_created" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(contact);
                            setMatchDialogOpen(true);
                          }}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Match
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Import All Confirmation Dialog */}
      <AlertDialog open={importAllDialogOpen} onOpenChange={setImportAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import All Unmatched Contacts</AlertDialogTitle>
            <AlertDialogDescription>
              This will create {unmatchedContacts.length} new constituent records from your 
              Givebutter contacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleImportAll}
              disabled={bulkImport.isPending}
            >
              {bulkImport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {unmatchedContacts.length} Contacts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match Contact</DialogTitle>
            <DialogDescription>
              Match {selectedContact?.first_name} {selectedContact?.last_name} to an existing 
              constituent or create a new record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Contact Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">
                {selectedContact?.first_name} {selectedContact?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedContact?.email}
              </div>
              {selectedContact?.company && (
                <div className="text-sm text-muted-foreground">
                  {selectedContact.company}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Constituents</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                {searchResults.map((constituent) => (
                  <div
                    key={constituent.id}
                    className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                    onClick={() => handleMatch(constituent.id)}
                  >
                    <div>
                      <div className="font-medium">{constituent.full_legal_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {constituent.primary_email}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" disabled={matching}>
                      {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults?.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No matching constituents found.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNew} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              Create New Constituent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}