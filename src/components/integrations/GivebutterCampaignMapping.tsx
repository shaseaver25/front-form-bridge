import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Link2, Plus } from "lucide-react";
import { useGivebutterCampaigns, useUpdateCampaignMapping } from "@/hooks/useGivebutter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface GivebutterCampaign {
  id: string;
  title: string;
  campaign_code?: string;
  campaign_type?: string;
  status?: string;
  goal_amount?: number;
  raised_amount?: number;
  start_date?: string;
  end_date?: string;
  internal_campaign_id?: string;
}

export function GivebutterCampaignMapping() {
  const queryClient = useQueryClient();
  const { data: campaigns, isLoading } = useGivebutterCampaigns();
  const { mutate: updateMapping } = useUpdateCampaignMapping();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<GivebutterCampaign | null>(null);
  
  // Fetch internal campaigns for mapping
  const { data: internalCampaigns } = useQuery({
    queryKey: ["donation-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_campaigns")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (campaign: GivebutterCampaign) => {
      // Map Givebutter campaign types to valid internal types
      const validTypes = ['general', 'annual_fund', 'capital', 'emergency', 'event', 'peer_to_peer'];
      const mappedType = campaign.campaign_type && validTypes.includes(campaign.campaign_type.toLowerCase())
        ? campaign.campaign_type.toLowerCase()
        : 'general';

      const { data, error } = await supabase
        .from("donation_campaigns")
        .insert({
          name: campaign.title,
          description: `Imported from Givebutter campaign: ${campaign.campaign_code || campaign.title}`,
          campaign_type: mappedType,
          goal_amount: campaign.goal_amount,
          current_amount: campaign.raised_amount || 0,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          status: campaign.status === "active" ? "active" : "draft",
          page_slug: campaign.campaign_code?.toLowerCase().replace(/\s+/g, "-") || 
                     campaign.title.toLowerCase().replace(/\s+/g, "-"),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (newCampaign) => {
      // Auto-map the Givebutter campaign to the newly created internal campaign
      if (selectedCampaign) {
        updateMapping({
          campaignId: selectedCampaign.id,
          internalCampaignId: newCampaign.id,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["donation-campaigns"] });
      toast.success(`Campaign "${newCampaign.name}" created and mapped`);
      setCreateDialogOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error) => {
      toast.error("Failed to create campaign");
      console.error(error);
    },
  });

  const handleMappingChange = (campaignId: string, internalCampaignId: string) => {
    updateMapping({
      campaignId,
      internalCampaignId: internalCampaignId === "none" ? null : internalCampaignId,
    });
  };

  const handleCreateFromGivebutter = (campaign: GivebutterCampaign) => {
    setSelectedCampaign(campaign);
    setCreateDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Mapping</CardTitle>
          <CardDescription>
            No campaigns found. Run a sync to import campaigns from Givebutter.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Campaign Mapping
          </CardTitle>
          <CardDescription>
            Map Givebutter campaigns to your internal campaigns for unified reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Givebutter Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Map To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const progressPercent = campaign.goal_amount 
                  ? Math.min(100, ((campaign.raised_amount || 0) / campaign.goal_amount) * 100)
                  : 0;
                
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.campaign_code && (
                            <span className="font-mono">{campaign.campaign_code}</span>
                          )}
                          {campaign.campaign_type && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {campaign.campaign_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>${(campaign.raised_amount || 0).toLocaleString()}</span>
                          {campaign.goal_amount && (
                            <span className="text-muted-foreground">
                              / ${campaign.goal_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {campaign.goal_amount && (
                          <Progress value={progressPercent} className="h-2" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {campaign.start_date && (
                          <div>Start: {format(new Date(campaign.start_date), "MMM d, yyyy")}</div>
                        )}
                        {campaign.end_date && (
                          <div className="text-muted-foreground">
                            End: {format(new Date(campaign.end_date), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={campaign.internal_campaign_id || "none"}
                          onValueChange={(value) => handleMappingChange(campaign.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Not mapped</span>
                            </SelectItem>
                            {internalCampaigns?.map((internal) => (
                              <SelectItem key={internal.id} value={internal.id}>
                                {internal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCreateFromGivebutter(campaign)}
                          title="Create new campaign from this Givebutter campaign"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Internal Campaign</DialogTitle>
            <DialogDescription>
              Create a new internal campaign from "{selectedCampaign?.title}" and automatically map it.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{selectedCampaign.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{selectedCampaign.campaign_type || "General"}</p>
                </div>
                {selectedCampaign.goal_amount && (
                  <div>
                    <span className="text-muted-foreground">Goal:</span>
                    <p className="font-medium">${selectedCampaign.goal_amount.toLocaleString()}</p>
                  </div>
                )}
                {selectedCampaign.raised_amount && (
                  <div>
                    <span className="text-muted-foreground">Raised:</span>
                    <p className="font-medium">${selectedCampaign.raised_amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedCampaign && createCampaign.mutate(selectedCampaign)}
              disabled={createCampaign.isPending}
            >
              {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
