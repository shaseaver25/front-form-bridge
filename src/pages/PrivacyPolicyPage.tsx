import { Link } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">TailoredU CRM</span>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-border">
            <CardContent className="p-8 md:p-12">
              <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground mb-8">Last Updated: December 9, 2024</p>

              <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
                <section>
                  <p>
                    createMPLS ("we", "our", or "us") operates TailoredU CRM. This Privacy Policy explains how we 
                    collect, use, disclose, and safeguard your information when you use our Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
                  
                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Account Information</h3>
                  <p>When you create an account, we collect:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Email address</li>
                    <li>Name</li>
                    <li>Organization information</li>
                    <li>Role and permissions settings</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Constituent Data</h3>
                  <p>
                    You may enter and store information about your organization's constituents, including names, 
                    contact information, giving history, and relationship data. You are responsible for ensuring 
                    you have proper consent to collect and process this information.
                  </p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Usage Data</h3>
                  <p>We automatically collect information about how you use the Service, including:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Pages visited and features used</li>
                    <li>Time spent on the Service</li>
                    <li>Error logs and performance data</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Provide, maintain, and improve the Service</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, and support messages</li>
                    <li>Respond to your comments, questions, and requests</li>
                    <li>Monitor and analyze usage patterns to improve user experience</li>
                    <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Third-Party Services</h2>
                  <p>
                    The Service integrates with third-party services that may collect and process your data 
                    according to their own privacy policies:
                  </p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">QuickBooks Online</h3>
                  <p>
                    When you connect QuickBooks, we sync financial data including donations, pledges, and 
                    accounting records. QuickBooks' privacy policy applies to data processed by their service.
                  </p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Mailchimp</h3>
                  <p>
                    When you connect Mailchimp, we sync subscriber information and email engagement data. 
                    Mailchimp's privacy policy applies to data processed by their service.
                  </p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Salesforce</h3>
                  <p>
                    When you connect Salesforce, we import constituent and program data. Salesforce's privacy 
                    policy applies to data processed by their service.
                  </p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Stripe (Future)</h3>
                  <p>
                    For payment processing, we may use Stripe. Stripe's privacy policy applies to payment 
                    data processed by their service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Data Security</h2>
                  <p>We implement appropriate security measures to protect your data, including:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                    <li>Role-based access controls</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Secure authentication with password hashing</li>
                    <li>Activity logging for audit purposes</li>
                  </ul>
                  <p className="mt-2">
                    However, no method of transmission over the Internet is 100% secure, and we cannot guarantee 
                    absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Data Retention</h2>
                  <p>
                    We retain your account information and constituent data for as long as your account is active 
                    or as needed to provide the Service. You may request deletion of your data at any time by 
                    contacting us.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Your Rights</h2>
                  <p>Depending on your location, you may have the right to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Access the personal information we hold about you</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Request deletion of your personal information</li>
                    <li>Object to or restrict certain processing activities</li>
                    <li>Export your data in a portable format</li>
                  </ul>
                  <p className="mt-2">
                    To exercise these rights, please contact us at the email address below.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Cookies and Tracking</h2>
                  <p>
                    We use cookies and similar technologies for session management and to remember your preferences. 
                    These are essential for the Service to function properly. We do not use cookies for advertising 
                    or cross-site tracking.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Children's Privacy</h2>
                  <p>
                    The Service is not intended for individuals under the age of 13. We do not knowingly collect 
                    personal information from children under 13. If we become aware that we have collected such 
                    information, we will take steps to delete it.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by 
                    posting the new Privacy Policy on this page with a new "Last Updated" date.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Contact Information</h2>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us:
                  </p>
                  <ul className="list-none mt-2 space-y-1">
                    <li><strong>Company:</strong> createMPLS / TailoredU CRM</li>
                    <li><strong>Location:</strong> Minneapolis, MN</li>
                    <li><strong>Email:</strong> <a href="mailto:shannon@tailoredu.org" className="text-primary hover:underline">shannon@tailoredu.org</a></li>
                  </ul>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-muted">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TailoredU CRM. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
            <Link to="/legal/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
