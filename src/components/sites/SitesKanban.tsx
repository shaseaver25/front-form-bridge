import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Globe, GripVertical } from "lucide-react";
import { toast } from "sonner";

const kanbanColumns = [
  { key: "prospect", label: "Prospects", color: "bg-gray-500" },
  { key: "active", label: "Active", color: "bg-green-500" },
  { key: "inactive", label: "Inactive", color: "bg-yellow-500" },
  { key: "former", label: "Former", color: "bg-red-500" },
];

interface SitesKanbanProps {
  sites: any[];
  isLoading: boolean;
  onAddSite: (status?: string) => void;
}

function KanbanCard({ site }: { site: any }) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all group"
      onClick={() => navigate(`/sites/${site.id}`)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("siteId", site.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-medium text-sm truncate">{site.name}</h4>
            
            {site.domain && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{site.domain}</span>
              </p>
            )}

            {site.company_type && (
              <Badge variant="outline" className="text-xs">
                {site.company_type.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SitesKanban({ sites, isLoading, onAddSite }: SitesKanbanProps) {
  const queryClient = useQueryClient();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const sitesByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    kanbanColumns.forEach((col) => {
      grouped[col.key] = [];
    });
    
    sites?.forEach((site) => {
      const status = site.status || "prospect";
      if (grouped[status]) {
        grouped[status].push(site);
      } else {
        grouped["prospect"].push(site);
      }
    });
    
    return grouped;
  }, [sites]);

  const updateStatus = useMutation({
    mutationFn: async ({ siteId, newStatus }: { siteId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("crm_companies")
        .update({ status: newStatus })
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const siteId = e.dataTransfer.getData("siteId");
    if (siteId) {
      updateStatus.mutate({ siteId, newStatus });
    }
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {kanbanColumns.map((col) => (
          <div key={col.key} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {kanbanColumns.map((column) => (
        <div key={column.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-medium text-sm">{column.label}</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {sitesByStatus[column.key]?.length || 0}
            </Badge>
          </div>
          
          <div 
            className={`space-y-2 min-h-[300px] rounded-lg p-2 transition-colors ${
              dragOverColumn === column.key 
                ? "bg-primary/10 border-2 border-dashed border-primary" 
                : "bg-muted/30"
            }`}
            onDrop={(e) => handleDrop(e, column.key)}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
          >
            {sitesByStatus[column.key]?.map((site: any) => (
              <KanbanCard key={site.id} site={site} />
            ))}
            
            <div 
              className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => onAddSite(column.key)}
            >
              + Add
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
