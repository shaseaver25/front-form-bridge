import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Plus, Pencil, Trash2, TrendingUp, Users } from "lucide-react";
import { useConstituentGifts, useDeleteGift } from "@/hooks/constituents";
import { CreatePledgeDialog } from "../pledges";

type Gift = Database["public"]["Tables"]["gifts"]["Row"];

interface GiftsSectionProps {
  constituentId: string;
  constituentName: string;
  totalGiving: number;
  onAddGift: () => void;
  onEditGift: (gift: Gift) => void;
  onViewSoftCredits: (gift: Gift) => void;
  onTrackMajorGift: () => void;
}

export function GiftsSection({
  constituentId,
  constituentName,
  totalGiving,
  onAddGift,
  onEditGift,
  onViewSoftCredits,
  onTrackMajorGift,
}: GiftsSectionProps) {
  const { data: gifts = [], isLoading } = useConstituentGifts(constituentId);
  const deleteGiftMutation = useDeleteGift();

  const handleDeleteGift = (gift: Gift) => {
    if (confirm(`Delete this $${gift.amount} gift?`)) {
      deleteGiftMutation.mutate({ giftId: gift.id, constituentId });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Giving History
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onTrackMajorGift}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Track Major Gift
            </Button>
            <CreatePledgeDialog
              constituentId={constituentId}
              constituentName={constituentName}
            />
            <Button size="sm" onClick={onAddGift}>
              <Plus className="w-4 h-4 mr-1" />
              Add Gift
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/5 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Giving</p>
          <p className="text-3xl font-bold text-primary">
            ${totalGiving.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {gifts.length} {gifts.length === 1 ? "gift" : "gifts"} recorded
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Designation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : gifts.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Designation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell className="text-sm">
                      {new Date(gift.date_received).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(gift.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground capitalize">
                      {gift.fund_designation.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewSoftCredits(gift)}
                          title="Soft Credits"
                        >
                          <Users className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditGift(gift)}
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGift(gift)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteGiftMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No gifts recorded yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onAddGift}>
              <Plus className="w-4 h-4 mr-1" />
              Record First Gift
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
