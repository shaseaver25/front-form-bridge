import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicyPage = () => {
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Notice</h1>
              <p className="text-sm text-muted-foreground mb-8">Last updated January 07, 2025</p>

              <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
                <section>
                  <p>
                    This Privacy Notice for AvidEdge Executive Search ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Visit our website at <a href="https://www.avidedgesearch.com/" className="text-primary hover:underline">https://www.avidedgesearch.com/</a>, or any website of ours that links to this Privacy Notice</li>
                    <li>Use Retained Technology Executive Search. AvidEdge specializes in conducting high-integrity, world-class Retained Technology Executive Searches.</li>
                    <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:carrie@avidedgesearch.com" className="text-primary hover:underline">carrie@avidedgesearch.com</a>.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Summary of Key Points</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</li>
                    <li><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</li>
                    <li><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</li>
                    <li><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</li>
                    <li><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</li>
                    <li><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information.</li>
                    <li><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</li>
                    <li><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a <a href="https://app.termly.io/notify/60a57389-1527-45be-8e40-97de70b144fe" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">data subject access request</a>, or by contacting us.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Table of Contents</h2>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li><a href="#infocollect" className="text-primary hover:underline">What Information Do We Collect?</a></li>
                    <li><a href="#infouse" className="text-primary hover:underline">How Do We Process Your Information?</a></li>
                    <li><a href="#legalbases" className="text-primary hover:underline">What Legal Bases Do We Rely On to Process Your Personal Information?</a></li>
                    <li><a href="#whoshare" className="text-primary hover:underline">When and With Whom Do We Share Your Personal Information?</a></li>
                    <li><a href="#cookies" className="text-primary hover:underline">Do We Use Cookies and Other Tracking Technologies?</a></li>
                    <li><a href="#sociallogins" className="text-primary hover:underline">How Do We Handle Your Social Logins?</a></li>
                    <li><a href="#inforetain" className="text-primary hover:underline">How Long Do We Keep Your Information?</a></li>
                    <li><a href="#infosafe" className="text-primary hover:underline">How Do We Keep Your Information Safe?</a></li>
                    <li><a href="#infominors" className="text-primary hover:underline">Do We Collect Information from Minors?</a></li>
                    <li><a href="#privacyrights" className="text-primary hover:underline">What Are Your Privacy Rights?</a></li>
                    <li><a href="#dnt" className="text-primary hover:underline">Controls for Do-Not-Track Features</a></li>
                    <li><a href="#uslaws" className="text-primary hover:underline">Do United States Residents Have Specific Privacy Rights?</a></li>
                    <li><a href="#policyupdates" className="text-primary hover:underline">Do We Make Updates to This Notice?</a></li>
                    <li><a href="#contact" className="text-primary hover:underline">How Can You Contact Us About This Notice?</a></li>
                    <li><a href="#request" className="text-primary hover:underline">How Can You Review, Update, or Delete the Data We Collect from You?</a></li>
                  </ol>
                </section>

                <section id="infocollect">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. What Information Do We Collect?</h2>
                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Personal information you disclose to us</h3>
                  <p><em>In Short: We collect personal information that you provide to us.</em></p>
                  <p className="mt-2">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
                  <p className="mt-2"><strong>Personal Information Provided by You.</strong> The personal information we collect may include:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Names</li>
                    <li>Phone numbers</li>
                    <li>Email addresses</li>
                    <li>Mailing addresses</li>
                    <li>Job titles</li>
                    <li>Debit/credit card numbers</li>
                    <li>Billing addresses</li>
                  </ul>
                  <p className="mt-2"><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
                  <p className="mt-2"><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details. If you choose to register in this way, we will collect certain profile information about you from the social media provider.</p>
                  <p className="mt-2">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>
                </section>

                <section id="infouse">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. How Do We Process Your Information?</h2>
                  <p><em>In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></p>
                  <p className="mt-2">We process your personal information for a variety of reasons, including:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>To facilitate account creation and authentication</strong> and otherwise manage user accounts.</li>
                    <li><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</li>
                    <li><strong>To send you marketing and promotional communications.</strong> You can opt out of our marketing emails at any time.</li>
                    <li><strong>To deliver targeted advertising to you.</strong> We may process your information to develop and display personalized content and advertising.</li>
                    <li><strong>To protect our Services.</strong> Including fraud monitoring and prevention.</li>
                    <li><strong>To identify usage trends.</strong> To better understand how our Services are being used.</li>
                    <li><strong>To determine the effectiveness of our marketing and promotional campaigns.</strong></li>
                    <li><strong>To save or protect an individual's vital interest.</strong></li>
                  </ul>
                </section>

                <section id="legalbases">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. What Legal Bases Do We Rely On to Process Your Information?</h2>
                  <p><em>In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law.</em></p>
                  <p className="mt-2"><em>If you are located in the EU or UK, this section applies to you.</em></p>
                  <p className="mt-2">We may rely on the following legal bases to process your personal information:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Consent.</strong> We may process your information if you have given us permission to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
                    <li><strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably necessary to achieve our legitimate business interests.</li>
                    <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations.</li>
                    <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party.</li>
                  </ul>
                  <p className="mt-4"><em>If you are located in Canada, this section applies to you.</em></p>
                  <p className="mt-2">We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.</p>
                </section>

                <section id="whoshare">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. When and With Whom Do We Share Your Personal Information?</h2>
                  <p><em>In Short: We may share information in specific situations described in this section and/or with the following third parties.</em></p>
                  <p className="mt-2">We may need to share your personal information in the following situations:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                  </ul>
                </section>

                <section id="cookies">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Do We Use Cookies and Other Tracking Technologies?</h2>
                  <p><em>In Short: We may use cookies and other tracking technologies to collect and store your information.</em></p>
                  <p className="mt-2">We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</p>
                  <p className="mt-2">We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders.</p>
                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Google Analytics</h3>
                  <p>We may share your information with Google Analytics to track and analyze the use of the Services. To opt out of being tracked by Google Analytics, visit <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a>.</p>
                </section>

                <section id="sociallogins">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. How Do We Handle Your Social Logins?</h2>
                  <p><em>In Short: If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em></p>
                  <p className="mt-2">Our Services offer you the ability to register and log in using your third-party social media account details. Where you choose to do this, we will receive certain profile information about you from your social media provider. We will use the information we receive only for the purposes described in this Privacy Notice.</p>
                </section>

                <section id="inforetain">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. How Long Do We Keep Your Information?</h2>
                  <p><em>In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></p>
                  <p className="mt-2">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law. No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</p>
                </section>

                <section id="infosafe">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. How Do We Keep Your Information Safe?</h2>
                  <p><em>In Short: We aim to protect your personal information through a system of organizational and technical security measures.</em></p>
                  <p className="mt-2">We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure. You should only access the Services within a secure environment.</p>
                </section>

                <section id="infominors">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Do We Collect Information from Minors?</h2>
                  <p><em>In Short: We do not knowingly collect data from or market to children under 18 years of age.</em></p>
                  <p className="mt-2">We do not knowingly collect, solicit data from, or market to children under 18 years of age. By using the Services, you represent that you are at least 18. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:carrie@avidedgesearch.com" className="text-primary hover:underline">carrie@avidedgesearch.com</a>.</p>
                </section>

                <section id="privacyrights">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. What Are Your Privacy Rights?</h2>
                  <p><em>In Short: Depending on your state of residence in the US or in some regions, such as the EEA, UK, Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information.</em></p>
                  <p className="mt-2">In some regions, you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making.</p>
                  <p className="mt-2"><strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time by contacting us.</p>
                  <p className="mt-2"><strong>Opting out of marketing and promotional communications:</strong> You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, or by contacting us.</p>
                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Account Information</h3>
                  <p>If you would at any time like to review or change the information in your account or terminate your account, you can contact us using the contact information provided. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases.</p>
                  <p className="mt-2">If you have questions or comments about your privacy rights, you may email us at <a href="mailto:carrie@avidedgesearch.com" className="text-primary hover:underline">carrie@avidedgesearch.com</a>.</p>
                </section>

                <section id="dnt">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">11. Controls for Do-Not-Track Features</h2>
                  <p>Most web browsers and some mobile operating systems include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.</p>
                </section>

                <section id="uslaws">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">12. Do United States Residents Have Specific Privacy Rights?</h2>
                  <p><em>In Short: If you are a resident of Minnesota, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information.</em></p>
                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Your Rights</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Right to know</strong> whether or not we are processing your personal data</li>
                    <li><strong>Right to access</strong> your personal data</li>
                    <li><strong>Right to correct</strong> inaccuracies in your personal data</li>
                    <li><strong>Right to request</strong> the deletion of your personal data</li>
                    <li><strong>Right to obtain a copy</strong> of the personal data you previously shared with us</li>
                    <li><strong>Right to non-discrimination</strong> for exercising your rights</li>
                    <li><strong>Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</li>
                  </ul>
                  <h3 className="text-lg font-medium text-foreground mt-4 mb-2">How to Exercise Your Rights</h3>
                  <p>To exercise these rights, you can contact us by submitting a <a href="https://app.termly.io/notify/60a57389-1527-45be-8e40-97de70b144fe" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">data subject access request</a>, by emailing us at <a href="mailto:carrie@avidedgesearch.com" className="text-primary hover:underline">carrie@avidedgesearch.com</a>, or by referring to the contact details at the bottom of this document.</p>
                </section>

                <section id="policyupdates">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">13. Do We Make Updates to This Notice?</h2>
                  <p><em>In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></p>
                  <p className="mt-2">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</p>
                </section>

                <section id="contact">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">14. How Can You Contact Us About This Notice?</h2>
                  <p>If you have questions or comments about this notice, you may email us at <a href="mailto:carrie@avidedgesearch.com" className="text-primary hover:underline">carrie@avidedgesearch.com</a> or contact us by post at:</p>
                  <ul className="list-none mt-2 space-y-1">
                    <li><strong>AvidEdge Executive Search</strong></li>
                    <li>708 N 1st Street</li>
                    <li>Suite 244</li>
                    <li>Minneapolis, MN 55401</li>
                    <li>United States</li>
                  </ul>
                </section>

                <section id="request">
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">15. How Can You Review, Update, or Delete the Data We Collect from You?</h2>
                  <p>Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. To request to review, update, or delete your personal information, please fill out and submit a <a href="https://app.termly.io/notify/60a57389-1527-45be-8e40-97de70b144fe" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">data subject access request</a>.</p>
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

export default PrivacyPolicyPage;
