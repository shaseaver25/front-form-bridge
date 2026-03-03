import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SalesforceField {
  name: string;
  label: string;
  type: string;
  updateable: boolean;
}

interface FieldMapping {
  salesforce_field: string;
  crm_table: string;
  crm_field: string;
  salesforce_object: string;
}

interface SalesforceFieldMapperProps {
  objectType: string;
  onComplete: () => void;
}

const CRM_FIELD_OPTIONS: Record<string, { table: string; fields: { value: string; label: string }[] }> = {
  Contact: {
    table: 'constituents',
    fields: [
      // Name fields
      { value: 'first_name', label: 'First Name' },
      { value: 'last_name', label: 'Last Name' },
      { value: 'preferred_name', label: 'Preferred Name' },
      { value: 'salutation', label: 'Salutation' },
      { value: 'title', label: 'Title' },
      
      // Contact info
      { value: 'primary_email', label: 'Email' },
      { value: 'phone', label: 'Business Phone' },
      { value: 'mobile_phone', label: 'Mobile Phone' },
      { value: 'home_phone', label: 'Home Phone' },
      
      // Address fields
      { value: 'mailing_street', label: 'Mailing Street' },
      { value: 'mailing_city', label: 'City' },
      { value: 'mailing_state', label: 'State' },
      { value: 'mailing_postal_code', label: 'Postal Code' },
      { value: 'mailing_country', label: 'Country' },
      
      // Engagement
      { value: 'last_activity_date', label: 'Last Activity Date' },
      
      // Donor info
      { value: 'donor_type', label: 'Donor Type' },
      { value: 'giving_level', label: 'Giving Level' },
      { value: 'employer', label: 'Employer' },
      
      // Communication prefs
      { value: 'communication_preference', label: 'Communication Preference' },
      { value: 'do_not_contact', label: 'Do Not Contact' },
      { value: 'do_not_mail', label: 'Do Not Mail' },
      { value: 'do_not_email', label: 'Do Not Email' },
      { value: 'do_not_call', label: 'Do Not Call' },
      
      // Salesforce
      { value: 'salesforce_id', label: 'Salesforce ID' }
    ]
  },
  Opportunity: {
    table: 'grant_opportunities',
    fields: [
      { value: 'title', label: 'Grant Name' },
      { value: 'requested_amount', label: 'Requested Amount' },
      { value: 'awarded_amount', label: 'Awarded Amount' },
      { value: 'status_stage', label: 'Status' },
      { value: 'application_deadline', label: 'Application Deadline' },
      { value: 'submitted_date', label: 'Submitted Date' },
      { value: 'expected_decision_date', label: 'Expected Decision Date' },
      { value: 'decision_date', label: 'Decision Date' },
      { value: 'grant_period_start', label: 'Grant Period Start' },
      { value: 'grant_period_end', label: 'Grant Period End' },
      { value: 'contract_number', label: 'Contract Number' },
      { value: 'contract_date', label: 'Contract Date' },
      { value: 'program_areas', label: 'Program Areas' },
      { value: 'requirements', label: 'Requirements' },
      { value: 'restrictions', label: 'Restrictions' },
      { value: 'is_renewal', label: 'Is Renewal' },
      { value: 'priority', label: 'Priority' },
      { value: 'next_deliverable_date', label: 'Next Deliverable Date' },
      { value: 'project_description', label: 'Description' },
      { value: 'notes', label: 'Notes' },
      { value: 'salesforce_id', label: 'Salesforce ID' }
    ]
  },
  'npsp__Grant_Deadline__c': {
    table: 'grant_deliverables',
    fields: [
      { value: 'deliverable_name', label: 'Deliverable Name' },
      { value: 'deliverable_type', label: 'Type' },
      { value: 'due_date', label: 'Due Date' },
      { value: 'completed_date', label: 'Completed Date' },
      { value: 'requirements', label: 'Requirements' },
      { value: 'salesforce_id', label: 'Salesforce ID' }
    ]
  },
  Account: {
    table: 'organizations',
    fields: [
      { value: 'name', label: 'Organization Name' },
      { value: 'organization_type', label: 'Type' },
      { value: 'website', label: 'Website' },
      { value: 'phone', label: 'Phone' },
      { value: 'email', label: 'Email' },
      { value: 'address', label: 'Address (legacy)' },
      { value: 'address_street', label: 'Street' },
      { value: 'address_city', label: 'City' },
      { value: 'address_state', label: 'State' },
      { value: 'address_postal_code', label: 'Postal Code' },
      { value: 'address_country', label: 'Country' },
      { value: 'primary_contact', label: 'Primary Contact' },
      { value: 'notes', label: 'Notes' },
      { value: 'salesforce_id', label: 'Salesforce ID' }
    ]
  },
  'pmdm__Program__c': {
    table: 'organizations',
    fields: [
      { value: 'name', label: 'Program Name' },
      { value: 'notes', label: 'Description/Notes' },
      { value: 'organization_type', label: 'Status' }
    ]
  }
};

