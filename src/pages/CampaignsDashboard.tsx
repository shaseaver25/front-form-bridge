import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Loader2,
  Mail,
  Send,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

interface Campaign {
  id: string;
  name: string;
  subject_line: string;
  status: CampaignStatus;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  draft: {
    label: "Draft",
    icon: <Mail className="h-3 w-3" />,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  scheduled: {
    label: "Scheduled",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  sending: {
    label: "Sending",
    icon: <Send className="h-3 w-3 animate-pulse" />,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  sent: {
    label: "Sent",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

function pct(numerator: number, denominator: number): string {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export default function CampaignsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns-dashboard", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns-dashboard"] });
      toast.success("Campaign deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = (campaigns ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject_line.toLowerCase().includes(search.toLowerCase())
  );

  const sent = campaigns?.filter((c) => c.status === "sent") ?? [];
  const totalDelivered = sent.reduce((s, c) => s + (c.total_delivered || c.total_sent || 0), 0);
  const totalOpened = sent.reduce((s, c) => s + c.total_opened, 0);
  const totalClicked = sent.reduce((s, c) => s + c.total_clicked, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground">Send and track email campaigns to your contacts</p>
          </div>
          <Button onClick={() => navigate("/campaigns/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Send className="h-3.5 w-3.5" /> Delivered
              </p>
              <p className="text-2xl font-bold">{totalDelivered.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> Avg Open Rate
              </p>
              <p className="text-2xl font-bold">{pct(totalOpened, totalDelivered)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MousePointerClick className="h-3.5 w-3.5" /> Avg Click Rate
              </p>
              <p className="text-2xl font-bold">{pct(totalClicked, totalDelivered)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="sending">Sending</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {search
                    ? "Try a different search term"
                    : "Create your first campaign to get started"}
                </p>
                {!search && (
                  <Button onClick={() => navigate("/campaigns/new")}>
                    <Plus className="h-4 w-4 mr-2" />
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
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Open Rate</TableHead>
                    <TableHead className="text-right">Click Rate</TableHead>
                    <TableHead className="text-right">Bounce Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((campaign) => {
                    const status = statusConfig[campaign.status] ?? statusConfig.draft;
                    const delivered = campaign.total_delivered || campaign.total_sent || 0;
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[280px]">
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
                          {delivered > 0 ? delivered.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {pct(campaign.total_opened, delivered)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pct(campaign.total_clicked, delivered)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pct(campaign.total_bounced, campaign.total_sent || delivered)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {campaign.sent_at
                            ? format(new Date(campaign.sent_at), "MMM d, yyyy")
                            : campaign.scheduled_at
                              ? format(new Date(campaign.scheduled_at), "MMM d, yyyy")
                              : formatDistanceToNow(new Date(campaign.created_at), {
                                  addSuffix: true,
                                })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(campaign.id)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
