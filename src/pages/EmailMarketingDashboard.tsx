import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, FileText, BarChart3, Settings } from "lucide-react";

const EmailMarketingDashboard = () => {
  const features = [
    { icon: Send, title: "Email Campaigns", description: "Create and send targeted email campaigns to your contacts" },
    { icon: FileText, title: "Email Templates", description: "Design reusable templates for consistent outreach" },
    { icon: BarChart3, title: "Campaign Analytics", description: "Track open rates, click rates, and engagement metrics" },
    { icon: Settings, title: "Email Settings", description: "Configure sender details, signatures, and preferences" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Email Outreach</h1>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Email integration will be connected here for outreach campaigns and communications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Service Integration
            </CardTitle>
            <CardDescription>
              An email service will be connected to enable campaign sending, tracking, and automation.
              Once configured, you'll be able to manage all outreach from this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-lg border p-4 bg-muted/30"
                >
                  <feature.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmailMarketingDashboard;
