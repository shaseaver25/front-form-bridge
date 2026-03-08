/**
 * Centralized route configuration
 * Modular route definitions for better maintainability
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { RequireAdmin } from "@/components/RequireAdmin";
import { SuperAdminGuard } from "@/components/admin/SuperAdminGuard";
import { TierGate } from "@/components/TierGate";

// Eager-loaded core pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("@/pages/Landing"));
const Bootstrap = lazy(() => import("@/pages/Bootstrap"));
const SetupWizard = lazy(() => import("@/pages/SetupWizard"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));

// CRM Core
const Constituents = lazy(() => import("@/pages/Constituents"));
const ContactDetail = lazy(() => import("@/pages/ContactDetail"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JobDetail = lazy(() => import("@/pages/JobDetail"));
const Donations = lazy(() => import("@/pages/Donations"));
const DonationCampaigns = lazy(() => import("@/pages/DonationCampaigns"));
const MajorGifts = lazy(() => import("@/pages/MajorGifts"));
const UpgradePage = lazy(() => import("@/pages/UpgradePage"));
const Pledges = lazy(() => import("@/pages/Pledges"));
const ContentRepository = lazy(() => import("@/pages/ContentRepository"));

// Pipeline & Dashboards
const PipelineDashboard = lazy(() => import("@/pages/PipelineDashboard"));
const RetentionDashboard = lazy(() => import("@/pages/RetentionDashboard"));
const ComplianceDashboard = lazy(() => import("@/pages/ComplianceDashboard"));
const ArchivedOpportunities = lazy(() => import("@/pages/ArchivedOpportunities"));

// Tasks & Work
const Tasks = lazy(() => import("@/pages/Tasks"));
const MyTasks = lazy(() => import("@/pages/MyTasks"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));

// Projects (Boards)
const BoardsHub = lazy(() => import("@/pages/BoardsHub"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const BoardCalendarView = lazy(() => import("@/pages/BoardCalendarView"));
const BoardDashboard = lazy(() => import("@/pages/BoardDashboard"));
const BoardTemplatesPage = lazy(() => import("@/pages/BoardTemplatesPage"));

// Voice Notes
const VoiceNotesHub = lazy(() => import("@/pages/VoiceNotesHub"));
const VoiceRecorder = lazy(() => import("@/pages/VoiceRecorder"));
const VoiceNextSteps = lazy(() => import("@/pages/VoiceNextSteps"));

// Email & Marketing
const CampaignsDashboard = lazy(() => import("@/pages/CampaignsDashboard"));
const CampaignComposer = lazy(() => import("@/pages/CampaignComposer"));
const EmailMarketingDashboard = lazy(() => import("@/pages/EmailMarketingDashboard"));
const EmailTemplates = lazy(() => import("@/pages/EmailTemplates"));
const EmailCampaigns = lazy(() => import("@/pages/EmailCampaigns"));
const EmailCampaignBuilder = lazy(() => import("@/pages/EmailCampaignBuilder"));
const EmailTemplateLibrary = lazy(() => import("@/pages/EmailTemplateLibrary"));
const EmailSettingsPage = lazy(() => import("@/pages/EmailSettingsPage"));
const EmailLogPage = lazy(() => import("@/pages/EmailLogPage"));
const EmailTaskSuggestionsPage = lazy(() => import("@/pages/EmailTaskSuggestionsPage"));

// Events & Programs
const EventsPage = lazy(() => import("@/pages/EventsPage"));
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage"));
const MissionImpact = lazy(() => import("@/pages/MissionImpact"));
const VolunteerEvents = lazy(() => import("@/pages/VolunteerEvents"));
const PublicEventRegistration = lazy(() => import("@/pages/PublicEventRegistration"));
const PublicProgramRegistration = lazy(() => import("@/pages/PublicProgramRegistration"));
const PublicVolunteerEvents = lazy(() => import("@/pages/public/PublicVolunteerEvents"));

// Finance
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const FinancialRunway = lazy(() => import("@/pages/FinancialRunway"));

// Donations (additional)
const RecurringDonations = lazy(() => import("@/pages/RecurringDonations"));
const PublicDonationPage = lazy(() => import("@/pages/PublicDonationPage"));
const DonationSuccess = lazy(() => import("@/pages/DonationSuccess"));
const StripeSettings = lazy(() => import("@/pages/StripeSettings"));
const MeetingTranscriptsPage = lazy(() => import("@/pages/MeetingTranscriptsPage"));
const SiteEdit = lazy(() => import("@/pages/SiteEdit"));

// Integrations
const Integrations = lazy(() => import("@/pages/Integrations"));
const SalesforceSettings = lazy(() => import("@/pages/SalesforceSettings"));
const SalesforceImportWizard = lazy(() => import("@/pages/SalesforceImportWizard"));
const QuickBooksCallback = lazy(() => import("@/pages/QuickBooksCallback"));
const QuickBooksSettings = lazy(() => import("@/pages/QuickBooksSettings"));
const QuickBooksIntegrationPage = lazy(() => import("@/pages/QuickBooksIntegrationPage"));
const GivebutterSettingsPage = lazy(() => import("@/pages/GivebutterSettingsPage"));
const NotionSettings = lazy(() => import("@/pages/NotionSettings"));
const LMSSettings = lazy(() => import("@/pages/LMSSettings"));
const GmailSettingsPage = lazy(() => import("@/pages/GmailSettingsPage"));
const GoogleCalendarSettingsPage = lazy(() => import("@/pages/GoogleCalendarSettingsPage"));
const CrelateSettings = lazy(() => import("@/pages/CrelateSettings"));

// Sites
const SitesHub = lazy(() => import("@/pages/SitesHub"));
const SiteDetail = lazy(() => import("@/pages/SiteDetail"));

// Placements
const Placements = lazy(() => import("@/pages/Placements"));

// Talent Pool
const TalentPool = lazy(() => import("@/pages/TalentPool"));
const PoolApplication = lazy(() => import("@/pages/PoolApplication"));
const PoolDashboard = lazy(() => import("@/pages/PoolDashboard"));
const InternApplication = lazy(() => import("@/pages/InternApplication"));

// Employee Feedback
const EmployeeFeedbackDashboard = lazy(() => import("@/pages/EmployeeFeedbackDashboard"));
const FeedbackForm = lazy(() => import("@/pages/FeedbackForm"));

// Settings & Help
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const HelpDocs = lazy(() => import("@/pages/HelpDocs"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const TechnicalDocs = lazy(() => import("@/pages/TechnicalDocs"));

// Admin
const Admin = lazy(() => import("@/pages/Admin"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminUserNew = lazy(() => import("@/pages/AdminUserNew"));
const AdminUserEdit = lazy(() => import("@/pages/AdminUserEdit"));
const AdminRoles = lazy(() => import("@/pages/AdminRoles"));
const AdminHelpPage = lazy(() => import("@/pages/AdminHelpPage"));
const AdminActivityLog = lazy(() => import("@/pages/AdminActivityLog"));

// Super Admin
const SaasCustomersPage = lazy(() => import("@/pages/admin/SaasCustomersPage"));
const SaasCustomerNewPage = lazy(() => import("@/pages/admin/SaasCustomerNewPage"));
const SaasCustomerDetailPage = lazy(() => import("@/pages/admin/SaasCustomerDetailPage"));
const SaasTemplatesPage = lazy(() => import("@/pages/admin/SaasTemplatesPage"));
const SchemaExportPage = lazy(() => import("@/pages/admin/SchemaExportPage"));
const SuperAdminAccessLogPage = lazy(() => import("@/pages/admin/SuperAdminAccessLogPage"));

// Legal
const TermsOfServicePage = lazy(() => import("@/pages/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));

// Misc
const CollaborationDemo = lazy(() => import("@/pages/CollaborationDemo"));
const PublicVolunteerOpportunities = lazy(
  () => import("@/pages/public/PublicVolunteerOpportunities")
);
const VolunteerSignUp = lazy(() => import("@/pages/public/VolunteerSignUp"));

// Route group types
type RouteGroup = {
  path: string;
  routes: RouteObject[];
};

// Core routes (always loaded)
export const coreRoutes: RouteObject[] = [
  { path: "/", element: <Index /> },
  { path: "/auth", element: <Auth /> },
  { path: "/landing", element: <Landing /> },
  { path: "/bootstrap", element: <Bootstrap /> },
  { path: "/setup", element: <SetupWizard /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/auth/accept-invitation", element: <AcceptInvitation /> },
];

// CRM routes
export const crmRoutes: RouteObject[] = [
  { path: "/constituents", element: <Constituents /> },
  { path: "/contacts/:id", element: <ContactDetail /> },
  {
    path: "/grants",
    element: (
      <TierGate feature="grants">
        <Jobs />
      </TierGate>
    ),
  },
  {
    path: "/jobs/:jobId",
    element: (
      <TierGate feature="grants">
        <JobDetail />
      </TierGate>
    ),
  },
  { path: "/donations", element: <Donations /> },
  { path: "/donations/campaigns", element: <DonationCampaigns /> },
  {
    path: "/major-gifts",
    element: (
      <TierGate feature="major_gifts">
        <MajorGifts />
      </TierGate>
    ),
  },
  { path: "/upgrade", element: <UpgradePage /> },
  { path: "/pledges", element: <Pledges /> },
  { path: "/content-repository", element: <ContentRepository /> },
  { path: "/mission-impact", element: <MissionImpact /> },
  { path: "/recurring-donations", element: <RecurringDonations /> },
  { path: "/donate/:slug", element: <PublicDonationPage /> },
  { path: "/donation-success", element: <DonationSuccess /> },
];

// Pipeline routes
export const pipelineRoutes: RouteObject[] = [
  { path: "/pipeline", element: <PipelineDashboard /> },
  {
    path: "/pipeline/archived",
    element: (
      <RequireAdmin>
        <ArchivedOpportunities />
      </RequireAdmin>
    ),
  },
  { path: "/retention", element: <RetentionDashboard /> },
  { path: "/compliance", element: <ComplianceDashboard /> },
];

// Task & Work routes
export const workRoutes: RouteObject[] = [
  { path: "/tasks", element: <Tasks /> },
  { path: "/my-tasks", element: <MyTasks /> },
  { path: "/calendar", element: <CalendarPage /> },
  { path: "/tasks/email-suggestions", element: <EmailTaskSuggestionsPage /> },
];

// Project routes
export const projectRoutes: RouteObject[] = [
  { path: "/projects", element: <BoardsHub /> },
  { path: "/projects/new", element: <BoardsHub /> },
  { path: "/projects/templates", element: <BoardTemplatesPage /> },
  { path: "/projects/:boardId", element: <KanbanBoard /> },
  { path: "/projects/:boardId/calendar", element: <BoardCalendarView /> },
  { path: "/projects/:boardId/dashboard", element: <BoardDashboard /> },
];

// Voice notes routes
export const voiceRoutes: RouteObject[] = [
  {
    path: "/voice-notes",
    element: (
      <TierGate feature="voice_notes">
        <VoiceNotesHub />
      </TierGate>
    ),
  },
  {
    path: "/voice-notes/record",
    element: (
      <TierGate feature="voice_notes">
        <VoiceRecorder />
      </TierGate>
    ),
  },
  {
    path: "/voice-notes/next-steps",
    element: (
      <TierGate feature="voice_notes">
        <VoiceNextSteps />
      </TierGate>
    ),
  },
];

// Email & Marketing routes
export const emailRoutes: RouteObject[] = [
  // Campaign module
  { path: "/campaigns", element: <CampaignsDashboard /> },
  { path: "/campaigns/new", element: <CampaignComposer /> },
  { path: "/campaigns/:id", element: <CampaignComposer /> },
  { path: "/email-marketing", element: <EmailMarketingDashboard /> },
  { path: "/email-marketing/templates", element: <EmailTemplateLibrary /> },
  { path: "/email-templates", element: <EmailTemplates /> },
  { path: "/settings/email-templates", element: <EmailTemplates /> },
  { path: "/email-campaigns", element: <EmailCampaigns /> },
  { path: "/settings/email", element: <EmailSettingsPage /> },
  { path: "/communications/email-log", element: <EmailLogPage /> },
];

// Integration routes
export const integrationRoutes: RouteObject[] = [
  { path: "/integrations", element: <Integrations /> },
  { path: "/settings/salesforce", element: <SalesforceSettings /> },
  { path: "/salesforce-import", element: <SalesforceImportWizard /> },
  { path: "/quickbooks/callback", element: <QuickBooksCallback /> },
  { path: "/quickbooks-settings", element: <QuickBooksSettings /> },
  { path: "/integrations/quickbooks", element: <QuickBooksIntegrationPage /> },
  { path: "/settings/givebutter", element: <GivebutterSettingsPage /> },
  { path: "/settings/notion", element: <NotionSettings /> },
  { path: "/lms-settings", element: <LMSSettings /> },
  { path: "/settings/gmail", element: <GmailSettingsPage /> },
  { path: "/settings/google-calendar", element: <GoogleCalendarSettingsPage /> },
  { path: "/integrations/crelate", element: <CrelateSettings /> },
  { path: "/settings/stripe", element: <StripeSettings /> },
  { path: "/meetings", element: <MeetingTranscriptsPage /> },
  { path: "/meetings/:transcriptId", element: <MeetingTranscriptsPage /> },
];

// Events routes
export const eventsRoutes: RouteObject[] = [
  { path: "/events", element: <EventsPage /> },
  { path: "/events/:id", element: <EventDetailPage /> },
  { path: "/volunteer-events", element: <PublicVolunteerEvents /> },
  { path: "/volunteer-events/admin", element: <VolunteerEvents /> },
  { path: "/register/event/:eventId", element: <PublicEventRegistration /> },
  { path: "/register/program/:offeringId", element: <PublicProgramRegistration /> },
  { path: "/volunteer/:slug", element: <VolunteerSignUp /> },
  { path: "/volunteer-opportunities/:boardId", element: <PublicVolunteerOpportunities /> },
];

// Finance routes
export const financeRoutes: RouteObject[] = [
  { path: "/payments", element: <PaymentsPage /> },
  { path: "/financial-runway", element: <FinancialRunway /> },
];

// Sites routes
export const sitesRoutes: RouteObject[] = [
  { path: "/sites", element: <SitesHub /> },
  { path: "/sites/:siteId", element: <SiteDetail /> },
  { path: "/sites/:siteId/edit", element: <SiteEdit /> },
  { path: "/placements", element: <Placements /> },
];

// Talent Pool routes
export const talentRoutes: RouteObject[] = [
  { path: "/talent-pool", element: <TalentPool /> },
  { path: "/pool-dashboard", element: <PoolDashboard /> },
  { path: "/apply", element: <PoolApplication /> },
  { path: "/apply/speaker", element: <PoolApplication defaultPoolType="speaker" /> },
  { path: "/apply/teacher", element: <PoolApplication defaultPoolType="teacher" /> },
  { path: "/apply/intern", element: <InternApplication /> },
];

// Feedback routes
export const feedbackRoutes: RouteObject[] = [
  { path: "/employee-feedback", element: <EmployeeFeedbackDashboard /> },
  { path: "/feedback/:type/:employeeId", element: <FeedbackForm /> },
];

// Settings & Help routes
export const settingsRoutes: RouteObject[] = [
  { path: "/settings/account", element: <AccountSettings /> },
  { path: "/help", element: <HelpDocs /> },
  { path: "/help/training", element: <HelpPage /> },
  { path: "/help/training/:articleSlug", element: <HelpPage /> },
  { path: "/technical-docs", element: <TechnicalDocs /> },
];

// Admin routes
export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <Admin />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <RequireAdmin>
        <AdminUsers />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/users/new",
    element: (
      <RequireAdmin>
        <AdminUserNew />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/users/:userId",
    element: (
      <RequireAdmin>
        <AdminUserEdit />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/users/:userId/edit",
    element: (
      <RequireAdmin>
        <AdminUserEdit />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/roles",
    element: (
      <RequireAdmin>
        <AdminRoles />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/help",
    element: (
      <RequireAdmin>
        <AdminHelpPage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/activity-log",
    element: (
      <RequireAdmin>
        <AdminActivityLog />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/support-access-log",
    element: (
      <RequireAdmin>
        <SuperAdminAccessLogPage />
      </RequireAdmin>
    ),
  },
];

// Super Admin routes
export const superAdminRoutes: RouteObject[] = [
  {
    path: "/admin/customers",
    element: (
      <SuperAdminGuard>
        <SaasCustomersPage />
      </SuperAdminGuard>
    ),
  },
  {
    path: "/admin/customers/new",
    element: (
      <SuperAdminGuard>
        <SaasCustomerNewPage />
      </SuperAdminGuard>
    ),
  },
  {
    path: "/admin/customers/:id",
    element: (
      <SuperAdminGuard>
        <SaasCustomerDetailPage />
      </SuperAdminGuard>
    ),
  },
  {
    path: "/admin/templates",
    element: (
      <SuperAdminGuard>
        <SaasTemplatesPage />
      </SuperAdminGuard>
    ),
  },
  {
    path: "/admin/schema-export",
    element: (
      <SuperAdminGuard>
        <SchemaExportPage />
      </SuperAdminGuard>
    ),
  },
];

// Legal routes
export const legalRoutes: RouteObject[] = [
  { path: "/legal/terms", element: <TermsOfServicePage /> },
  { path: "/legal/privacy", element: <PrivacyPolicyPage /> },
];

// Misc routes
export const miscRoutes: RouteObject[] = [
  { path: "/collaboration-demo", element: <CollaborationDemo /> },
];

// Fallback route
export const fallbackRoute: RouteObject = { path: "*", element: <NotFound /> };

// All routes combined
export const allRoutes: RouteObject[] = [
  ...coreRoutes,
  ...crmRoutes,
  ...pipelineRoutes,
  ...workRoutes,
  ...projectRoutes,
  ...voiceRoutes,
  ...emailRoutes,
  ...integrationRoutes,
  ...eventsRoutes,
  ...financeRoutes,
  ...sitesRoutes,
  ...talentRoutes,
  ...feedbackRoutes,
  ...settingsRoutes,
  ...adminRoutes,
  ...superAdminRoutes,
  ...legalRoutes,
  ...miscRoutes,
  fallbackRoute,
];
