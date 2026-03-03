import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MoreHorizontal, Mail, Edit, Copy, Trash2, BarChart3, RefreshCw, AlertCircle, Send, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  useMailchimpCampaigns,
  useDeleteMailchimpCampaign,
  useSyncCampaignStats,
  useMailchimpConfig,
  type EmailCampaign,
} from '@/hooks/useMailchimpCampaigns';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'outline', icon: <FileText className="h-3 w-3" /> },
  scheduled: { label: 'Scheduled', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  sending: { label: 'Sending', variant: 'default', icon: <Send className="h-3 w-3 animate-pulse" /> },
  sent: { label: 'Sent', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export default function MailchimpCampaignList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<EmailCampaign | null>(null);

  const { data: config, isLoading: configLoading } = useMailchimpConfig();
  const { data: campaigns, isLoading: campaignsLoading } = useMailchimpCampaigns(activeTab === 'all' ? undefined : activeTab);
  const deleteCampaign = useDeleteMailchimpCampaign();
  const syncStats = useSyncCampaignStats();

  // Filter campaigns by search
  const filteredCampaigns = campaigns?.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject_line?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count by status
  const counts = {
    all: campaigns?.length || 0,
    draft: campaigns?.filter(c => c.status === 'draft').length || 0,
    scheduled: campaigns?.filter(c => c.status === 'scheduled').length || 0,
    sent: campaigns?.filter(c => c.status === 'sent' || c.status === 'sending').length || 0,
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    try {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      toast({
        title: "Campaign deleted",
        description: `"${campaignToDelete.name}" has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      toast({
        title: "Failed to delete campaign",
        description: error instanceof Error ? error.message : "An error occurred while deleting the campaign.",
        variant: "destructive",
      });
    }
  };

  const handleSyncStats = async () => {
    try {
      await syncStats.mutateAsync(undefined);
      toast({
        title: "Stats synced",
        description: "Campaign statistics have been updated from Mailchimp.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync campaign stats.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (campaign: EmailCampaign) => {
    // Navigate to new campaign with prefilled data
    toast({
      title: "Duplicating campaign",
      description: `Creating a copy of "${campaign.name}"...`,
    });
    navigate(`/email-marketing/campaigns/new?duplicate=${campaign.id}`);
  };

  const formatRate = (rate?: number) => {
    if (rate === undefined || rate === null) return '-';
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (configLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Mailchimp to Get Started</h2>
          <p className="text-muted-foreground mb-4">
            Connect your Mailchimp account to create and send email campaigns.
          </p>
          <Button onClick={() => navigate('/mailchimp-settings')}>
            Connect Mailchimp
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground">Create and manage your Mailchimp email campaigns</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncStats}
              disabled={syncStats.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStats.isPending ? 'animate-spin' : ''}`} />
              Sync Stats
            </Button>
            <Button onClick={() => navigate('/email-marketing/campaigns/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.all}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Drafts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.sent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaigns</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled ({counts.scheduled})</TabsTrigger>
                <TabsTrigger value="sent">Sent ({counts.sent})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {campaignsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Recipients</TableHead>
                        <TableHead className="text-right">Open Rate</TableHead>
                        <TableHead className="text-right">Click Rate</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => {
                        const status = statusConfig[campaign.status] || statusConfig.draft;
                        const stats = campaign.email_campaign_stats?.[0];
                        const audience = campaign.email_campaign_audiences?.[0];

                        return (
                          <TableRow key={campaign.id}>
                            <TableCell>
                              <button
                                onClick={() => navigate(`/email-marketing/campaigns/${campaign.id}/edit`)}
                                className="font-medium hover:underline text-left"
                              >
                                {campaign.name}
                              </button>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {campaign.subject_line}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {stats?.emails_sent || audience?.recipient_count || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatRate(stats?.open_rate)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatRate(stats?.click_rate)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {campaign.sent_at
                                ? format(new Date(campaign.sent_at), 'MMM d, yyyy')
                                : campaign.scheduled_at
                                  ? format(new Date(campaign.scheduled_at), 'MMM d, yyyy')
                                  : format(new Date(campaign.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/email-marketing/campaigns/${campaign.id}/edit`)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {campaign.status === 'sent' && (
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/email-marketing/campaigns/${campaign.id}/report`)}
                                    >
                                      <BarChart3 className="h-4 w-4 mr-2" />
                                      View Report
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCampaignToDelete(campaign);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-1">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first campaign to get started.
                    </p>
                    <Button onClick={() => navigate('/email-marketing/campaigns/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
