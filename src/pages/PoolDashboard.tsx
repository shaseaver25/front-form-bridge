import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Users,
  Mic,
  GraduationCap,
  Search,
  Star,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePoolApplications, PoolType, ApplicationStatus, PoolApplication } from "@/hooks/usePoolApplications";
import { usePoolEngagements } from "@/hooks/usePoolEngagements";
import { PoolApplicationDetailDialog } from "@/components/talent-pool/PoolApplicationDetailDialog";
import { AddPoolApplicationDialog } from "@/components/talent-pool/AddPoolApplicationDialog";
import { format } from "date-fns";

const statusColors: Record<ApplicationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  declined: "Declined",
  inactive: "Inactive",
};

const SPEAKER_TOPICS = [
  "Introduction to AI/ML",
  "ChatGPT & Large Language Models",
  "AI Ethics & Responsible Use",
  "AI in Education",
  "AI for Business/Nonprofits",
  "Prompt Engineering",
  "AI Art & Creative Tools",
  "AI Career Pathways",
  "AI Safety & Security",
  "Hands-on AI Workshops",
  "AI Policy & Regulation",
  "Future of Work with AI",
];

const TEACHER_SUBJECTS = [
  "Computer Science Fundamentals",
  "Programming/Coding",
  "Robotics",
  "AI/Machine Learning Basics",
  "Digital Literacy",
  "STEM Integration",
  "Math for Technology",
  "Design Thinking",
  "Maker/Fabrication Skills",
  "Career Exploration",
];

const GRADE_LEVELS = [
  { id: "elementary", label: "Elementary (K-5)" },
  { id: "middle", label: "Middle School" },
  { id: "high", label: "High School" },
  { id: "adult", label: "Adult" },
];

const ITEMS_PER_PAGE = 20;

