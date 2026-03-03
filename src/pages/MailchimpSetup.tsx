import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MailchimpField {
  tag: string;
  name: string;
  type: string;
  required: boolean;
}

interface MailchimpList {
  id: string;
  name: string;
  subscriber_count: number;
  web_id: number;
}

interface FieldMapping {
  mailchimp_field: string;
  crm_field: string | null;
  is_required: boolean;
  field_type: string;
}

const CRM_FIELDS = [
  { value: 'primary_email', label: 'Email (Primary)', required: true },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'mobile_phone', label: 'Mobile Phone' },
  { value: 'home_phone', label: 'Home Phone' },
  { value: 'mailing_street', label: 'Street Address' },
  { value: 'mailing_city', label: 'City' },
  { value: 'mailing_state', label: 'State' },
  { value: 'mailing_postal_code', label: 'Postal Code' },
  { value: 'mailing_country', label: 'Country' },
  { value: 'mailchimp_tags', label: 'Tags (Array)' },
  { value: 'mailchimp_status', label: 'Subscription Status' },
  { value: 'mailchimp_member_rating', label: 'Engagement Score' },
  { value: 'mailchimp_last_changed', label: 'Last Updated' },
  { value: 'email_preferences', label: 'Email Preference' },
];

const MailchimpSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [syncFrequency, setSyncFrequency] = useState("manual");
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [onlySubscribed, setOnlySubscribed] = useState(true);
  const [syncEngagement, setSyncEngagement] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);

  // Fetch Mailchimp config
  const { data: config } = useQuery({
    queryKey: ["mailchimp-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mailchimp_sync_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch Mailchimp lists
  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: ["mailchimp-lists"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("mailchimp-fetch-data", {
        body: { action: "fetch_lists" },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data.lists as MailchimpList[];
    },
    enabled: !!config,
  });

  // Fetch merge fields for selected list
  const { data: mergeFields, isLoading: fieldsLoading } = useQuery({
    queryKey: ["mailchimp-merge-fields", selectedListId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("mailchimp-fetch-data", {
        body: { 
          action: "fetch_merge_fields",
          list_id: selectedListId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data.fields as MailchimpField[];
    },
    enabled: !!selectedListId,
  });

  // Initialize field mappings when merge fields are loaded
  useEffect(() => {
    if (mergeFields) {
      const defaultMappings: FieldMapping[] = mergeFields.map(field => {
        // Default mapping suggestions
        let defaultCrmField: string | null = null;
        
        if (field.tag === 'EMAIL') defaultCrmField = 'primary_email';
        else if (field.tag === 'FNAME') defaultCrmField = 'first_name';
        else if (field.tag === 'LNAME') defaultCrmField = 'last_name';
        else if (field.tag === 'PHONE') defaultCrmField = 'phone';
        else if (field.tag === 'TAGS') defaultCrmField = 'mailchimp_tags';
        else if (field.tag === 'STATUS') defaultCrmField = 'mailchimp_status';
        else if (field.tag === 'RATING') defaultCrmField = 'mailchimp_member_rating';
        else if (field.tag === 'LAST_CHANGED') defaultCrmField = 'mailchimp_last_changed';
        else if (field.tag === 'EMAIL_TYPE') defaultCrmField = 'email_preferences';

        return {
          mailchimp_field: field.tag,
          crm_field: defaultCrmField,
          is_required: field.required,
          field_type: field.type,
        };
      });
      
      setFieldMappings(defaultMappings);
    }
  }, [mergeFields]);

  const testSyncMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("mailchimp-fetch-data", {
        body: { 
          action: "test_sync",
          list_id: selectedListId,
          field_mappings: fieldMappings,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setTestResults(data.samples);
      toast({
        title: "Test Sync Complete",
        description: `Successfully mapped ${data.samples.length} sample contacts`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!config) throw new Error("No config found");

      // Save field mappings
      const { error: mappingError } = await supabase
        .from("mailchimp_field_mappings")
        .delete()
        .eq("config_id", config.id);

      if (mappingError) throw mappingError;

      const { error: insertError } = await supabase
        .from("mailchimp_field_mappings")
        .insert(
          fieldMappings
            .filter(m => m.crm_field)
            .map(m => ({
              config_id: config.id,
              mailchimp_field: m.mailchimp_field,
              crm_field: m.crm_field,
              is_required: m.is_required,
              field_type: m.field_type,
            }))
        );

      if (insertError) throw insertError;

      // Save audience selection
      const { error: audienceError } = await supabase
        .from("mailchimp_audiences")
        .upsert({
          config_id: config.id,
          mailchimp_list_id: selectedListId,
          list_name: lists?.find(l => l.id === selectedListId)?.name || "",
          subscriber_count: lists?.find(l => l.id === selectedListId)?.subscriber_count || 0,
          is_selected: true,
        });

      if (audienceError) throw audienceError;

      // Update sync config settings
      const { error: configError } = await supabase
        .from("mailchimp_sync_config")
        .update({
          sync_direction: onlySubscribed ? "mailchimp_to_crm" : "mailchimp_to_crm_all",
          sync_frequency: syncFrequency === "manual" ? "00:00:00" : "24:00:00",
          auto_create_constituents: overwriteExisting,
          sync_activities: syncEngagement,
        })
        .eq("id", config.id);

      if (configError) throw configError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailchimp-config"] });
      toast({
        title: "Configuration Saved",
        description: "Your Mailchimp sync settings have been saved successfully.",
      });
      navigate("/mailchimp-settings");
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFieldMapping = (mailchimpField: string, crmField: string | null) => {
    setFieldMappings(prev =>
      prev.map(m =>
        m.mailchimp_field === mailchimpField
          ? { ...m, crm_field: crmField }
          : m
      )
    );
  };

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mailchimp Not Connected</CardTitle>
            <CardDescription>
              Please connect your Mailchimp account first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/mailchimp-settings")}>
              Go to Mailchimp Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mailchimp-settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mailchimp Setup</h1>
          <p className="text-muted-foreground">Configure field mapping and sync settings</p>
        </div>
      </div>

      {/* Section A: Audience Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Audience</CardTitle>
          <CardDescription>
            Choose which Mailchimp audience/list to sync
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading audiences...</span>
            </div>
          ) : (
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an audience" />
              </SelectTrigger>
              <SelectContent>
                {lists?.map(list => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name} ({list.subscriber_count.toLocaleString()} subscribers)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Section B: Field Mapping */}
      {selectedListId && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Map Fields</CardTitle>
            <CardDescription>
              Map Mailchimp fields to your CRM database fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fieldsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading merge fields...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {mergeFields?.map(field => {
                  const mapping = fieldMappings.find(m => m.mailchimp_field === field.tag);
                  
                  return (
                    <div key={field.tag} className="grid grid-cols-2 gap-4 items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {field.name}
                          {field.required && (
                            <span className="text-xs text-red-500">*Required</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {field.tag} ({field.type})
                        </div>
                      </div>
                      <div>
                        <Select
                          value={mapping?.crm_field || "none"}
                          onValueChange={(value) =>
                            updateFieldMapping(field.tag, value === "none" ? null : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Don't map</SelectItem>
                            <Separator className="my-1" />
                            {CRM_FIELDS.map(crmField => (
                              <SelectItem key={crmField.value} value={crmField.value}>
                                {crmField.label}
                                {crmField.required && " *"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section C: Sync Settings */}
      {selectedListId && fieldMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Sync Settings</CardTitle>
            <CardDescription>
              Configure how and when to sync data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Sync Frequency</Label>
                <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                />
                <Label htmlFor="overwrite" className="cursor-pointer">
                  Overwrite existing contacts if email matches
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subscribed"
                  checked={onlySubscribed}
                  onCheckedChange={(checked) => setOnlySubscribed(checked as boolean)}
                />
                <Label htmlFor="subscribed" className="cursor-pointer">
                  Only sync subscribed contacts
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="engagement"
                  checked={syncEngagement}
                  onCheckedChange={(checked) => setSyncEngagement(checked as boolean)}
                />
                <Label htmlFor="engagement" className="cursor-pointer">
                  Sync campaign engagement data
                </Label>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => testSyncMutation.mutate()}
                disabled={testSyncMutation.isPending}
              >
                {testSyncMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Test Sync (5 samples)
                  </>
                )}
              </Button>

              <Button
                onClick={() => saveConfigMutation.mutate()}
                disabled={saveConfigMutation.isPending || !fieldMappings.some(m => m.crm_field === 'primary_email')}
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>

            {!fieldMappings.some(m => m.crm_field === 'primary_email') && (
              <p className="text-sm text-destructive">
                * Email field must be mapped to save configuration
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Preview of mapped data from {testResults.length} sample contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Sample {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Mailchimp Data:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(result.mailchimp_data, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Mapped to CRM:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(result.mapped_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MailchimpSetup;
