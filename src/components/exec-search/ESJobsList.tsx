import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ESJob = {
  id: string;
  name: string;
  job_title: string | null;
  status: string;
  location: string | null;
  company_name: string | null;
  company_id: string | null;
};

export function ESJobsList() {
  const navigate = useNavigate();
  const { isReady } = useAuthReady();
  const [jobs, setJobs] = useState<ESJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isReady) return;
    fetchJobs();
  }, [isReady]);

  const fetchJobs = async () => {
    setLoading(true);

    const { data: tagData } = await supabase
      .from("crm_tags")
      .select("id")
      .eq("name", "Executive Search")
      .single();

    if (!tagData) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const { data: taggedJobs } = await supabase
      .from("crm_job_tags" as any)
      .select("job_id")
      .eq("tag_id", tagData.id);

    const jobIds = (taggedJobs || []).map((t: any) => t.job_id);

    if (jobIds.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const { data: jobsData } = await supabase
      .from("crm_jobs")
      .select("id, name, job_title, status, location, company_id, crm_companies(name)")
      .in("id", jobIds)
      .order("name");

    const mapped: ESJob[] = (jobsData || []).map((j: any) => ({
      id: j.id,
      name: j.name,
      job_title: j.job_title,
      status: j.status,
      location: j.location,
      company_name: j.crm_companies?.name || null,
      company_id: j.company_id,
    }));

    setJobs(mapped);
    setLoading(false);
  };

  const filtered = jobs.filter((j) => {
    const term = searchTerm.toLowerCase();
    return (
      j.name.toLowerCase().includes(term) ||
      (j.job_title?.toLowerCase().includes(term) ?? false) ||
      (j.location?.toLowerCase().includes(term) ?? false) ||
      (j.company_name?.toLowerCase().includes(term) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search ES jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Executive Search jobs"
          description={
            jobs.length === 0
              ? 'Tag jobs with "Executive Search" to see them here.'
              : "No jobs match your search."
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.job_title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.company_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.location || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {job.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