export default function PoolDashboard() {
  const [activeTab, setActiveTab] = useState<PoolType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeLevelFilter, setGradeLevelFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<PoolApplication | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultPoolType, setDefaultPoolType] = useState<PoolType>("speaker");
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: allApplications, isLoading } = usePoolApplications();
  const { data: engagements } = usePoolEngagements();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!allApplications) return null;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const pending = allApplications.filter((a) => a.application_status === "pending").length;
    const pendingThisWeek = allApplications.filter(
      (a) => a.application_status === "pending" && new Date(a.created_at) > weekAgo
    ).length;
    const active = allApplications.filter((a) => a.application_status === "approved").length;
    const speakers = allApplications.filter((a) => a.pool_type === "speaker").length;
    const teachers = allApplications.filter((a) => a.pool_type === "teacher").length;

    const ytdEngagements = engagements?.filter(
      (e) => new Date(e.event_date) >= yearStart
    ).length || 0;

    const upcomingEngagements = engagements?.filter(
      (e) => new Date(e.event_date) >= now && e.status !== "cancelled"
    ).length || 0;

    const ratingsSum = allApplications.reduce((sum, a) => sum + (a.overall_rating || 0), 0);
    const ratedCount = allApplications.filter((a) => a.overall_rating).length;
    const avgRating = ratedCount > 0 ? ratingsSum / ratedCount : 0;

    return {
      pending,
      pendingThisWeek,
      active,
      speakers,
      teachers,
      total: allApplications.length,
      ytdEngagements,
      upcomingEngagements,
      avgRating,
    };
  }, [allApplications, engagements]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (!allApplications) return [];

    return allApplications.filter((app) => {
      // Tab filter
      if (activeTab !== "all" && app.pool_type !== activeTab) return false;

      // Status filter
      if (statusFilter !== "all" && app.application_status !== statusFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          app.first_name.toLowerCase().includes(query) ||
          app.last_name.toLowerCase().includes(query) ||
          app.email.toLowerCase().includes(query) ||
          app.current_employer?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Topic filter (speakers)
      if (topicFilter !== "all" && app.pool_type === "speaker") {
        if (!app.speaker_topics?.includes(topicFilter)) return false;
      }

      // Subject filter (teachers)
      if (subjectFilter !== "all" && app.pool_type === "teacher") {
        if (!app.subjects_qualified?.includes(subjectFilter)) return false;
      }

      // Grade level filter (teachers)
      if (gradeLevelFilter !== "all" && app.pool_type === "teacher") {
        if (!app.grade_levels_comfortable?.includes(gradeLevelFilter)) return false;
      }

      // Rating filter
      if (ratingFilter !== "all") {
        const minRating = parseFloat(ratingFilter);
        if (!app.overall_rating || app.overall_rating < minRating) return false;
      }

      return true;
    });
  }, [
    allApplications,
    activeTab,
    statusFilter,
    searchQuery,
    topicFilter,
    subjectFilter,
    gradeLevelFilter,
    ratingFilter,
  ]);

  // Sort applications
  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortColumn) {
        case "name":
          aVal = `${a.first_name} ${a.last_name}`;
          bVal = `${b.first_name} ${b.last_name}`;
          break;
        case "rating":
          aVal = a.overall_rating || 0;
          bVal = b.overall_rating || 0;
          break;
        case "engagements":
          aVal = a.total_engagements;
          bVal = b.total_engagements;
          break;
        case "created_at":
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredApplications, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = sortedApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTopicFilter("all");
    setSubjectFilter("all");
    setGradeLevelFilter("all");
    setRatingFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    topicFilter !== "all" ||
    subjectFilter !== "all" ||
    gradeLevelFilter !== "all" ||
    ratingFilter !== "all";

  const handleAddApplication = (poolType: PoolType) => {
    setDefaultPoolType(poolType);
    setIsAddDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Type", "Status", "Rating", "Engagements", "Applied"];
    const rows = sortedApplications.map((app) => [
      `${app.first_name} ${app.last_name}`,
      app.email,
      app.pool_type,
      app.application_status,
      app.overall_rating?.toFixed(1) || "",
      app.total_engagements.toString(),
      format(new Date(app.created_at), "yyyy-MM-dd"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pool-members-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Speaker & Teacher Pool</h1>
            <p className="text-muted-foreground">
              Manage your educator network for AI Whisperers and createMPLS programs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/apply" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Application Form
              </Link>
            </Button>
            <Button onClick={() => handleAddApplication("speaker")}>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as PoolType | "all"); setCurrentPage(1); }}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All ({stats?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="speaker" className="gap-2">
              <Mic className="h-4 w-4" />
              Speakers ({stats?.speakers || 0})
            </TabsTrigger>
            <TabsTrigger value="teacher" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Teachers ({stats?.teachers || 0})
            </TabsTrigger>
          </TabsList>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                {stats?.pendingThisWeek ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{stats.pendingThisWeek}</span> this week
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No new this week</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.active || 0}</div>
                <p className="text-xs text-muted-foreground">Approved & ready</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">YTD Engagements</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.ytdEngagements || 0}</div>
                <p className="text-xs text-muted-foreground">Events completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.upcomingEngagements || 0}</div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.avgRating ? stats.avgRating.toFixed(1) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ApplicationStatus | "all"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {(activeTab === "all" || activeTab === "speaker") && (
                  <Select value={topicFilter} onValueChange={(v) => { setTopicFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {SPEAKER_TOPICS.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(activeTab === "all" || activeTab === "teacher") && (
                  <>
                    <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {TEACHER_SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={gradeLevelFilter} onValueChange={(v) => { setGradeLevelFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Grade Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {GRADE_LEVELS.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}

                <Button variant="outline" onClick={exportToCSV} className="ml-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <TabsContent value={activeTab} className="mt-0">
            <Card className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      Name {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort("rating")}
                    >
                      Rating {sortColumn === "rating" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort("engagements")}
                    >
                      Engagements {sortColumn === "engagements" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No applications found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedApplications.map((application) => (
                      <TableRow
                        key={application.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              {application.pool_type === "speaker" ? (
                                <Mic className="h-4 w-4 text-primary" />
                              ) : (
                                <GraduationCap className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {application.first_name} {application.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{application.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {application.pool_type === "speaker" ? "🎤 Speaker" : "📚 Teacher"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[application.application_status]}>
                            {statusLabels[application.application_status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {application.pool_type === "speaker"
                              ? application.speaker_topics?.slice(0, 2).map((topic) => (
                                  <Badge key={topic} variant="secondary" className="text-xs">
                                    {topic.length > 15 ? topic.slice(0, 15) + "..." : topic}
                                  </Badge>
                                ))
                              : application.subjects_qualified?.slice(0, 2).map((subject) => (
                                  <Badge key={subject} variant="secondary" className="text-xs">
                                    {subject.length > 15 ? subject.slice(0, 15) + "..." : subject}
                                  </Badge>
                                ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {application.overall_rating ? (
                            <span className="flex items-center justify-end gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              {application.overall_rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{application.total_engagements}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApplication(application);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, sortedApplications.length)} of{" "}
                    {sortedApplications.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Detail Dialog */}
      <PoolApplicationDetailDialog
        application={selectedApplication}
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      />

      {/* Add Application Dialog */}
      <AddPoolApplicationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultPoolType={defaultPoolType}
      />
    </Layout>
  );
}
