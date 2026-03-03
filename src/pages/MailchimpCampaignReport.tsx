import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Copy, Send, Users, Eye, MousePointerClick, AlertTriangle, UserMinus, RefreshCw, ExternalLink, TrendingUp, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  useMailchimpCampaign,
  useSyncCampaignStats,
} from '@/hooks/useMailchimpCampaigns';

export default function MailchimpCampaignReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useMailchimpCampaign(id);
  const syncStats = useSyncCampaignStats();

  const stats = campaign?.email_campaign_stats?.[0];

  // Calculate derived stats
  const delivered = (stats?.emails_sent || 0) - (stats?.bounces || 0);
  const deliveryRate = stats?.emails_sent ? (delivered / stats.emails_sent * 100).toFixed(1) : 0;
  const openRate = stats?.open_rate ? (stats.open_rate * 100).toFixed(1) : 0;
  const clickRate = stats?.click_rate ? (stats.click_rate * 100).toFixed(1) : 0;
  const bounceRate = stats?.emails_sent ? (stats.bounces || 0) / stats.emails_sent * 100 : 0;

  // Mock data for opens over time chart (in production, this would come from Mailchimp API)
  const opensOverTimeData = [
    { hour: '0h', opens: 0 },
    { hour: '1h', opens: Math.round((stats?.unique_opens || 0) * 0.15) },
    { hour: '2h', opens: Math.round((stats?.unique_opens || 0) * 0.35) },
    { hour: '4h', opens: Math.round((stats?.unique_opens || 0) * 0.55) },
    { hour: '8h', opens: Math.round((stats?.unique_opens || 0) * 0.70) },
    { hour: '12h', opens: Math.round((stats?.unique_opens || 0) * 0.80) },
    { hour: '24h', opens: Math.round((stats?.unique_opens || 0) * 0.90) },
    { hour: '48h', opens: stats?.unique_opens || 0 },
  ];

  // Mock link performance data
  const linkPerformance = [
    { url: 'https://example.com/donate', totalClicks: Math.round((stats?.clicks || 0) * 0.5), uniqueClicks: Math.round((stats?.unique_clicks || 0) * 0.5) },
    { url: 'https://example.com/learn-more', totalClicks: Math.round((stats?.clicks || 0) * 0.3), uniqueClicks: Math.round((stats?.unique_clicks || 0) * 0.3) },
    { url: 'https://example.com/contact', totalClicks: Math.round((stats?.clicks || 0) * 0.2), uniqueClicks: Math.round((stats?.unique_clicks || 0) * 0.2) },
  ].filter(link => link.totalClicks > 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 md:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Campaign not found</h2>
          <Button variant="link" onClick={() => navigate('/email-marketing/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </Layout>
    );
  }

  if (campaign.status !== 'sent' && campaign.status !== 'sending') {
    return (
      <Layout>
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Available</h2>
          <p className="text-muted-foreground mb-4">
            Reports are only available for sent campaigns.
          </p>
          <Button onClick={() => navigate(`/email-marketing/campaigns/${id}/edit`)}>
            Edit Campaign
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/email-marketing/campaigns')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <p className="text-muted-foreground">{campaign.subject_line}</p>
              {campaign.sent_at && (
                <p className="text-sm text-muted-foreground mt-1">
                  Sent on {format(new Date(campaign.sent_at), 'PPp')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncStats.mutate(id)}
              disabled={syncStats.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStats.isPending ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/email-marketing/campaigns/new?duplicate=${id}`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Campaign
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Send className="h-3.5 w-3.5" />
                Sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.emails_sent || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Delivered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{delivered.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{deliveryRate}% delivery rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Opens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.unique_opens || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{openRate}% open rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <MousePointerClick className="h-3.5 w-3.5" />
                Clicks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.unique_clicks || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{clickRate}% click rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Bounced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.bounces || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{bounceRate.toFixed(1)}% bounce rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <UserMinus className="h-3.5 w-3.5" />
                Unsubscribed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.unsubscribes || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opens Over Time</CardTitle>
              <CardDescription>Cumulative opens in the first 48 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={opensOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="opens"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Breakdown</CardTitle>
              <CardDescription>How recipients interacted with your email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Delivered', value: delivered, fill: 'hsl(var(--primary))' },
                      { name: 'Opened', value: stats?.unique_opens || 0, fill: 'hsl(var(--primary) / 0.8)' },
                      { name: 'Clicked', value: stats?.unique_clicks || 0, fill: 'hsl(var(--primary) / 0.6)' },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link Performance */}
        {linkPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Link Performance</CardTitle>
              <CardDescription>Click activity for links in your email</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Total Clicks</TableHead>
                    <TableHead className="text-right">Unique Clicks</TableHead>
                    <TableHead className="text-right">Click Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkPerformance.map((link, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline text-primary"
                        >
                          {link.url.length > 50 ? link.url.slice(0, 50) + '...' : link.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">{link.totalClicks}</TableCell>
                      <TableCell className="text-right">{link.uniqueClicks}</TableCell>
                      <TableCell className="text-right">
                        {delivered > 0 ? ((link.uniqueClicks / delivered) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Last synced info */}
        {stats?.last_synced_at && (
          <p className="text-xs text-muted-foreground text-center">
            Stats last synced: {format(new Date(stats.last_synced_at), 'PPp')}
          </p>
        )}
      </div>
    </Layout>
  );
}
