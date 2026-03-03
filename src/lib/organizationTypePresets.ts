export type OrganizationType = 'nonprofit' | 'education' | 'small_business';

export interface TerminologyPreset {
  constituent_label: string;
  organization_label: string;
  pipeline_label: string;
  opportunity_label: string;
  account_label: string;
  site_label?: string;
}

export interface FeatureRecommendation {
  key: string;
  recommended: boolean;
  note?: string;
}

export const TERMINOLOGY_PRESETS: Record<OrganizationType, TerminologyPreset> = {
  nonprofit: {
    constituent_label: 'Constituents',
    organization_label: 'Organizations',
    pipeline_label: 'Major Gifts',
    opportunity_label: 'Opportunity',
    account_label: 'Donor Accounts',
    site_label: 'Sites',
  },
  education: {
    constituent_label: 'Families',
    organization_label: 'Partners',
    pipeline_label: 'Major Gifts',
    opportunity_label: 'Opportunity',
    account_label: 'Donor Accounts',
    site_label: 'Schools',
  },
  small_business: {
    constituent_label: 'Customers',
    organization_label: 'Companies',
    pipeline_label: 'Sales Pipeline',
    opportunity_label: 'Deal',
    account_label: 'Customer Accounts',
    site_label: 'Locations',
  },
};

export const FEATURE_RECOMMENDATIONS: Record<OrganizationType, FeatureRecommendation[]> = {
  nonprofit: [
    { key: 'constituents', recommended: true },
    { key: 'organizations', recommended: true },
    { key: 'activities', recommended: true },
    { key: 'tasks', recommended: true },
    { key: 'donations', recommended: true },
    { key: 'pledges', recommended: true },
    { key: 'soft_credits', recommended: true },
    { key: 'pipeline', recommended: true, note: 'Major Gifts Pipeline' },
    { key: 'grants', recommended: true },
    { key: 'campaigns', recommended: true },
    { key: 'sites', recommended: true, note: 'Mission Impact' },
    { key: 'email_campaigns', recommended: true },
    { key: 'events', recommended: false, note: 'Optional for galas/fundraisers' },
    { key: 'talent_pool', recommended: false },
    { key: 'project_boards', recommended: false },
    { key: 'sales_pipeline', recommended: false, note: 'Use Major Gifts instead' },
    { key: 'customer_accounts', recommended: false },
    { key: 'invoicing', recommended: false },
    { key: 'contracts', recommended: false },
  ],
  education: [
    { key: 'constituents', recommended: true, note: 'Families/Alumni' },
    { key: 'organizations', recommended: true },
    { key: 'activities', recommended: true },
    { key: 'tasks', recommended: true },
    { key: 'donations', recommended: true },
    { key: 'pledges', recommended: true },
    { key: 'soft_credits', recommended: true },
    { key: 'pipeline', recommended: true, note: 'Major Gifts Pipeline' },
    { key: 'grants', recommended: true },
    { key: 'campaigns', recommended: true },
    { key: 'sites', recommended: true, note: 'Schools/Campuses' },
    { key: 'events', recommended: true, note: 'For school events' },
    { key: 'email_campaigns', recommended: true },
    { key: 'talent_pool', recommended: false },
    { key: 'project_boards', recommended: false },
    { key: 'sales_pipeline', recommended: false },
    { key: 'customer_accounts', recommended: false },
    { key: 'invoicing', recommended: false },
    { key: 'contracts', recommended: false },
  ],
  small_business: [
    { key: 'constituents', recommended: true, note: 'Customer Management' },
    { key: 'organizations', recommended: true, note: 'Company Management' },
    { key: 'activities', recommended: true },
    { key: 'tasks', recommended: true },
    { key: 'sales_pipeline', recommended: true },
    { key: 'events', recommended: true, note: 'Webinars & client events' },
    { key: 'talent_pool', recommended: true },
    { key: 'project_boards', recommended: true },
    { key: 'email_campaigns', recommended: true },
    { key: 'customer_accounts', recommended: true },
    { key: 'invoicing', recommended: true },
    { key: 'contracts', recommended: true },
    { key: 'donations', recommended: false, note: 'Not typically used' },
    { key: 'pledges', recommended: false },
    { key: 'soft_credits', recommended: false },
    { key: 'pipeline', recommended: false, note: 'Use Sales Pipeline instead' },
    { key: 'grants', recommended: false },
    { key: 'campaigns', recommended: false },
    { key: 'sites', recommended: false },
  ],
};

export const DEFAULT_ENABLED_FEATURES: Record<OrganizationType, string[]> = {
  nonprofit: ['constituents', 'organizations', 'activities', 'tasks', 'donations', 'pledges', 'soft_credits', 'pipeline', 'grants', 'campaigns', 'sites', 'email_campaigns'],
  education: ['constituents', 'organizations', 'activities', 'tasks', 'donations', 'pledges', 'soft_credits', 'pipeline', 'grants', 'campaigns', 'sites', 'events', 'email_campaigns'],
  small_business: ['constituents', 'organizations', 'activities', 'tasks', 'sales_pipeline', 'events', 'talent_pool', 'project_boards', 'email_campaigns', 'customer_accounts', 'invoicing', 'contracts'],
};

export const ORGANIZATION_TYPE_META: Record<OrganizationType, { label: string; icon: string; description: string }> = {
  nonprofit: { label: 'Nonprofit', icon: 'Building2', description: 'Charitable organizations, foundations, and NGOs' },
  education: { label: 'Education', icon: 'GraduationCap', description: 'K-12 schools, universities, and educational institutions' },
  small_business: { label: 'Small Business', icon: 'Briefcase', description: 'Service businesses, agencies, and B2B companies' },
};

export const FEATURE_NAME_OVERRIDES: Record<OrganizationType, Record<string, string>> = {
  nonprofit: { pipeline: 'Major Gifts Pipeline', constituents: 'Constituent Management', organizations: 'Organization Management' },
  education: { pipeline: 'Major Gifts Pipeline', constituents: 'Family/Alumni Management', organizations: 'Partner Management', sites: 'School/Campus Management' },
  small_business: { pipeline: 'Sales Pipeline', constituents: 'Customer Management', organizations: 'Company Management', sites: 'Location Management' },
};

export function getRecommendationForFeature(orgType: OrganizationType, featureKey: string): { recommended: boolean; note?: string } | null {
  const recommendations = FEATURE_RECOMMENDATIONS[orgType];
  const rec = recommendations?.find((r) => r.key === featureKey);
  return rec ? { recommended: rec.recommended, note: rec.note } : null;
}

export function getFeatureDisplayName(orgType: OrganizationType, featureKey: string, defaultName: string): string {
  return FEATURE_NAME_OVERRIDES[orgType]?.[featureKey] || defaultName;
}