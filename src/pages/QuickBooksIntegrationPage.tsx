import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QBConnectionCard } from '@/components/quickbooks/QBConnectionCard';
import { QBOverviewTab } from '@/components/quickbooks/QBOverviewTab';
import { FundMappingsTab } from '@/components/quickbooks/FundMappingsTab';
import { SyncQueueTab } from '@/components/quickbooks/SyncQueueTab';
import { SyncHistoryTab } from '@/components/quickbooks/SyncHistoryTab';
import { ManualSyncDialog } from '@/components/quickbooks/ManualSyncDialog';
import { QBConfigurationSection } from '@/components/quickbooks/QBConfigurationSection';
import { QBReconciliationTab } from '@/components/quickbooks/QBReconciliationTab';
import { useStartSync, useQBConnection } from '@/hooks/useQuickBooks';
import { RefreshCw, Users, DollarSign, History, Settings, Scale } from 'lucide-react';

export default function QuickBooksIntegrationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const syncMutation = useStartSync();
  const { data: connection } = useQBConnection();
  const isConnected = connection?.is_active;

  const handleSyncAll = () => {
    syncMutation.mutate({
      syncType: 'full',
      direction: 'to_qb',
      entityTypes: ['customers', 'donations', 'pledges']
    });
  };

  const handleSyncGifts = () => {
    syncMutation.mutate({
      syncType: 'incremental',
      direction: 'to_qb',
      entityTypes: ['donations']
    });
  };

  const handleSyncConstituents = () => {
    syncMutation.mutate({
      syncType: 'incremental',
      direction: 'to_qb',
      entityTypes: ['customers']
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QuickBooks Integration</h1>
            <p className="text-muted-foreground">
              Sync donations and pledges with QuickBooks Online
            </p>
          </div>
        </div>

        {/* Connection Card */}
        <QBConnectionCard />

        {/* Quick Actions */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Quick Sync Actions</h3>
              <p className="text-sm text-muted-foreground">
                Push CRM data to QuickBooks
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSyncAll}
                disabled={syncMutation.isPending || !isConnected}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync All
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncGifts}
                disabled={syncMutation.isPending || !isConnected}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Sync Gifts Only
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncConstituents}
                disabled={syncMutation.isPending || !isConnected}
              >
                <Users className="h-4 w-4 mr-2" />
                Sync Constituents Only
              </Button>
              <Button
                variant="outline"
                onClick={() => setSyncDialogOpen(true)}
                disabled={!isConnected}
              >
                <History className="h-4 w-4 mr-2" />
                Advanced Sync
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 lg:w-[750px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reconciliation" disabled={!isConnected}>
              <Scale className="h-4 w-4 mr-1" />
              Reconcile
            </TabsTrigger>
            <TabsTrigger value="configuration" disabled={!isConnected}>
              <Settings className="h-4 w-4 mr-1" />
              Config
            </TabsTrigger>
            <TabsTrigger value="fund-mappings">Mappings</TabsTrigger>
            <TabsTrigger value="sync-queue">Queue</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <QBOverviewTab />
          </TabsContent>

          <TabsContent value="reconciliation" className="mt-6">
            <QBReconciliationTab />
          </TabsContent>

          <TabsContent value="configuration" className="mt-6">
            <QBConfigurationSection />
          </TabsContent>

          <TabsContent value="fund-mappings" className="mt-6">
            <FundMappingsTab />
          </TabsContent>

          <TabsContent value="sync-queue" className="mt-6">
            <SyncQueueTab />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <SyncHistoryTab />
          </TabsContent>
        </Tabs>

        {/* Manual Sync Dialog */}
        <ManualSyncDialog
          open={syncDialogOpen}
          onOpenChange={setSyncDialogOpen}
        />
      </div>
    </Layout>
  );
}
