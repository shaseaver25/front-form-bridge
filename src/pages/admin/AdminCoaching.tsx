import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Loader2 } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface CoachingClient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  chapters_completed: number;
  last_active: string | null;
  status: "Active" | "Stalled" | "Inactive";
}

function clientStatus(lastActive: string | null): "Active" | "Stalled" | "Inactive" {
  if (!lastActive) return "Inactive";
  const days = differenceInDays(new Date(), new Date(lastActive));
  if (days <= 7) return "Active";
  if (days <= 14) return "Stalled";
  return "Inactive";
}

const statusVariant = (s: string) =>
  s === "Active" ? "default" : s === "Stalled" ? "secondary" : "outline";

export default function AdminCoaching() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<CoachingClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (!clientRoles?.length) {
        setClients([]);
        return;
      }

      const clientIds = clientRoles.map((r) => r.user_id);

      const [profilesRes, progressRes, harvestsRes] = await Promise.all([
        supabase.from("user_profiles").select("id, first_name, last_name, email").in("id", clientIds),
        supabase.from("rebrand_progress").select("user_id, chapter_id, status, completed_at").in("user_id", clientIds),
        supabase.from("rebrand_harvests").select("user_id, created_at").in("user_id", clientIds).order("created_at", { ascending: false }),
      ]);

      const profiles = profilesRes.data || [];
      const progress = progressRes.data || [];
      const harvests = harvestsRes.data || [];

      const clientList: CoachingClient[] = profiles.map((p) => {
        const userProgress = progress.filter((pr) => pr.user_id === p.id && pr.status === "complete");
        const latestHarvest = harvests.find((h) => h.user_id === p.id);
        const latestProgressDate = userProgress.reduce(
          (latest: string | null, pr) =>
            pr.completed_at && (!latest || pr.completed_at > latest) ? pr.completed_at : latest,
          null
        );
        const lastActive = [latestProgressDate, latestHarvest?.created_at].filter(Boolean).sort().pop() || null;

        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          chapters_completed: userProgress.length,
          last_active: lastActive,
          status: clientStatus(lastActive),
        };
      });

      setClients(clientList.sort((a, b) => {
        const order = { Active: 0, Stalled: 1, Inactive: 2 };
        return order[a.status] - order[b.status];
      }));
    } catch (e) {
      console.error("Failed to load coaching clients:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7" /> Coaching Clients
          </h1>
          <p className="text-muted-foreground">
            Monitor Re:Brand progress and prepare for coaching sessions
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No coaching clients found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/admin/coaching/${c.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {(c.first_name?.[0] || "").toUpperCase()}
                        {(c.last_name?.[0] || "").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {c.chapters_completed} of 7 chapters
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.last_active
                        ? formatDistanceToNow(new Date(c.last_active), { addSuffix: true })
                        : "No activity"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.chapters_completed / 7) * 100}%`,
                        backgroundColor: "#C8A96E",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
