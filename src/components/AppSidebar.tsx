import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Link2,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Kanban,
  Mail,
  Settings,
  HelpCircle,
  LogOut,
  Mic,
  Building2,
  FolderOpen,
  ClipboardCheck,
  ShieldCheck,
  LayoutTemplate,
  Database,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBurndownAccess } from "@/hooks/useBurndownAccess";
import { useVoiceNotesAccess } from "@/hooks/useVoiceNotesAccess";
import { useBoardsAccess } from "@/hooks/useBoardsAccess";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useSubscription, TIER_ORDER } from "@/hooks/useSubscription";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  pro?: string;
  /** If set, the item is hidden when the subscription tier is below this level */
  tierRequired?: "professional" | "enterprise";
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Contacts", url: "/constituents", icon: Users },
  { title: "Companies", url: "/sites", icon: Building2 },
  { title: "Jobs", url: "/grants", icon: FileText, tierRequired: "professional" },
  { title: "Pipeline", url: "/pipeline", icon: TrendingUp },
  { title: "Recruiting", url: "/recruitment-pipeline", icon: Kanban },
  { title: "Placements", url: "/placements", icon: ClipboardCheck },
];

const workItems: NavItem[] = [
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Projects", url: "/projects", icon: Kanban, pro: "boards" },
  { title: "Tasks", url: "/tasks", icon: ClipboardCheck },
  {
    title: "Voice Notes",
    url: "/voice-notes",
    icon: Mic,
    pro: "voice",
    tierRequired: "professional",
  },
];

const outreachItems: NavItem[] = [
  { title: "Email Outreach", url: "/email-marketing", icon: Mail },
  { title: "Campaigns", url: "/campaigns", icon: Send },
  { title: "Content", url: "/content-repository", icon: FolderOpen },
];

const adminItems: NavItem[] = [
  { title: "Integrations", url: "/integrations", icon: Link2 },
  { title: "Admin", url: "/admin", icon: ShieldCheck },
  { title: "Support Log", url: "/admin/support-access-log", icon: ShieldCheck },
];


const superAdminItems: NavItem[] = [
  { title: "Customers", url: "/admin/customers", icon: Building2 },
  { title: "Templates", url: "/admin/templates", icon: LayoutTemplate },
  { title: "Schema Export", url: "/admin/schema-export", icon: Database },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasAccess: hasBurndownAccess, isLoading: loadingBurndown } = useBurndownAccess();
  const { hasAccess: hasVoiceNotesAccess, isLoading: loadingVoice } = useVoiceNotesAccess();
  const { hasAccess: hasBoardsAccess, isLoading: loadingBoards } = useBoardsAccess();
  const { isSuperAdmin, isLoading: loadingSuperAdmin } = useSuperAdmin();
  const { tier, isActive, isLoading: loadingTier } = useSubscription();

  const hasTierAccess = (required: "professional" | "enterprise") => {
    // Super admins always pass; also pass while loading to avoid nav flicker
    if (isSuperAdmin || loadingTier) return true;
    return isActive && TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(required);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const getProAccess = (pro?: string) => {
    if (!pro) return true;
    // While loading, assume access to avoid showing Pro badge prematurely
    if (pro === "burndown") return loadingBurndown || hasBurndownAccess;
    if (pro === "voice") return loadingVoice || hasVoiceNotesAccess;
    if (pro === "boards") return loadingBoards || hasBoardsAccess;
    return true;
  };

  const renderNavItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => {
        // Hide entirely if the subscription tier doesn't cover this item
        if (item.tierRequired && !hasTierAccess(item.tierRequired)) return null;
        const hasAccess = getProAccess(item.pro);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                end={item.url === "/"}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.pro && !hasAccess && (
                      <Badge
                        variant="secondary"
                        className="bg-[#FF6B35] text-white text-[10px] px-1.5 py-0"
                      >
                        Pro
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderNavItems(mainNavItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Work</SidebarGroupLabel>
          <SidebarGroupContent>{renderNavItems(workItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Outreach
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderNavItems(outreachItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Admin</SidebarGroupLabel>
          <SidebarGroupContent>{renderNavItems(adminItems)}</SidebarGroupContent>
        </SidebarGroup>

        {!loadingSuperAdmin && isSuperAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                TailoredU Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>{renderNavItems(superAdminItems)}</SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings/account"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50"
                activeClassName="bg-primary/10 text-primary"
              >
                <Settings className="w-4 h-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/help"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50"
                activeClassName="bg-primary/10 text-primary"
              >
                <HelpCircle className="w-4 h-4" />
                {!collapsed && <span>Help</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
