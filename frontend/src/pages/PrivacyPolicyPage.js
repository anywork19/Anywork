import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, User, Briefcase, Activity, MessageSquare, CreditCard, Database, Scale, Share2, Clock, Lock, UserCheck, FileText, Cookie, RefreshCw, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="container-app max-w-4xl">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-[#0052CC]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-3">Privacy Policy</h1>
          <p className="text-[#64748B]">
            <strong>Effective Date:</strong> 03/03/2026
          </p>
          <p className="text-[#64748B]">
            <strong>Website:</strong> www.anywork.co.uk
          </p>
        </div>

        {/* Content */}
        <div className="card-base p-8 space-y-10">
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">1. Who We Are</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                AnyWork is an online digital marketplace platform connecting Customers and independent Workers for local services.
              </p>
              <p className="text-[#64748B] leading-relaxed mb-4">
                For the purposes of UK data protection law, AnyWork acts as a <strong>Data Controller</strong> in relation to personal data collected through the platform.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-[#64748B] mb-2">If you have any questions regarding this Privacy Policy, you may contact us at:</p>
                <a href="mailto:support@anywork.co.uk" className="inline-flex items-center gap-2 text-[#0052CC] hover:underline font-medium">
                  <Mail className="h-4 w-4" />
                  support@anywork.co.uk
                </a>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">2. Information We Collect</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                We may collect the following categories of personal data:
              </p>
              
              {/* Account Information */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-600" />
                  Account Information
                </h3>
                <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Postcode/location</li>
                  <li>Profile information</li>
                </ul>
              </div>

              {/* Worker Information */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-600" />
                  Worker Information
                </h3>
                <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                  <li>Skills and service details</li>
                  <li>Qualifications (if provided)</li>
                  <li>Public profile content</li>
                </ul>
              </div>

              {/* Usage Information */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-600" />
                  Usage Information
                </h3>
                <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                  <li>IP address</li>
                  <li>Device information</li>
                  <li>Browser type</li>
                  <li>Log data</li>
                  <li>Pages visited</li>
                </ul>
              </div>

              {/* Communications */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-600" />
                  Communications
                </h3>
                <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                  <li>Messages exchanged through the platform</li>
                  <li>Customer support communications</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">3. What We Do NOT Collect</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">AnyWork does not:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Process payments</li>
                <li>Store bank details</li>
                <li>Store card details</li>
                <li>Act as escrow</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  Payments are arranged directly between Customers and Workers outside of the platform. 
                  AnyWork is not responsible for payment data shared directly between users.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">4. How We Use Your Data</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">We process personal data to:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Create and manage user accounts</li>
                <li>Connect Customers and Workers</li>
                <li>Provide messaging functionality</li>
                <li>Improve platform performance</li>
                <li>Prevent fraud and misuse</li>
                <li>Comply with legal obligations</li>
              </ul>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-medium">We do not sell personal data.</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scale className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">5. Legal Basis for Processing (UK GDPR)</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">We process personal data based on:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-2 ml-4">
                <li><strong>Contractual necessity</strong> (to provide platform services)</li>
                <li><strong>Legitimate interests</strong> (platform improvement, fraud prevention)</li>
                <li><strong>Legal obligations</strong></li>
                <li><strong>Consent</strong> (for marketing communications, if applicable)</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Share2 className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">6. Data Sharing</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">We may share limited data with:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>IT service providers</li>
                <li>Hosting providers</li>
                <li>Analytics providers</li>
                <li>Legal authorities where required by law</li>
              </ul>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-[#64748B] font-medium">We do not sell or rent user data to third parties.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">7. Data Retention</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">We retain personal data only for as long as necessary to:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Maintain your account</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce agreements</li>
              </ul>
              <p className="text-[#64748B] leading-relaxed">
                Inactive accounts may be deleted after a reasonable period.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">8. Data Security</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                We implement reasonable technical and organisational measures to protect personal data.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-700 text-sm">
                  However, no internet transmission is completely secure. Users share information at their own risk.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-violet-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">9. User Responsibilities</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">Users are responsible for:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Protecting their login credentials</li>
                <li>Exercising caution when sharing personal or payment information with other users</li>
                <li>Verifying identity before engaging in services</li>
              </ul>
              <p className="text-[#64748B] leading-relaxed">
                AnyWork is not responsible for personal data shared voluntarily outside the platform.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">10. Your Rights Under UK GDPR</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">You have the right to:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[#0F172A] text-sm font-medium">Access your personal data</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[#0F172A] text-sm font-medium">Request correction</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[#0F172A] text-sm font-medium">Request deletion</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[#0F172A] text-sm font-medium">Object to processing</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[#0F172A] text-sm font-medium">Restrict processing</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[#0F172A] text-sm font-medium">Withdraw consent</p>
                </div>
              </div>
              <p className="text-[#64748B] leading-relaxed mb-4">
                Lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-[#64748B] mb-2">To exercise your rights, contact:</p>
                <a href="mailto:support@anywork.co.uk" className="inline-flex items-center gap-2 text-[#0052CC] hover:underline font-medium">
                  <Mail className="h-4 w-4" />
                  support@anywork.co.uk
                </a>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">11. Cookies</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed">
                Our use of cookies is explained in our separate{' '}
                <Link to="/cookie-policy" className="text-[#0052CC] hover:underline font-medium">
                  Cookie Policy
                </Link>.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">12. Changes to This Policy</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-2">
                We may update this Privacy Policy from time to time.
              </p>
              <p className="text-[#64748B] leading-relaxed">
                The latest version will always be published on this page with the updated effective date.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#64748B] mb-4">Related Policies</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/terms" className="text-[#0052CC] hover:underline text-sm">Terms & Conditions</Link>
            <Link to="/cookie-policy" className="text-[#0052CC] hover:underline text-sm">Cookie Policy</Link>
            <Link to="/trust-safety" className="text-[#0052CC] hover:underline text-sm">Trust & Safety</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
