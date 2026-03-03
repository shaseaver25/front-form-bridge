import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProgramGrant, useLinkGrant, useUnlinkGrant, useAvailableGrants } from "@/hooks/useMissionImpact";
import { Plus, Link2, Unlink, DollarSign, FileText, AlertCircle } from "lucide-react";

interface GrantAlignmentTabProps {
  programId: string;
  linkedGrants: ProgramGrant[];
}

export function GrantAlignmentTab({ programId, linkedGrants }: GrantAlignmentTabProps) {
  const [showLinkGrant, setShowLinkGrant] = useState(false);
  const { data: availableGrants = [] } = useAvailableGrants();
  const linkGrant = useLinkGrant();
  const unlinkGrant = useUnlinkGrant();

  const [newLink, setNewLink] = useState({
    grant_id: "",
    funding_amount: "",
    funding_percentage: "",
    reporting_requirements: "",
  });

  const linkedGrantIds = linkedGrants.map(lg => lg.grant_id);
  const unlinkedGrants = availableGrants.filter(g => !linkedGrantIds.includes(g.id));

  const handleLinkGrant = () => {
    linkGrant.mutate({
      program_id: programId,
      grant_id: newLink.grant_id,
      funding_amount: newLink.funding_amount ? parseFloat(newLink.funding_amount) : null,
      funding_percentage: newLink.funding_percentage ? parseFloat(newLink.funding_percentage) : null,
      reporting_requirements: newLink.reporting_requirements || null,
    }, {
      onSuccess: () => {
        setShowLinkGrant(false);
        setNewLink({
          grant_id: "",
          funding_amount: "",
          funding_percentage: "",
          reporting_requirements: "",
        });
      }
    });
  };

  const handleUnlink = (id: string) => {
    if (confirm("Are you sure you want to unlink this grant?")) {
      unlinkGrant.mutate({ id, programId });
    }
  };

  const totalFunding = linkedGrants.reduce((sum, lg) => sum + (lg.funding_amount || 0), 0);

  const statusColors: Record<string, string> = {
    prospecting: "bg-muted text-muted-foreground",
    submitted: "bg-accent text-accent-foreground",
    awarded: "bg-secondary text-secondary-foreground",
    active: "bg-primary text-primary-foreground",
    closed: "bg-muted text-muted-foreground",
    declined: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Grant Alignment</h3>
        <Dialog open={showLinkGrant} onOpenChange={setShowLinkGrant}>
          <DialogTrigger asChild>
            <Button disabled={unlinkedGrants.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Link Grant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Grant to Program</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Grant</Label>
                <Select value={newLink.grant_id} onValueChange={(v) => setNewLink({ ...newLink, grant_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a grant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedGrants.map(grant => (
                      <SelectItem key={grant.id} value={grant.id}>
                        {grant.title}
                        {grant.awarded_amount && ` ($${grant.awarded_amount.toLocaleString()})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Funding Amount</Label>
                  <Input
                    type="number"
                    value={newLink.funding_amount}
                    onChange={(e) => setNewLink({ ...newLink, funding_amount: e.target.value })}
                    placeholder="e.g., 50000"
                  />
                </div>
                <div>
                  <Label>Funding % of Grant</Label>
                  <Input
                    type="number"
                    value={newLink.funding_percentage}
                    onChange={(e) => setNewLink({ ...newLink, funding_percentage: e.target.value })}
                    placeholder="e.g., 75"
                  />
                </div>
              </div>
              <div>
                <Label>Reporting Requirements</Label>
                <Textarea
                  value={newLink.reporting_requirements}
                  onChange={(e) => setNewLink({ ...newLink, reporting_requirements: e.target.value })}
                  placeholder="What outcomes must be reported for this grant?"
                />
              </div>
              <Button 
                onClick={handleLinkGrant} 
                disabled={!newLink.grant_id || linkGrant.isPending}
              >
                Link Grant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{linkedGrants.length}</p>
                <p className="text-sm text-muted-foreground">Linked Grants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalFunding.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Funding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {linkedGrants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No grants linked to this program</p>
            {unlinkedGrants.length > 0 ? (
              <Button variant="outline" className="mt-4" onClick={() => setShowLinkGrant(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Link First Grant
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Create grants first in the Grants section
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {linkedGrants.map(lg => (
            <Card key={lg.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{lg.grant?.title || "Unknown Grant"}</h4>
                      <Badge className={statusColors[lg.grant?.status_stage || "prospecting"]}>
                        {lg.grant?.status_stage || "unknown"}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {lg.funding_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${lg.funding_amount.toLocaleString()} allocated
                        </span>
                      )}
                      {lg.funding_percentage && (
                        <span>{lg.funding_percentage}% of grant</span>
                      )}
                      {lg.grant?.awarded_amount && (
                        <span>Grant total: ${lg.grant.awarded_amount.toLocaleString()}</span>
                      )}
                    </div>
                    {lg.reporting_requirements && (
                      <div className="flex items-start gap-2 text-sm mt-2">
                        <AlertCircle className="h-4 w-4 text-accent mt-0.5" />
                        <span className="text-muted-foreground">{lg.reporting_requirements}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(lg.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
