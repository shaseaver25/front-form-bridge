import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParsedRecord {
  firstName: string;
  lastName: string;
  salutation?: string;
  email: string;
  phone: string;
  employer: string;
  status: "valid" | "duplicate" | "error";
  errorMessage?: string;
}

interface BulkImportConstituentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SALUTATIONS = ["Dr.", "Mr.", "Mrs.", "Ms.", "Rev.", "Hon."];

function parseName(fullName: string): { firstName: string; lastName: string; salutation?: string } {
  let name = fullName.trim();
  let salutation: string | undefined;

  // Check for salutation prefix
  for (const sal of SALUTATIONS) {
    if (name.startsWith(sal + " ") || name.startsWith(sal.replace(".", "") + " ")) {
      salutation = sal;
      name = name.slice(sal.length).trim();
      break;
    }
  }

  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "", salutation };
  }
  
  // First part is first name, rest is last name (handles multi-part last names)
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  
  return { firstName, lastName, salutation };
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, "");
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function BulkImportConstituents({ open, onOpenChange, onSuccess }: BulkImportConstituentsProps) {
  const [rawData, setRawData] = useState("");
  const [format, setFormat] = useState<"tab" | "csv">("tab");
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [isParsed, setIsParsed] = useState(false);

  const parseData = async () => {
    if (!rawData.trim()) {
      toast.error("Please paste your data first");
      return;
    }

    // Fetch ALL existing emails for duplicate detection (paginate to overcome 1000 row limit)
    const emailSet = new Set<string>();
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: existingConstituents } = await supabase
        .from("constituents")
        .select("primary_email")
        .not("primary_email", "is", null)
        .range(from, from + pageSize - 1);

      if (existingConstituents && existingConstituents.length > 0) {
        existingConstituents.forEach((c) => {
          if (c.primary_email) {
            emailSet.add(c.primary_email.toLowerCase());
          }
        });
        from += pageSize;
        hasMore = existingConstituents.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    setExistingEmails(emailSet);

    const delimiter = format === "csv" ? "," : "\t";
    const lines = rawData.trim().split("\n");
    
    // First pass: count email occurrences within the import data
    const importEmailCounts = new Map<string, number>();
    const parsedRows: Array<{
      firstName: string;
      lastName: string;
      salutation?: string;
      email: string;
      phone: string;
      employer: string;
      hasError: boolean;
      errorMessage?: string;
    }> = [];

    for (const line of lines) {
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      const [name = "", district = "", email = "", phone = ""] = parts;
      
      if (!name) {
        parsedRows.push({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          employer: "",
          hasError: true,
          errorMessage: "Missing name",
        });
        continue;
      }

      const { firstName, lastName, salutation } = parseName(name);
      const normalizedEmail = email.toLowerCase().trim();
      
      let hasError = false;
      let errorMessage: string | undefined;

      if (!normalizedEmail) {
        hasError = true;
        errorMessage = "Missing email";
      } else if (!validateEmail(normalizedEmail)) {
        hasError = true;
        errorMessage = "Invalid email format";
      } else {
        // Track email occurrences for intra-batch duplicate detection
        importEmailCounts.set(normalizedEmail, (importEmailCounts.get(normalizedEmail) || 0) + 1);
      }

      parsedRows.push({
        firstName,
        lastName,
        salutation,
        email: normalizedEmail,
        phone: normalizePhone(phone),
        employer: district,
        hasError,
        errorMessage,
      });
    }

    // Second pass: determine final status with intra-batch duplicate detection
    const seenEmails = new Set<string>();
    const records: ParsedRecord[] = parsedRows.map((row) => {
      if (row.hasError) {
        return {
          firstName: row.firstName,
          lastName: row.lastName,
          salutation: row.salutation,
          email: row.email,
          phone: row.phone,
          employer: row.employer,
          status: "error" as const,
          errorMessage: row.errorMessage,
        };
      }

      let status: "valid" | "duplicate" | "error" = "valid";
      let errorMessage: string | undefined;

      if (emailSet.has(row.email)) {
        status = "duplicate";
        errorMessage = "Email already exists in database";
      } else if (seenEmails.has(row.email)) {
        status = "duplicate";
        errorMessage = "Duplicate within import";
      } else {
        seenEmails.add(row.email);
      }

      return {
        firstName: row.firstName,
        lastName: row.lastName,
        salutation: row.salutation,
        email: row.email,
        phone: row.phone,
        employer: row.employer,
        status,
        errorMessage,
      };
    });

    setParsedRecords(records);
    setIsParsed(true);
  };

  const handleImport = async () => {
    const validRecords = parsedRecords.filter((r) => r.status === "valid");
    
    if (validRecords.length === 0) {
      toast.error("No valid records to import");
      return;
    }

    setImporting(true);

    try {
      const constituentData = validRecords.map((r) => ({
        first_name: r.firstName,
        last_name: r.lastName,
        full_legal_name: `${r.firstName} ${r.lastName}`.trim(),
        salutation: r.salutation || null,
        primary_email: r.email,
        phone: r.phone || null,
        employer: r.employer || null,
        title: "Superintendent",
        mailing_state: "MN",
      }));

      // Batch insert in chunks of 100 to avoid payload size limits
      const chunkSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < constituentData.length; i += chunkSize) {
        const chunk = constituentData.slice(i, i + chunkSize);
        const { error } = await supabase.from("constituents").insert(chunk);
        
        if (error) {
          throw error;
        }
        insertedCount += chunk.length;
      }

      toast.success(`Successfully imported ${insertedCount} constituents`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import constituents");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRawData("");
    setParsedRecords([]);
    setIsParsed(false);
    onOpenChange(false);
  };

  const validCount = parsedRecords.filter((r) => r.status === "valid").length;
  const duplicateCount = parsedRecords.filter((r) => r.status === "duplicate").length;
  const errorCount = parsedRecords.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Constituents</DialogTitle>
          <DialogDescription>
            Paste data from Excel (tab-separated) or CSV format. Expected columns: Name, District, Email, Phone
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {!isParsed ? (
            <>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="format">Data Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as "tab" | "csv")}>
                    <SelectTrigger id="format" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tab">Tab-separated (Excel)</SelectItem>
                      <SelectItem value="csv">Comma-separated (CSV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="data">Paste your data below</Label>
                <Textarea
                  id="data"
                  placeholder={`Name${format === "csv" ? "," : "\t"}District${format === "csv" ? "," : "\t"}Email${format === "csv" ? "," : "\t"}Phone\nDr. John Smith${format === "csv" ? "," : "\t"}ABC School District${format === "csv" ? "," : "\t"}john@school.org${format === "csv" ? "," : "\t"}(555) 123-4567`}
                  className="min-h-[200px] font-mono text-sm"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{validCount} valid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-secondary" />
                  <span>{duplicateCount} duplicates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span>{errorCount} errors</span>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Issue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRecords.map((record, idx) => (
                      <TableRow key={idx} className={record.status !== "valid" ? "opacity-60" : ""}>
                        <TableCell>
                          {record.status === "valid" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          {record.status === "duplicate" && <AlertTriangle className="w-4 h-4 text-secondary" />}
                          {record.status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                        </TableCell>
                        <TableCell>
                          {record.salutation && <span className="text-muted-foreground">{record.salutation} </span>}
                          {record.firstName} {record.lastName}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{record.email}</TableCell>
                        <TableCell className="font-mono text-xs">{record.phone}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.employer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{record.errorMessage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isParsed && (
            <Button variant="outline" onClick={() => setIsParsed(false)}>
              Back to Edit
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!isParsed ? (
            <Button onClick={parseData}>
              Preview Import
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {validCount} Records
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
