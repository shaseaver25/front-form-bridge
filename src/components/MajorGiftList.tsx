import { useState, useEffect } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Archive, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import MajorGiftForm from "./MajorGiftForm";
import { ArchiveOpportunityDialog } from "@/components/pipeline/ArchiveOpportunityDialog";
import { RecordAvatar } from "@/components/ui/record-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListCard } from "@/components/ui/list-card";
import { FloatingActions } from "@/components/ui/floating-actions";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DensityToggle } from "@/components/ui/density-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MajorGiftList = () => {
  const [majorGifts, setMajorGifts] = useState<any[]>([]);
  const { isReady } = useAuthReady();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [showArchived, setShowArchived] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchMajorGifts();
    checkAdminRole();
  }, [showArchived]);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchMajorGifts = async () => {
    setLoading(true);
    
    let query = supabase
      .from("major_gift_opportunities")
      .select(`
        *,
        constituents (
          full_legal_name
        )
      `)
      .order("created_at", { ascending: false });

    // Filter based on archived status
    if (!showArchived) {
      query = query.is("archived_at", null);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load major gift opportunities");
    } else {
      setMajorGifts(data || []);
    }
    setLoading(false);
  };

  const filteredGifts = majorGifts.filter((g) =>
    g.constituents?.full_legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.primary_solicitor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (gift: any) => {
    setSelectedGift(gift);
    setFormOpen(true);
  };

  const handleArchiveClick = (gift: any) => {
    setSelectedGift(gift);
    setArchiveDialogOpen(true);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return "text-emerald-600";
    if (probability >= 50) return "text-yellow-600";
    if (probability >= 25) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Major Gift Opportunities</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track major gift prospects through the cultivation pipeline
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <div className="flex items-center gap-2 mr-4">
                  <Switch
                    id="show-archived"
                    checked={showArchived}
                    onCheckedChange={setShowArchived}
                  />
                  <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
                    {showArchived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Show archived
                  </Label>
                </div>
              )}
              <DensityToggle value={density} onChange={setDensity} />
              <Button onClick={() => { setSelectedGift(null); setFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Opportunity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              totalCount={majorGifts.length}
              filteredCount={filteredGifts.length}
              placeholder="Search by constituent or solicitor..."
            />
          </div>

          {loading ? (
            <SkeletonCard type="major-gift" count={6} />
          ) : filteredGifts.length === 0 ? (
            <EmptyState
              type={searchTerm ? "no-results" : "no-data"}
              searchTerm={searchTerm}
              entityName="Major Gift Opportunity"
              onAction={!searchTerm ? () => { setSelectedGift(null); setFormOpen(true); } : undefined}
              actionLabel="Add Opportunity"
            />
          ) : (
            <div className={density === "comfortable" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in" : "space-y-3 animate-fade-in"}>
              {filteredGifts.map((gift) => {
                const isArchived = !!gift.archived_at;
                
                return (
                  <ListCard 
                    key={gift.id} 
                    className={`${density === "compact" ? "p-4" : ""} ${isArchived ? "opacity-60" : ""}`}
                  >
                    {!isArchived && (
                      <FloatingActions
                        onEdit={() => handleEdit(gift)}
                        onArchive={() => handleArchiveClick(gift)}
                        archiveLabel="Archive"
                      />
                    )}

                    <div className="flex items-start gap-4">
                      <RecordAvatar
                        type="major-gift"
                        amount={gift.expected_amount || 0}
                        size={density === "compact" ? "sm" : "md"}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-foreground truncate ${density === "compact" ? "text-base" : "text-lg"} ${isArchived ? "line-through" : ""}`}>
                            {gift.constituents?.full_legal_name}
                          </h3>
                          {isArchived && (
                            <Badge variant="secondary" className="text-xs">
                              <Archive className="h-3 w-3 mr-1" />
                              Archived
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {gift.primary_solicitor ? `Solicitor: ${gift.primary_solicitor}` : "No solicitor assigned"}
                        </p>

                        {density === "comfortable" && (
                          <>
                            <div className="mt-2">
                              <StatusBadge status={gift.stage} type="major-gift" />
                            </div>

                            <div className="h-px bg-border my-4" />

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                  Expected Amount
                                </p>
                                <p className="font-mono font-semibold text-primary">
                                  {gift.expected_amount
                                    ? `$${parseFloat(gift.expected_amount).toLocaleString()}`
                                    : "—"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                  Probability
                                </p>
                                {gift.probability_percent !== null ? (
                                  <div>
                                    <p className={`font-semibold ${getProbabilityColor(gift.probability_percent)}`}>
                                      {gift.probability_percent}%
                                    </p>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          gift.probability_percent >= 75
                                            ? "bg-emerald-500"
                                            : gift.probability_percent >= 50
                                            ? "bg-yellow-500"
                                            : gift.probability_percent >= 25
                                            ? "bg-orange-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{ width: `${gift.probability_percent}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">—</p>
                                )}
                              </div>
                            </div>

                            {gift.expected_date && (
                              <div className="mt-4">
                                <p className="text-xs text-muted-foreground">
                                  Expected close: <span className="font-medium text-foreground">
                                    {new Date(gift.expected_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </p>
                              </div>
                            )}

                            {isArchived && gift.archived_at && (
                              <div className="mt-4 pt-3 border-t border-dashed">
                                <p className="text-xs text-muted-foreground">
                                  Archived: {new Date(gift.archived_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                                {gift.archive_reason && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{gift.archive_reason}"
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {density === "compact" && (
                          <div className="flex items-center gap-3 mt-2">
                            <StatusBadge status={gift.stage} type="major-gift" showIcon={false} />
                            {gift.expected_amount && (
                              <span className="font-mono text-sm font-semibold text-primary">
                                ${parseFloat(gift.expected_amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </span>
                            )}
                            {isArchived && (
                              <Badge variant="secondary" className="text-xs">
                                Archived
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ListCard>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MajorGiftForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchMajorGifts}
        majorGift={selectedGift}
      />

      <ArchiveOpportunityDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        opportunity={selectedGift ? {
          id: selectedGift.id,
          name: selectedGift.constituents?.full_legal_name || "Unknown"
        } : null}
        onSuccess={fetchMajorGifts}
      />
    </>
  );
};

export default MajorGiftList;
