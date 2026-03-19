import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary tracking-tight">
              <span className="text-primary">/</span>AvidEdge
            </span>
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
              <h1 className="text-3xl font-bold text-foreground mb-1">Terms of Service</h1>
              <p className="text-base text-muted-foreground mb-1">AvidEdge Technology Executive Search</p>
              <p className="text-sm text-muted-foreground mb-8">Effective Date: March 19, 2026 · Powered by TailoredU Platform</p>

              <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Agreement to Terms</h2>
                  <p>
                    These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and AvidEdge Technology Executive Search ("AvidEdge," "we," "us," or "our") governing your access to and use of the AvidEdge executive search platform (the "Platform"), our website, and related services. The Platform is built and operated on TailoredU, a proprietary technology platform developed and maintained by TailoredU LLC ("Platform Provider").
                  </p>
                  <p className="mt-2">
                    By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you may not access or use the Platform. These Terms apply to all users of the Platform, including AvidEdge staff, client contacts who access the client portal, candidates who interact with Platform-generated communications, and any third party granted access by AvidEdge.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Description of Services</h2>
                  <p>
                    AvidEdge provides retained executive search services for senior technology leadership positions, including Chief Information Officer placements. The Platform supports these services by providing:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Contact and company relationship management</li>
                    <li>Search pipeline tracking and candidate evaluation tools</li>
                    <li>AI-powered candidate assessment, email drafting, and semantic search features</li>
                    <li>Voice note recording with AI transcription</li>
                    <li>Calendar synchronization and meeting transcript integration</li>
                    <li>Client collaboration portals for search engagement visibility</li>
                    <li>Post-placement onboarding plan management</li>
                    <li>Email outreach and professional communication tools</li>
                  </ul>
                  <p className="mt-2">Feature availability may vary by subscription tier. AvidEdge reserves the right to modify, add, or discontinue features with reasonable notice.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. User Accounts and Access</h2>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">3.1 Account Registration</h3>
                  <p>Access to the Platform requires an authorized user account. Accounts are provisioned by AvidEdge for its team members and, where applicable, for authorized client contacts.</p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">3.2 Account Security</h3>
                  <p>You agree to notify AvidEdge immediately of any unauthorized use of your account or any security breach. AvidEdge is not liable for losses arising from unauthorized use of your account where you have failed to safeguard your credentials.</p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">3.3 Account Termination</h3>
                  <p>AvidEdge may suspend or terminate your access to the Platform at any time, with or without cause, upon reasonable notice. Upon termination, your right to access the Platform ceases immediately. Provisions of these Terms that by their nature should survive termination will remain in effect.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Acceptable Use</h2>
                  <p>You agree to use the Platform only for its intended professional purposes. You shall not:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Use the Platform for any unlawful purpose or in violation of any applicable law or regulation</li>
                    <li>Attempt to gain unauthorized access to any portion of the Platform, other accounts, computer systems, or networks connected to the Platform</li>
                    <li>Introduce viruses, malware, or other harmful code into the Platform</li>
                    <li>Scrape, data-mine, or use automated tools to extract data from the Platform beyond what is provided through authorized features</li>
                    <li>Use candidate or contact data obtained through the Platform for purposes outside the scope of your authorized engagement with AvidEdge</li>
                    <li>Share, resell, sublicense, or redistribute access to the Platform or its data without written authorization from AvidEdge</li>
                    <li>Reverse engineer, decompile, or disassemble any portion of the Platform</li>
                    <li>Use AI-generated outputs from the Platform to create misleading representations about candidates or clients</li>
                  </ul>
                  <p className="mt-2">Violation of these terms may result in immediate suspension or termination of your access.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Intellectual Property</h2>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">5.1 Platform Ownership</h3>
                  <p>The Platform, including its source code, architecture, design, user interface, AI models and prompts, automation workflows, database schemas, and all related documentation, is the proprietary intellectual property of TailoredU LLC. AvidEdge operates the Platform under a license agreement with TailoredU LLC. No ownership rights in the Platform technology are transferred to you or to AvidEdge through use of the Platform.</p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">5.2 AvidEdge Proprietary Content</h3>
                  <p>AvidEdge's proprietary methodologies, including the AvidEdge Discovery process, AvidEdge Match evaluation framework, and AvidEdge Onboarding 90-Day Plan methodology, are the intellectual property of AvidEdge Technology Executive Search. These processes are encoded within the Platform as custom configurations and workflows. AvidEdge retains all rights to its proprietary methods.</p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">5.3 Your Content</h3>
                  <p>You retain ownership of any content you provide to or create within the Platform, including documents, notes, evaluations, and communications ("User Content"). By providing User Content, you grant AvidEdge a limited, non-exclusive license to use, store, and process that content as necessary to provide the services described in these Terms.</p>

                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">5.4 AI-Generated Content</h3>
                  <p>Content generated by AI features within the Platform (such as candidate assessments, email drafts, and search summaries) is provided as a tool to assist professional judgment. AvidEdge does not claim ownership of AI-generated content. Users are responsible for reviewing, editing, and approving all AI-generated content before relying on it or sharing it externally.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Data Ownership and Portability</h2>
                  <p>AvidEdge maintains its candidate and client data within a dedicated, isolated database instance. AvidEdge's business data (contacts, companies, engagement records, notes, and related information) belongs to AvidEdge. Client organizations that access the Platform through a client portal retain ownership of any content they contribute (e.g., interview feedback, comments, uploaded documents).</p>
                  <p className="mt-2">Upon termination of AvidEdge's Platform subscription, AvidEdge may request a data export in a standard format (CSV or JSON). TailoredU LLC will provide such export within thirty (30) days of a written request, subject to the terms of the Platform Subscription Agreement.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. AI Features and Limitations</h2>
                  <p>The Platform incorporates AI-powered features using the Anthropic Claude API. Users should understand the following:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>AI is advisory, not determinative.</strong> AI-generated assessments, scores, recommendations, and drafts are intended to support human decision-making, not replace it.</li>
                    <li><strong>No guarantee of accuracy.</strong> AI outputs may contain errors, omissions, or biases. All AI-generated content should be reviewed by a qualified professional before use.</li>
                    <li><strong>No protected class reliance.</strong> AI features should not be used as the sole basis for employment decisions. AvidEdge is committed to fair and equitable search practices, and AI outputs are one input among many.</li>
                    <li><strong>Credit-based usage.</strong> AI features consume credits from your subscription plan. Credit allocation and overage rates are defined in your subscription tier. You will never be cut off mid-search; overages are billed at month-end.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Email Communications</h2>
                  <p>The Platform enables AvidEdge to send professional emails to candidates, clients, and contacts. All outbound emails include a clear unsubscribe mechanism in compliance with the CAN-SPAM Act. Recipients who unsubscribe are permanently opted out of future outreach emails from AvidEdge sent through the Platform.</p>
                  <p className="mt-2">Users of the Platform are responsible for ensuring that their use of email features complies with applicable laws, including CAN-SPAM, GDPR (where applicable), and any other relevant anti-spam or electronic communication regulations.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Third-Party Integrations</h2>
                  <p>The Platform integrates with third-party services to provide enhanced functionality. These may include:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Microsoft 365 or Google Workspace (calendar and email synchronization)</li>
                    <li>Fireflies.ai (meeting transcription)</li>
                    <li>Resend (email delivery)</li>
                    <li>LinkedIn and related professional data tools (via authorized third-party connectors)</li>
                  </ul>
                  <p className="mt-2">Your use of third-party integrations is subject to the respective third party's terms of service and privacy policies. AvidEdge is not responsible for the availability, accuracy, or practices of third-party services. OAuth authorization tokens and API credentials for integrations are managed securely within the Platform infrastructure. Users authenticate with their own credentials where required; AvidEdge does not store your third-party passwords.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Service Availability</h2>
                  <p>AvidEdge strives to maintain the Platform in a reliable and accessible state. However, the Platform is provided on an "as available" basis. We do not guarantee uninterrupted or error-free service. Scheduled maintenance, infrastructure updates, and unforeseen outages may temporarily affect availability. We will make commercially reasonable efforts to notify users in advance of planned downtime and to restore service promptly after unplanned interruptions.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">11. Limitation of Liability</h2>
                  <p className="uppercase">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>THE PLATFORM AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
                    <li>NEITHER AVIDEDGE NOR TAILOREDU LLC SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM.</li>
                    <li>AVIDEDGE'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO AVIDEDGE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</li>
                    <li>NEITHER AVIDEDGE NOR TAILOREDU LLC SHALL BE LIABLE FOR ANY DECISIONS MADE OR ACTIONS TAKEN IN RELIANCE ON AI-GENERATED CONTENT, CANDIDATE ASSESSMENTS, OR ANY OTHER OUTPUT OF THE PLATFORM'S AUTOMATED FEATURES.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">12. Indemnification</h2>
                  <p>You agree to indemnify and hold harmless AvidEdge, TailoredU LLC, and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney's fees) arising from your use of the Platform, your violation of these Terms, or your violation of any rights of a third party.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">13. Confidentiality</h2>
                  <p>Information exchanged through the Platform, including candidate data, client mandates, search strategies, compensation details, and assessment results, is confidential. Users agree not to disclose confidential information to unauthorized parties except as required by law or as necessary to fulfill the purposes of an authorized search engagement. Confidentiality obligations survive termination of your access to the Platform.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">14. Dispute Resolution</h2>
                  <p>Any dispute arising out of or relating to these Terms or the Platform shall first be addressed through good-faith negotiation between the parties. If the parties are unable to resolve the dispute within thirty (30) days, either party may pursue resolution through binding arbitration administered in Hennepin County, Minnesota, in accordance with the rules of the American Arbitration Association. Each party shall bear its own costs and attorney's fees, unless the arbitrator determines otherwise.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">15. Governing Law</h2>
                  <p>These Terms are governed by and construed in accordance with the laws of the State of Minnesota, United States, without regard to its conflict of law provisions. Any legal proceedings not subject to arbitration shall be brought exclusively in the state or federal courts located in Hennepin County, Minnesota.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">16. Changes to These Terms</h2>
                  <p>AvidEdge reserves the right to modify these Terms at any time. Material changes will be communicated via email or a notice within the Platform at least thirty (30) days before taking effect. Your continued use of the Platform after the effective date of any modification constitutes acceptance of the updated Terms.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">17. Severability</h2>
                  <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be modified to the minimum extent necessary to make it enforceable, or if modification is not possible, severed from these Terms. The remaining provisions shall continue in full force and effect.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">18. Entire Agreement</h2>
                  <p>These Terms, together with the Privacy Policy and any applicable Platform Subscription Agreement or Scope of Work between the parties, constitute the entire agreement between you and AvidEdge regarding your use of the Platform. These Terms supersede all prior agreements, representations, and understandings relating to the Platform.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">19. Contact Information</h2>
                  <p>For questions about these Terms or the Platform, contact:</p>
                  <ul className="list-none mt-2 space-y-1">
                    <li><strong>AvidEdge Technology Executive Search</strong></li>
                    <li>Email: <a href="mailto:legal@avidedgesearch.com" className="text-primary hover:underline">legal@avidedgesearch.com</a></li>
                  </ul>
                  <p className="mt-4">Platform Provider:</p>
                  <ul className="list-none mt-2 space-y-1">
                    <li><strong>TailoredU LLC</strong></li>
                    <li>Email: <a href="mailto:shannon@tailoredu.org" className="text-primary hover:underline">shannon@tailoredu.org</a></li>
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
            © {new Date().getFullYear()} AvidEdge Executive Search. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
            <Link to="/legal/privacy" className="text-sm text-primary hover:underline">Privacy Notice</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
