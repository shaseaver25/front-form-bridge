import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Loader2, 
  Mail, 
  Send, 
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Pause
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useEmailCampaigns, EmailCampaign } from '@/hooks/useEmailTemplates';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  draft: { 
    label: 'Draft', 
    icon: <Mail className="h-3 w-3" />, 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' 
  },
  scheduled: { 
    label: 'Scheduled', 
    icon: <Clock className="h-3 w-3" />, 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
  },
  sending: { 
    label: 'Sending', 
    icon: <Send className="h-3 w-3 animate-pulse" />, 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
  },
  sent: { 
    label: 'Sent', 
    icon: <CheckCircle2 className="h-3 w-3" />, 
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: <XCircle className="h-3 w-3" />, 
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
  },
};

export default function EmailCampaigns() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: campaigns, isLoading } = useEmailCampaigns(selectedStatus);

  const filteredCampaigns = campaigns?.filter(campaign => 
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject_line.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate stats
  const stats = {
    total: campaigns?.length || 0,
    sent: campaigns?.filter(c => c.status === 'sent').length || 0,
    scheduled: campaigns?.filter(c => c.status === 'scheduled').length || 0,
    drafts: campaigns?.filter(c => c.status === 'draft').length || 0,
  };

  const getOpenRate = (campaign: EmailCampaign) => {
    if (campaign.total_delivered === 0) return '—';
    return `${((campaign.total_opened / campaign.total_delivered) * 100).toFixed(1)}%`;
  };

  const getClickRate = (campaign: EmailCampaign) => {
    if (campaign.total_delivered === 0) return '—';
    return `${((campaign.total_clicked / campaign.total_delivered) * 100).toFixed(1)}%`;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground">
              Create and manage email campaigns for your constituents
            </p>
          </div>
          <Button onClick={() => navigate('/email-campaigns/new')}>
            <Plus className="h-4 w-4 mr-1" />
            New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold text-gray-600">{stats.drafts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="sending">Sending</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Campaigns Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'Get started by creating your first campaign'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/email-campaigns/new')}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Campaign
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
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
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {campaign.subject_line}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${status.className}`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.total_recipients.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {getOpenRate(campaign)}
                        </TableCell>
                        <TableCell className="text-right">
                          {getClickRate(campaign)}
                        </TableCell>
                        <TableCell>
                          {campaign.sent_at 
                            ? format(new Date(campaign.sent_at), 'MMM d, yyyy')
                            : campaign.scheduled_at
                              ? format(new Date(campaign.scheduled_at), 'MMM d, yyyy')
                              : formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })
                          }
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/email-campaigns/${campaign.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/email-campaigns/${campaign.id}/analytics`)}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
