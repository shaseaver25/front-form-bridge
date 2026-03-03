import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileSpreadsheet } from "lucide-react";

interface BulkImportSitesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sampleData = `Eden Prairie Schools,district,public_school,Eden Prairie,high,network,"Connection through board member"
Edina Public Schools,district,public_school,Edina,high,network,"Know Nathan Swenson"
Shakopee Public Schools,district,public_school,Shakopee,medium,network,""
District 287,district,intermediate_district,Plymouth,high,network,"Serves 12 member districts"`;

export function BulkImportSites({ open, onOpenChange }: BulkImportSitesProps) {
  const [csvData, setCsvData] = useState("");
  const queryClient = useQueryClient();

  const importSites = useMutation({
    mutationFn: async (data: string) => {
      const lines = data.trim().split("\n");
      const sites = lines.map((line) => {
        // Handle quoted CSV values properly
        const parts: string[] = [];
        let current = "";
        let inQuotes = false;
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        const [name, site_type, organization_type, address_city, budget_tier, connection_source, connection_notes] = parts;

        return {
          name: name || "Unnamed Site",
          site_type: site_type || "school",
          organization_type: organization_type || null,
          address_city: address_city || null,
          address_state: "MN",
          budget_tier: budget_tier || "unknown",
          connection_source: connection_source || null,
          connection_notes: connection_notes || null,
          relationship_status: "prospect",
        };
      });

      const { error } = await supabase.from("sites").insert(sites);
      if (error) throw error;
      return sites.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["site-stats"] });
      toast.success(`${count} sites imported successfully`);
      onOpenChange(false);
      setCsvData("");
    },
    onError: (error) => {
      toast.error("Import failed: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Sites
          </DialogTitle>
          <DialogDescription>
            Paste CSV data with columns: Name, Site Type, Organization Type, City, Budget Tier, Connection Source, Connection Notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CSV Data</Label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={sampleData}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium mb-1">Example Format:</div>
            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
              {sampleData}
            </pre>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Site Types:</strong> school, district, organization, partner</p>
            <p><strong>Organization Types:</strong> public_school, charter, private, intermediate_district, nonprofit, corporate</p>
            <p><strong>Budget Tiers:</strong> high, medium, low, unknown</p>
            <p><strong>Connection Sources:</strong> network, referral, cold_outreach, event, inbound, existing_relationship</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => importSites.mutate(csvData)}
              disabled={!csvData.trim() || importSites.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importSites.isPending ? "Importing..." : "Import Sites"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
