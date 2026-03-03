import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building2, Phone, Globe, GraduationCap } from "lucide-react";
import type { Site } from "@/types/sites";

const relationshipStatusColors: Record<string, string> = {
  prospect: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_conversation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pilot: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  active_partner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const siteTypeLabels: Record<string, string> = {
  school: "School",
  district: "District",
  organization: "Organization",
  partner: "Partner",
  community_center: "Community Center",
  partner_location: "Partner Location",
  field_office: "Field Office",
  other: "Other",
};

interface SiteCardProps {
  site: Site & {
    primary_contact?: { id: string; first_name: string; last_name: string; email: string } | null;
    district?: { id: string; name: string } | null;
    site_contacts?: { count: number }[];
    site_activities?: { count: number }[];
  };
  compact?: boolean;
}

export function SiteCard({ site, compact = false }: SiteCardProps) {
  const navigate = useNavigate();

  const contactCount = site.site_contacts?.[0]?.count ?? 0;
  const activityCount = site.site_activities?.[0]?.count ?? 0;

  if (compact) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
        onClick={() => navigate(`/sites/${site.id}`)}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm line-clamp-1">{site.name}</h4>
              {site.organization_type && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {siteTypeLabels[site.organization_type] || site.organization_type}
                </Badge>
              )}
            </div>
            
            {(site.address_city || site.city) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {site.address_city || site.city}, {site.address_state || site.state}
              </p>
            )}

            {site.enrollment && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {site.enrollment.toLocaleString()} students
              </p>
            )}

            {site.primary_contact && (
              <p className="text-xs text-muted-foreground truncate">
                Contact: {site.primary_contact.first_name} {site.primary_contact.last_name}
              </p>
            )}

            <div className="flex gap-2 text-xs text-muted-foreground">
              {contactCount > 0 && <span>{contactCount} contacts</span>}
              {activityCount > 0 && <span>• {activityCount} activities</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
      onClick={() => navigate(`/sites/${site.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{site.name}</CardTitle>
            {(site.address_city || site.city) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {site.address_city || site.city}, {site.address_state || site.state}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            <Badge className={relationshipStatusColors[site.relationship_status || "prospect"]}>
              {(site.relationship_status || "prospect").replace(/_/g, " ")}
            </Badge>
            {site.site_type && (
              <Badge variant="outline" className="text-xs">
                {siteTypeLabels[site.site_type]}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {site.enrollment && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              {site.enrollment.toLocaleString()} students
            </div>
          )}
          {site.grade_levels && site.grade_levels.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              Grades: {site.grade_levels.join(", ")}
            </div>
          )}
          {site.phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {site.phone}
            </div>
          )}
          {site.website && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Globe className="h-4 w-4" />
              Website
            </div>
          )}
        </div>

        {site.district && (
          <p className="text-sm text-muted-foreground">
            <Building2 className="h-3 w-3 inline mr-1" />
            District: {site.district.name}
          </p>
        )}

        {site.primary_contact && (
          <p className="text-sm">
            <span className="text-muted-foreground">Contact:</span>{" "}
            {site.primary_contact.first_name} {site.primary_contact.last_name}
          </p>
        )}

        {site.tags && site.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {site.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {site.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{site.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
