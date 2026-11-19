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

const sampleData = `Acme Robotics,prospect,prospect,acmerobotics.example,"Industrial automation, Series B"
Northwind Foods,client,active,northwind.example,""
Contoso Health,partner,active,,"Referral partner"`;

export function BulkImportSites({ open, onOpenChange }: BulkImportSitesProps) {
  const [csvData, setCsvData] = useState("");
  const queryClient = useQueryClient();

  const importSites = useMutation({
    mutationFn: async (data: string) => {
      const { data: user } = await supabase.auth.getUser();
      const lines = data.trim().split("\n").filter((line) => line.trim());
      const companies = lines.map((line, i) => {
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

        const [name, company_type, status, domain, description] = parts;
        if (!name) throw new Error(`Line ${i + 1}: name is required`);

        return {
          name,
          company_type: company_type || "client",
          status: status || "active",
          domain: domain || null,
          description: description || null,
          created_by: user.user?.id,
        };
      });

      const { error } = await supabase.from("crm_companies").insert(companies);
      if (error) throw error;
      return companies.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["company-stats"] });
      toast.success(`${count} companies imported successfully`);
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
            Bulk Import Companies
          </DialogTitle>
          <DialogDescription>
            Paste CSV data with columns: Name, Company Type, Status, Domain, Description
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
            <p><strong>Company Types:</strong> client, prospect, partner, vendor (default: client)</p>
            <p><strong>Statuses:</strong> active, inactive, prospect, client, archived (default: active)</p>
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
              {importSites.isPending ? "Importing..." : "Import Companies"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