const DEFAULT_MAPPINGS: Record<string, FieldMapping[]> = {
  Contact: [
    { salesforce_field: 'FirstName', crm_table: 'constituents', crm_field: 'first_name', salesforce_object: 'Contact' },
    { salesforce_field: 'LastName', crm_table: 'constituents', crm_field: 'last_name', salesforce_object: 'Contact' },
    { salesforce_field: 'Email', crm_table: 'constituents', crm_field: 'primary_email', salesforce_object: 'Contact' },
    { salesforce_field: 'Title', crm_table: 'constituents', crm_field: 'title', salesforce_object: 'Contact' },
    { salesforce_field: 'Phone', crm_table: 'constituents', crm_field: 'phone', salesforce_object: 'Contact' },
    { salesforce_field: 'MobilePhone', crm_table: 'constituents', crm_field: 'mobile_phone', salesforce_object: 'Contact' },
    { salesforce_field: 'HomePhone', crm_table: 'constituents', crm_field: 'home_phone', salesforce_object: 'Contact' },
    { salesforce_field: 'MailingStreet', crm_table: 'constituents', crm_field: 'mailing_street', salesforce_object: 'Contact' },
    { salesforce_field: 'MailingCity', crm_table: 'constituents', crm_field: 'mailing_city', salesforce_object: 'Contact' },
    { salesforce_field: 'MailingState', crm_table: 'constituents', crm_field: 'mailing_state', salesforce_object: 'Contact' },
    { salesforce_field: 'MailingPostalCode', crm_table: 'constituents', crm_field: 'mailing_postal_code', salesforce_object: 'Contact' },
    { salesforce_field: 'MailingCountry', crm_table: 'constituents', crm_field: 'mailing_country', salesforce_object: 'Contact' },
    { salesforce_field: 'Id', crm_table: 'constituents', crm_field: 'salesforce_id', salesforce_object: 'Contact' }
  ],
  Opportunity: [
    { salesforce_field: 'Name', crm_table: 'grant_opportunities', crm_field: 'title', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Amount', crm_table: 'grant_opportunities', crm_field: 'awarded_amount', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Requested_Amount__c', crm_table: 'grant_opportunities', crm_field: 'requested_amount', salesforce_object: 'Opportunity' },
    { salesforce_field: 'StageName', crm_table: 'grant_opportunities', crm_field: 'status_stage', salesforce_object: 'Opportunity' },
    { salesforce_field: 'CloseDate', crm_table: 'grant_opportunities', crm_field: 'decision_date', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Application_Due_Date__c', crm_table: 'grant_opportunities', crm_field: 'application_deadline', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Submitted_Date__c', crm_table: 'grant_opportunities', crm_field: 'submitted_date', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Grant_Period_Start_Date__c', crm_table: 'grant_opportunities', crm_field: 'grant_period_start', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Grant_Period_End_Date__c', crm_table: 'grant_opportunities', crm_field: 'grant_period_end', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Grant_Contract_Number__c', crm_table: 'grant_opportunities', crm_field: 'contract_number', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Grant_Contract_Date__c', crm_table: 'grant_opportunities', crm_field: 'contract_date', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Grant_Program_Area_s__c', crm_table: 'grant_opportunities', crm_field: 'program_areas', salesforce_object: 'Opportunity' },
    { salesforce_field: 'npsp__Grant_Requirements_Description__c', crm_table: 'grant_opportunities', crm_field: 'requirements', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Restriction_Details__c', crm_table: 'grant_opportunities', crm_field: 'restrictions', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Is_Grant_Renewal__c', crm_table: 'grant_opportunities', crm_field: 'is_renewal', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Application_Priority__c', crm_table: 'grant_opportunities', crm_field: 'priority', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Description', crm_table: 'grant_opportunities', crm_field: 'project_description', salesforce_object: 'Opportunity' },
    { salesforce_field: 'Id', crm_table: 'grant_opportunities', crm_field: 'salesforce_id', salesforce_object: 'Opportunity' }
  ],
  'npsp__Grant_Deadline__c': [
    { salesforce_field: 'Name', crm_table: 'grant_deliverables', crm_field: 'deliverable_name', salesforce_object: 'npsp__Grant_Deadline__c' },
    { salesforce_field: 'npsp__Type__c', crm_table: 'grant_deliverables', crm_field: 'deliverable_type', salesforce_object: 'npsp__Grant_Deadline__c' },
    { salesforce_field: 'npsp__Grant_Deadline_Due_Date__c', crm_table: 'grant_deliverables', crm_field: 'due_date', salesforce_object: 'npsp__Grant_Deadline__c' },
    { salesforce_field: 'npsp__Grant_Deliverable_Close_Date__c', crm_table: 'grant_deliverables', crm_field: 'completed_date', salesforce_object: 'npsp__Grant_Deadline__c' },
    { salesforce_field: 'npsp__Grant_Deliverable_Requirements__c', crm_table: 'grant_deliverables', crm_field: 'requirements', salesforce_object: 'npsp__Grant_Deadline__c' },
    { salesforce_field: 'Id', crm_table: 'grant_deliverables', crm_field: 'salesforce_id', salesforce_object: 'npsp__Grant_Deadline__c' }
  ],
  Account: [
    { salesforce_field: 'Name', crm_table: 'organizations', crm_field: 'name', salesforce_object: 'Account' },
    { salesforce_field: 'Type', crm_table: 'organizations', crm_field: 'organization_type', salesforce_object: 'Account' },
    { salesforce_field: 'Website', crm_table: 'organizations', crm_field: 'website', salesforce_object: 'Account' },
    { salesforce_field: 'Phone', crm_table: 'organizations', crm_field: 'phone', salesforce_object: 'Account' },
    { salesforce_field: 'BillingStreet', crm_table: 'organizations', crm_field: 'address_street', salesforce_object: 'Account' },
    { salesforce_field: 'BillingCity', crm_table: 'organizations', crm_field: 'address_city', salesforce_object: 'Account' },
    { salesforce_field: 'BillingState', crm_table: 'organizations', crm_field: 'address_state', salesforce_object: 'Account' },
    { salesforce_field: 'BillingPostalCode', crm_table: 'organizations', crm_field: 'address_postal_code', salesforce_object: 'Account' },
    { salesforce_field: 'BillingCountry', crm_table: 'organizations', crm_field: 'address_country', salesforce_object: 'Account' },
    { salesforce_field: 'Description', crm_table: 'organizations', crm_field: 'notes', salesforce_object: 'Account' },
    { salesforce_field: 'Id', crm_table: 'organizations', crm_field: 'salesforce_id', salesforce_object: 'Account' }
  ],
  'pmdm__Program__c': [
    { salesforce_field: 'Name', crm_table: 'organizations', crm_field: 'name', salesforce_object: 'pmdm__Program__c' },
    { salesforce_field: 'pmdm__Description__c', crm_table: 'organizations', crm_field: 'notes', salesforce_object: 'pmdm__Program__c' },
    { salesforce_field: 'pmdm__Status__c', crm_table: 'organizations', crm_field: 'organization_type', salesforce_object: 'pmdm__Program__c' }
  ]
};

export default function SalesforceFieldMapper({ objectType, onComplete }: SalesforceFieldMapperProps) {
  const queryClient = useQueryClient();
  const [mappings, setMappings] = useState<FieldMapping[]>(DEFAULT_MAPPINGS[objectType] || []);

  // Discover fields from Salesforce
  const { data: discoveredFields, isLoading: isDiscovering } = useQuery({
    queryKey: ["salesforce-fields", objectType],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("salesforce-import", {
        body: {
          action: "discover_fields",
          objectName: objectType
        }
      });

      if (error) throw error;
      return data.fields as SalesforceField[];
    }
  });

  // Save mappings mutation
  const saveMappingsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get config_id
      const { data: config } = await supabase
        .from("salesforce_configurations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!config) throw new Error("Salesforce configuration not found");

      // Delete existing mappings for this object
      await supabase
        .from("salesforce_field_mappings")
        .delete()
        .eq("config_id", config.id)
        .eq("salesforce_object", objectType);

      // Insert new mappings
      const mappingsToInsert = mappings.map(m => ({
        config_id: config.id,
        salesforce_object: objectType,
        salesforce_field: m.salesforce_field,
        crm_table: m.crm_table,
        crm_field: m.crm_field,
        is_active: true,
        transformation_rule: 'direct'
      }));

      const { error } = await supabase
        .from("salesforce_field_mappings")
        .insert(mappingsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Field mappings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["salesforce-field-mappings"] });
      onComplete();
    },
    onError: (error) => {
      toast.error("Failed to save mappings: " + error.message);
    }
  });

  const updateMapping = (sfField: string, crmField: string) => {
    const crmOptions = CRM_FIELD_OPTIONS[objectType];
    if (!crmOptions) return;

    const existingIndex = mappings.findIndex(m => m.salesforce_field === sfField);
    const newMapping: FieldMapping = {
      salesforce_field: sfField,
      crm_table: crmOptions.table,
      crm_field: crmField,
      salesforce_object: objectType
    };

    if (existingIndex >= 0) {
      const updated = [...mappings];
      updated[existingIndex] = newMapping;
      setMappings(updated);
    } else {
      setMappings([...mappings, newMapping]);
    }
  };

  const removeMapping = (sfField: string) => {
    setMappings(mappings.filter(m => m.salesforce_field !== sfField));
  };

  if (isDiscovering) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Discovering fields from Salesforce...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const crmOptions = CRM_FIELD_OPTIONS[objectType];
  if (!crmOptions) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <p>Object type not supported for field mapping yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Field Mappings</CardTitle>
          <CardDescription>
            Map {objectType} fields from Salesforce to your CRM fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {discoveredFields?.map((field) => {
              const currentMapping = mappings.find(m => m.salesforce_field === field.name);
              
              return (
                <div key={field.name} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{field.label}</Label>
                      <Badge variant="outline" className="text-xs">{field.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{field.name}</p>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  
                  <div className="flex-1">
                    <Select
                      value={currentMapping?.crm_field || ''}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          removeMapping(field.name);
                        } else {
                          updateMapping(field.name, value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select CRM field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Don't import</span>
                        </SelectItem>
                        {crmOptions.fields.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {currentMapping && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>{mappings.length} field{mappings.length !== 1 ? 's' : ''} mapped</strong>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Unmapped fields will not be imported from Salesforce
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onComplete}>
          Skip for Now
        </Button>
        <Button 
          onClick={() => saveMappingsMutation.mutate()}
          disabled={saveMappingsMutation.isPending || mappings.length === 0}
        >
          {saveMappingsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save Mappings <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
