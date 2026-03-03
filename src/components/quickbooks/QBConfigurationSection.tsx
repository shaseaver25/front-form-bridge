import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQBConnection, useQBSettings, useQBFundMappings, useUpdateFundMapping } from '@/hooks/useQuickBooks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, RefreshCw, Building2, Settings2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface QBAccount {
  Id: string;
  Name: string;
  AccountType: string;
  FullyQualifiedName?: string;
}

const FUND_DESIGNATIONS = [
  'general_fund',
  'capital_campaign',
  'endowment',
  'program_specific',
  'scholarship',
  'research',
  'unrestricted',
  'other',
];

export function QBConfigurationSection() {
  const { data: connection, isLoading: connectionLoading } = useQBConnection();
  const { data: settings, isLoading: settingsLoading } = useQBSettings();
  const { data: fundMappings } = useQBFundMappings();
  const updateFundMapping = useUpdateFundMapping();
  const queryClient = useQueryClient();

  const [syncFrequency, setSyncFrequency] = useState('manual');
  const [syncDirection, setSyncDirection] = useState('to_qb');
  const [autoSyncNew, setAutoSyncNew] = useState(false);
  const [defaultIncomeAccount, setDefaultIncomeAccount] = useState<string>('');
  const [defaultARAccount, setDefaultARAccount] = useState<string>('');
  const [fundAccountMappings, setFundAccountMappings] = useState<Record<string, string>>({});

  // Fetch QB accounts
  const { data: qbAccounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['qb-accounts'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('quickbooks-api', {
        body: { action: 'getAccounts' },
      });

      if (response.error) throw response.error;
      return response.data as {
        incomeAccounts: QBAccount[];
        arAccounts: QBAccount[];
        allAccounts: QBAccount[];
      };
    },
    enabled: !!connection?.is_active,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('quickbooks-api', {
        body: { action: 'testConnection' },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Connected to ${data.companyName}`);
      queryClient.invalidateQueries({ queryKey: ['qb-settings'] });
    },
    onError: (error: Error) => {
      toast.error('Connection test failed: ' + error.message);
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find account names for selected IDs
      const incomeAccountName = qbAccounts?.incomeAccounts.find(a => a.Id === defaultIncomeAccount)?.Name;
      const arAccountName = qbAccounts?.arAccounts.find(a => a.Id === defaultARAccount)?.Name;

      const { error } = await supabase
        .from('quickbooks_settings')
        .upsert({
          user_id: user.id,
          sync_frequency: syncFrequency,
          sync_direction: syncDirection,
          auto_sync_new_donations: autoSyncNew,
          default_income_account_id: defaultIncomeAccount || null,
          default_income_account_name: incomeAccountName || null,
          default_ar_account_id: defaultARAccount || null,
          default_ar_account_name: arAccountName || null,
          settings: { fundMappings: fundAccountMappings },
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Update fund mappings
      for (const [fund, accountId] of Object.entries(fundAccountMappings)) {
        const accountName = qbAccounts?.incomeAccounts.find(a => a.Id === accountId)?.Name;
        const existing = fundMappings?.find(m => m.fund_designation === fund);
        
        if (accountId) {
          await updateFundMapping.mutateAsync({
            id: existing?.id,
            fund_designation: fund,
            qb_account_id: accountId,
            qb_account_name: accountName || null,
            is_active: true,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['qb-settings'] });
      queryClient.invalidateQueries({ queryKey: ['qb-fund-mappings'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  // Initialize form state from existing settings
  useEffect(() => {
    if (settings) {
      const s = settings as Record<string, unknown>;
      setSyncFrequency((s.sync_frequency as string) || 'manual');
      setSyncDirection((s.sync_direction as string) || 'to_qb');
      setAutoSyncNew((s.auto_sync_new_donations as boolean) || false);
      setDefaultIncomeAccount((s.default_income_account_id as string) || '');
      setDefaultARAccount((s.default_ar_account_id as string) || '');
      
      const storedMappings = (s.settings as Record<string, unknown>)?.fundMappings as Record<string, string> || {};
      setFundAccountMappings(storedMappings);
    }
  }, [settings]);

  // Initialize fund mappings from database
  useEffect(() => {
    if (fundMappings) {
      const mappings: Record<string, string> = {};
      fundMappings.forEach(m => {
        if (m.qb_account_id) {
          mappings[m.fund_designation] = m.qb_account_id;
        }
      });
      setFundAccountMappings(prev => ({ ...prev, ...mappings }));
    }
  }, [fundMappings]);

  if (!connection?.is_active) {
    return null;
  }

  if (connectionLoading || settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Connection Status</CardTitle>
              <CardDescription>Test and verify your QuickBooks connection</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{connection.company_name}</span>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              </div>
              {settings?.last_connection_test && (
                <p className="text-sm text-muted-foreground">
                  Last tested: {format(new Date(settings.last_connection_test), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Account Mapping</CardTitle>
                <CardDescription>Map CRM funds to QuickBooks accounts</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchAccounts()}
              disabled={accountsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${accountsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {accountsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* Default Accounts */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Income Account (Donations)</Label>
                  <Select value={defaultIncomeAccount} onValueChange={setDefaultIncomeAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income account" />
                    </SelectTrigger>
                    <SelectContent>
                      {qbAccounts?.incomeAccounts
                        .filter((account) => account.Id)
                        .map((account) => (
                          <SelectItem key={account.Id} value={account.Id}>
                            {account.FullyQualifiedName || account.Name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for general donations without specific fund designation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Accounts Receivable (Pledges)</Label>
                  <Select value={defaultARAccount} onValueChange={setDefaultARAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select A/R account" />
                    </SelectTrigger>
                    <SelectContent>
                      {qbAccounts?.arAccounts
                        .filter((account) => account.Id)
                        .map((account) => (
                          <SelectItem key={account.Id} value={account.Id}>
                            {account.FullyQualifiedName || account.Name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for recording pledge receivables
                  </p>
                </div>
              </div>

              {/* Fund Designation Mappings */}
              <div className="space-y-3">
                <Label className="text-base">Fund Designation → Revenue Account</Label>
                <div className="grid gap-3">
                  {FUND_DESIGNATIONS.map((fund) => (
                    <div key={fund} className="flex items-center gap-4">
                      <span className="w-40 text-sm capitalize">
                        {fund.replace('_', ' ')}
                      </span>
                      <Select
                        value={fundAccountMappings[fund] || '_default'}
                        onValueChange={(value) =>
                          setFundAccountMappings((prev) => ({ 
                            ...prev, 
                            [fund]: value === '_default' ? '' : value 
                          }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select QB account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_default">Use default</SelectItem>
                          {qbAccounts?.incomeAccounts
                            .filter((account) => account.Id)
                            .map((account) => (
                              <SelectItem key={account.Id} value={account.Id}>
                                {account.FullyQualifiedName || account.Name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Sync Settings</CardTitle>
              <CardDescription>Configure how data syncs between systems</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Sync Frequency</Label>
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Only</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sync Direction</Label>
              <Select value={syncDirection} onValueChange={setSyncDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_qb">CRM → QuickBooks Only</SelectItem>
                  <SelectItem value="bidirectional">Bi-directional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Auto-sync New Donations</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync new gifts to QuickBooks when recorded
              </p>
            </div>
            <Switch checked={autoSyncNew} onCheckedChange={setAutoSyncNew} />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending || accountsLoading}
        >
          {saveSettingsMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}