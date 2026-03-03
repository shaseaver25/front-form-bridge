import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Loader2, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MatchedConstituent {
  id: string;
  full_legal_name: string;
  primary_email: string;
}

type CleanupAction = "clear_email" | "mark_dne" | "both";

interface BulkEmailCleanupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BulkEmailCleanup = ({ open, onOpenChange, onSuccess }: BulkEmailCleanupProps) => {
  const [rawInput, setRawInput] = useState("");
  const [matches, setMatches] = useState<MatchedConstituent[]>([]);
  const [unmatchedEmails, setUnmatchedEmails] = useState<string[]>([]);
  const [action, setAction] = useState<CleanupAction>("mark_dne");
  const [step, setStep] = useState<"input" | "review" | "done">("input");
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes("@"));
  };

  const handleSearch = async () => {
    const emails = parseEmails(rawInput);
    if (emails.length === 0) {
      toast.error("No valid email addresses found. Paste emails separated by newlines, commas, or semicolons.");
      return;
    }

    setSearching(true);

    // Fetch all constituents with emails in batches to avoid the 1000 row limit
    const allConstituents: MatchedConstituent[] = [];
    const batchSize = 500;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("constituents")
        .select("id, full_legal_name, primary_email")
        .in("primary_email", batch);

      if (error) {
        toast.error("Failed to search constituents");
        setSearching(false);
        return;
      }
      if (data) allConstituents.push(...(data as MatchedConstituent[]));
    }

    // Also try case-insensitive matching for emails not found
    const foundEmails = new Set(allConstituents.map((c) => c.primary_email?.toLowerCase()));
    const notFoundEmails = emails.filter((e) => !foundEmails.has(e));

    // For unmatched, try ilike queries in small batches
    for (const email of notFoundEmails.slice(0, 50)) {
      const { data } = await supabase
        .from("constituents")
        .select("id, full_legal_name, primary_email")
        .ilike("primary_email", email);
      if (data && data.length > 0) {
        for (const row of data) {
          if (!allConstituents.find((c) => c.id === row.id)) {
            allConstituents.push(row as MatchedConstituent);
          }
        }
      }
    }

    const matchedEmailsLower = new Set(allConstituents.map((c) => c.primary_email?.toLowerCase()));
    const unmatched = emails.filter((e) => !matchedEmailsLower.has(e));

    setMatches(allConstituents);
    setUnmatchedEmails(unmatched);
    setStep("review");
    setSearching(false);
  };

  const handleExecute = async () => {
    if (matches.length === 0) return;
    setProcessing(true);

    let successCount = 0;
    const batchSize = 50;

    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      const ids = batch.map((c) => c.id);

      const updateData: Record<string, unknown> = {};
      if (action === "clear_email" || action === "both") {
        updateData.primary_email = null;
      }
      if (action === "mark_dne" || action === "both") {
        updateData.do_not_email = true;
      }

      const { error } = await supabase
        .from("constituents")
        .update(updateData)
        .in("id", ids);

      if (!error) {
        successCount += batch.length;
      }
    }

    setUpdatedCount(successCount);
    setProcessing(false);
    setStep("done");

    const actionLabel =
      action === "clear_email"
        ? "cleared emails for"
        : action === "mark_dne"
          ? "marked 'Do Not Email' on"
          : "cleared emails and marked 'Do Not Email' on";
    toast.success(`Successfully ${actionLabel} ${successCount} constituent(s)`);
    onSuccess();
  };

  const handleClose = () => {
    setRawInput("");
    setMatches([]);
    setUnmatchedEmails([]);
    setAction("mark_dne");
    setStep("input");
    setUpdatedCount(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clean Bounced Emails</DialogTitle>
          <DialogDescription>
            Paste bounced or invalid email addresses to find and update matching constituents.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bounced-emails">Bounced Email Addresses</Label>
              <Textarea
                id="bounced-emails"
                placeholder={"john@example.com\njane@example.com\nbob@example.com"}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="mt-1.5 min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                One email per line, or separated by commas / semicolons. {parseEmails(rawInput).length} email(s) detected.
              </p>
            </div>

            <div>
              <Label>Action to take on matched records</Label>
              <Select value={action} onValueChange={(v) => setAction(v as CleanupAction)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark_dne">Mark "Do Not Email" (keep email on record)</SelectItem>
                  <SelectItem value="clear_email">Clear email address</SelectItem>
                  <SelectItem value="both">Clear email AND mark "Do Not Email"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSearch} disabled={searching || parseEmails(rawInput).length === 0}>
                {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Find Matches
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-primary">{matches.length}</span> matched
              {unmatchedEmails.length > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium text-muted-foreground">{unmatchedEmails.length}</span> not found
                </>
              )}
            </div>

            {matches.length > 0 && (
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_legal_name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.primary_email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {unmatchedEmails.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Not found in database ({unmatchedEmails.length})
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  {unmatchedEmails.slice(0, 10).join(", ")}
                  {unmatchedEmails.length > 10 && ` ...and ${unmatchedEmails.length - 10} more`}
                </p>
              </div>
            )}

            {matches.length === 0 && (
              <p className="text-sm text-muted-foreground">No matching constituents found for the pasted emails.</p>
            )}

            <div className="text-sm p-3 bg-muted/30 rounded-md border">
              <span className="font-medium">Action: </span>
              {action === "clear_email" && "Clear email address from matched records"}
              {action === "mark_dne" && "Mark matched records as \"Do Not Email\""}
              {action === "both" && "Clear email AND mark \"Do Not Email\" on matched records"}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
              <Button
                onClick={handleExecute}
                disabled={processing || matches.length === 0}
                variant="destructive"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Update {matches.length} Record{matches.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <div>
              <p className="text-lg font-semibold">{updatedCount} record(s) updated</p>
              <p className="text-sm text-muted-foreground mt-1">
                The constituent list has been refreshed.
              </p>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
