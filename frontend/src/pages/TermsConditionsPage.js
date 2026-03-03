import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Users, CreditCard, Shield, AlertTriangle, Scale, UserX, Ban, Building, Gavel, Mail } from 'lucide-react';

export default function TermsConditionsPage() {
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
            <FileText className="h-8 w-8 text-[#0052CC]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-3">Terms & Conditions</h1>
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
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">1. About AnyWork</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                AnyWork is an online digital marketplace platform that connects individuals and businesses ("Customers") with independent service providers ("Workers").
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-amber-800 font-medium">Important:</p>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                  <li>AnyWork does not provide services and does not process payments.</li>
                  <li>AnyWork acts solely as a technology platform enabling users to connect and arrange services independently.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">2. No Employment or Agency Relationship</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                <strong>Workers are independent contractors.</strong>
              </p>
              <p className="text-[#64748B] leading-relaxed mb-3">Nothing in these Terms creates:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Employment</li>
                <li>Worker status</li>
                <li>Partnership</li>
                <li>Agency</li>
              </ul>
              <p className="text-[#64748B] leading-relaxed mb-1">between AnyWork and any Worker.</p>
              <p className="text-[#64748B] leading-relaxed mt-4 mb-3">Workers are fully responsible for:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4">
                <li>Taxes</li>
                <li>National Insurance</li>
                <li>Insurance coverage</li>
                <li>Legal compliance</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">3. No Payment Processing</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">AnyWork does not:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Process payments</li>
                <li>Hold funds</li>
                <li>Provide escrow services</li>
                <li>Guarantee payments</li>
              </ul>
              <p className="text-[#64748B] leading-relaxed mb-4">
                All payments are arranged directly between Customer and Worker using methods agreed between them.
              </p>
              <p className="text-[#64748B] leading-relaxed mb-3">AnyWork is not responsible for:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Non-payment</li>
                <li>Delayed payment</li>
                <li>Fraudulent transfers</li>
                <li>Incorrect bank details</li>
                <li>Chargebacks</li>
                <li>Cash disputes</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">Users transact entirely at their own risk.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">4. Platform Role & Disclaimer</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                <strong>AnyWork provides a digital platform only.</strong>
              </p>
              <p className="text-[#64748B] leading-relaxed mb-3">We:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Do not supervise services</li>
                <li>Do not control pricing</li>
                <li>Do not verify bank details</li>
                <li>Do not guarantee qualifications</li>
                <li>Do not guarantee service outcomes</li>
              </ul>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-[#64748B]">
                  Any contract for services is formed solely between the Customer and the Worker. 
                  <strong className="text-[#0F172A]"> AnyWork is not a party to that contract.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">5. Disputes Between Users</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">
                All disputes are strictly between Customer and Worker, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Quality of work</li>
                <li>Property damage</li>
                <li>Personal injury</li>
                <li>Payment disputes</li>
                <li>Fraud allegations</li>
              </ul>
              <p className="text-[#64748B] leading-relaxed">
                AnyWork may offer messaging tools but has no obligation to mediate, investigate, or resolve disputes.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scale className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">6. Limitation of Liability</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                To the fullest extent permitted under the laws of England and Wales:
              </p>
              <ul className="list-disc list-inside text-[#64748B] space-y-2 ml-4 mb-4">
                <li>AnyWork shall not be liable for any loss, damage, injury, claim, or expense arising from services arranged through the platform.</li>
                <li>AnyWork shall not be liable for fraud, theft, negligence, misconduct, or misrepresentation by any user.</li>
                <li>AnyWork shall not be liable for direct, indirect, incidental, consequential, or special damages.</li>
                <li><strong>AnyWork's total liability, if any, shall not exceed £100.</strong></li>
              </ul>
              <p className="text-[#64748B] leading-relaxed">
                Nothing in these Terms excludes liability where such exclusion is prohibited by law.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">7. Assumption of Risk</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">Users acknowledge that:</p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Services are arranged at their own discretion</li>
                <li>AnyWork does not screen or guarantee users</li>
                <li>Engaging in offline payment carries inherent risks</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">Users assume full responsibility for their decisions.</p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">8. Indemnity</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">
                Users agree to indemnify and hold harmless AnyWork, its directors, officers, and affiliates from any claims, losses, damages, legal fees, or liabilities arising from:
              </p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
                <li>Services arranged</li>
                <li>Payment disputes</li>
                <li>Injury or damage</li>
                <li>Breach of these Terms</li>
              </ul>
              <p className="text-[#64748B] leading-relaxed font-medium">
                This indemnity survives termination.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">9. Platform Fees</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-4">
                AnyWork currently does not charge platform fees.
              </p>
              <p className="text-[#64748B] leading-relaxed">
                AnyWork reserves the right to introduce fees, subscriptions, or commission in the future with notice.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">10. Account Suspension</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-3">
                AnyWork may suspend or terminate accounts at its sole discretion for:
              </p>
              <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4">
                <li>Fraud</li>
                <li>Misconduct</li>
                <li>Safety risks</li>
                <li>Repeated complaints</li>
                <li>Breach of these Terms</li>
              </ul>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">11. Intellectual Property</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed">
                All platform content and branding belong to AnyWork.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gavel className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">12. Governing Law</h2>
            </div>
            <div className="ml-14">
              <p className="text-[#64748B] leading-relaxed mb-2">
                These Terms are governed by the laws of England and Wales.
              </p>
              <p className="text-[#64748B] leading-relaxed">
                Courts of England and Wales have exclusive jurisdiction.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Contact Us</h2>
            <p className="text-[#64748B] leading-relaxed mb-4">
              If you have questions about these Terms & Conditions, contact:
            </p>
            <a 
              href="mailto:support@anywork.co.uk"
              className="inline-flex items-center gap-2 text-[#0052CC] hover:underline font-medium"
            >
              <Mail className="h-5 w-5" />
              support@anywork.co.uk
            </a>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#64748B] mb-4">Related Policies</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="text-[#0052CC] hover:underline text-sm">Privacy Policy</Link>
            <Link to="/cookie-policy" className="text-[#0052CC] hover:underline text-sm">Cookie Policy</Link>
            <Link to="/trust-safety" className="text-[#0052CC] hover:underline text-sm">Trust & Safety</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
