import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  ArrowLeft,
  Search,
  Target,
  Users,
  Calendar,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { useDonationCampaigns, useCreateCampaign } from "@/hooks/useDonations";
import { format } from "date-fns";

export default function DonationCampaigns() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "annual_fund",
    goal_amount: "",
    start_date: "",
    end_date: "",
    page_slug: "",
    show_progress_bar: true,
    show_donor_wall: false,
    allow_anonymous: true,
  });

  const { data: campaigns, isLoading } = useDonationCampaigns();
  const createCampaign = useCreateCampaign();

  const filteredCampaigns = campaigns?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    await createCampaign.mutateAsync({
      name: formData.name,
      description: formData.description || null,
      campaign_type: formData.campaign_type,
      goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      page_slug: formData.page_slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
      show_progress_bar: formData.show_progress_bar,
      show_donor_wall: formData.show_donor_wall,
      allow_anonymous: formData.allow_anonymous,
      status: "active",
    });
    setIsCreateOpen(false);
    setFormData({
      name: "",
      description: "",
      campaign_type: "annual_fund",
      goal_amount: "",
      start_date: "",
      end_date: "",
      page_slug: "",
      show_progress_bar: true,
      show_donor_wall: false,
      allow_anonymous: true,
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCampaignTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      general: "General",
      annual_fund: "Annual Fund",
      capital: "Capital Campaign",
      emergency: "Emergency",
      event: "Event",
      peer_to_peer: "Peer-to-Peer",
    };
    return labels[type || "general"] || type;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/integrations")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Integrations
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Donation Campaigns</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage fundraising campaigns
              </p>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new fundraising campaign
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Year-End Giving Campaign 2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Help us reach our goal..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Campaign Type</Label>
                    <Select
                      value={formData.campaign_type}
                      onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="annual_fund">Annual Fund</SelectItem>
                        <SelectItem value="capital">Capital Campaign</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="peer_to_peer">Peer-to-Peer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal">Goal Amount</Label>
                      <Input
                        id="goal"
                        type="number"
                        value={formData.goal_amount}
                        onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start">Start Date</Label>
                      <Input
                        id="start"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">End Date</Label>
                      <Input
                        id="end"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Page URL Slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">/donate/</span>
                      <Input
                        id="slug"
                        value={formData.page_slug}
                        onChange={(e) => setFormData({ ...formData, page_slug: e.target.value })}
                        placeholder="year-end-2025"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="progress"
                        checked={formData.show_progress_bar}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, show_progress_bar: checked as boolean })
                        }
                      />
                      <Label htmlFor="progress" className="font-normal">
                        Show progress bar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wall"
                        checked={formData.show_donor_wall}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, show_donor_wall: checked as boolean })
                        }
                      />
                      <Label htmlFor="wall" className="font-normal">
                        Show donor wall (with permission)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymous"
                        checked={formData.allow_anonymous}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, allow_anonymous: checked as boolean })
                        }
                      />
                      <Label htmlFor="anonymous" className="font-normal">
                        Allow anonymous donations
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.name || createCampaign.isPending}>
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-2 w-full mb-4" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const progress = campaign.goal_amount
                ? ((campaign.current_amount || 0) / campaign.goal_amount) * 100
                : 0;

              return (
                <Card key={campaign.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getCampaignTypeLabel(campaign.campaign_type)}
                          </Badge>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.goal_amount && (
                      <div className="space-y-2">
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            ${(campaign.current_amount || 0).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            of ${campaign.goal_amount.toLocaleString()} ({Math.round(progress)}%)
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{campaign.donor_count || 0} donors</span>
                      </div>
                      {campaign.end_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Ends {format(new Date(campaign.end_date), "MMM d")}</span>
                        </div>
                      )}
                    </div>

                    {campaign.page_slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => navigate(`/donate/${campaign.page_slug}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Donation Page
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Target className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No campaigns yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first fundraising campaign to get started
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
