import { Link } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TermsOfServicePage = () => {
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
              <p className="text-sm text-muted-foreground mb-8">Last Updated: December 9, 2024</p>

              <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using TailoredU CRM ("the Service"), operated by createMPLS, you agree to be bound 
                    by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Description of Service</h2>
                  <p>
                    TailoredU CRM is a fundraising relationship management platform designed for nonprofit organizations. 
                    The Service provides tools for managing constituent relationships, grants, donations, pledges, and 
                    integrations with third-party services to support nonprofit operations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. User Responsibilities</h2>
                  <p>As a user of the Service, you agree to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Provide accurate and complete information when using the Service</li>
                    <li>Use the Service in compliance with all applicable laws and regulations</li>
                    <li>Not attempt to gain unauthorized access to any part of the Service</li>
                    <li>Not use the Service to store or transmit malicious code or content</li>
                    <li>Ensure that your use of constituent data complies with applicable privacy laws</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Data Handling</h2>
                  <p>
                    You retain ownership of all data you enter into the Service. We process your data solely to provide 
                    the Service and as described in our Privacy Policy. You are responsible for ensuring you have the 
                    right to enter and process any constituent data stored in the Service.
                  </p>
                  <p className="mt-2">
                    We implement industry-standard security measures to protect your data, including encryption in 
                    transit and at rest, role-based access controls, and regular security audits.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Third-Party Integrations</h2>
                  <p>
                    The Service may integrate with third-party services including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>QuickBooks Online</strong> - For accounting and financial data synchronization</li>
                    <li><strong>Mailchimp</strong> - For email marketing and subscriber management</li>
                    <li><strong>Salesforce</strong> - For constituent and program data import</li>
                  </ul>
                  <p className="mt-2">
                    Your use of these integrations is subject to the respective third-party terms of service. 
                    We are not responsible for the availability, accuracy, or practices of third-party services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Disclaimers</h2>
                  <p>
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
                    OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
                    PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p className="mt-2">
                    We do not warrant that the Service will be uninterrupted, secure, or error-free, or that defects 
                    will be corrected.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Limitation of Liability</h2>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, CREATEMPLS AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY 
                    INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
                    REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
                    INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify these Terms of Service at any time. We will notify users of any 
                    material changes by posting the updated terms on this page with a new "Last Updated" date. 
                    Your continued use of the Service after such changes constitutes acceptance of the new terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Governing Law</h2>
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of 
                    Minnesota, without regard to its conflict of law provisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Contact Information</h2>
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
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

export default TermsOfServicePage;
