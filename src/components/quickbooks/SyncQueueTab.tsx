import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUnsyncedGifts, useUnsyncedConstituents, useStartSync } from '@/hooks/useQuickBooks';
import { RefreshCw, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function SyncQueueTab() {
  const { data: gifts, isLoading: giftsLoading } = useUnsyncedGifts();
  const { data: constituents, isLoading: constituentsLoading } = useUnsyncedConstituents();
  const syncMutation = useStartSync();

  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [selectedConstituents, setSelectedConstituents] = useState<string[]>([]);

  const toggleGift = (id: string) => {
    setSelectedGifts(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleConstituent = (id: string) => {
    setSelectedConstituents(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAllGifts = () => {
    if (selectedGifts.length === (gifts?.length ?? 0)) {
      setSelectedGifts([]);
    } else {
      setSelectedGifts(gifts?.map(g => g.gift_id) ?? []);
    }
  };

  const toggleAllConstituents = () => {
    if (selectedConstituents.length === (constituents?.length ?? 0)) {
      setSelectedConstituents([]);
    } else {
      setSelectedConstituents(constituents?.map(c => c.constituent_id) ?? []);
    }
  };

  const handleSyncGifts = () => {
    syncMutation.mutate({
      syncType: 'incremental',
      direction: 'to_qb',
      entityTypes: ['gift'],
      entityIds: selectedGifts.length > 0 ? selectedGifts : undefined
    });
  };

  const handleSyncConstituents = () => {
    syncMutation.mutate({
      syncType: 'incremental',
      direction: 'to_qb',
      entityTypes: ['constituent'],
      entityIds: selectedConstituents.length > 0 ? selectedConstituents : undefined
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Unsynced Gifts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unsynced Gifts</CardTitle>
              <CardDescription>
                {gifts?.length ?? 0} gifts pending sync to QuickBooks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedGifts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncGifts}
                  disabled={syncMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sync Selected ({selectedGifts.length})
                </Button>
              )}
              <Button
                onClick={handleSyncGifts}
                disabled={syncMutation.isPending || !gifts?.length}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync All Gifts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {giftsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : gifts?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">All gifts are synced!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedGifts.length === (gifts?.length ?? 0) && gifts?.length > 0}
                      onCheckedChange={toggleAllGifts}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts?.map((gift) => (
                  <TableRow key={gift.gift_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGifts.includes(gift.gift_id)}
                        onCheckedChange={() => toggleGift(gift.gift_id)}
                      />
                    </TableCell>
                    <TableCell>
                      {gift.gift_date ? format(new Date(gift.gift_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="font-medium">{gift.donor_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(gift.amount)}
                    </TableCell>
                    <TableCell>{gift.fund || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={gift.is_pledge ? 'secondary' : 'default'}>
                        {gift.is_pledge ? 'Pledge' : 'Gift'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unsynced Constituents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unsynced Constituents</CardTitle>
              <CardDescription>
                {constituents?.length ?? 0} constituents pending sync to QuickBooks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedConstituents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncConstituents}
                  disabled={syncMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sync Selected ({selectedConstituents.length})
                </Button>
              )}
              <Button
                onClick={handleSyncConstituents}
                disabled={syncMutation.isPending || !constituents?.length}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync All Constituents
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {constituentsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : constituents?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">All constituents are synced!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedConstituents.length === (constituents?.length ?? 0) && constituents?.length > 0}
                      onCheckedChange={toggleAllConstituents}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total Giving</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constituents?.map((constituent) => (
                  <TableRow key={constituent.constituent_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedConstituents.includes(constituent.constituent_id)}
                        onCheckedChange={() => toggleConstituent(constituent.constituent_id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{constituent.name}</TableCell>
                    <TableCell>{constituent.email || '—'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(constituent.total_giving)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
