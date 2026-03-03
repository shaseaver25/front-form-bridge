import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGiftSoftCredits } from '@/hooks/useSoftCredits';
import { SoftCreditCard } from './SoftCreditCard';
import { AddSoftCreditDialog } from './AddSoftCreditDialog';

interface SoftCreditsSectionProps {
  giftId: string;
  giftAmount: number;
  onConstituentClick?: (constituentId: string) => void;
}

export function SoftCreditsSection({
  giftId,
  giftAmount,
  onConstituentClick,
}: SoftCreditsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: softCredits, isLoading, error } = useGiftSoftCredits(giftId);

  const totalSoftCredits = softCredits?.reduce(
    (sum, credit) => sum + Number(credit.amount),
    0
  ) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive text-center">
            Failed to load soft credits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Soft Credits
            </CardTitle>
            {softCredits && softCredits.length > 0 && (
              <Badge variant="secondary">{softCredits.length}</Badge>
            )}
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Soft Credit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : softCredits && softCredits.length > 0 ? (
          <>
            <div className="space-y-2">
              {softCredits.map((credit) => (
                <SoftCreditCard
                  key={credit.id}
                  softCredit={credit}
                  onConstituentClick={onConstituentClick}
                />
              ))}
            </div>
            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm text-muted-foreground">
                Total Soft Credits
              </span>
              <span className="font-semibold">
                ${totalSoftCredits.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No soft credits</p>
            <p className="text-xs mt-1">
              Add recognition for others who influenced this gift
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Soft Credit
            </Button>
          </div>
        )}
      </CardContent>

      <AddSoftCreditDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        giftId={giftId}
        giftAmount={giftAmount}
      />
    </Card>
  );
}
