import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Shield, BarChart3, Settings, Megaphone, Clock, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function CookiePolicyPage() {
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
            <Cookie className="h-8 w-8 text-[#0052CC]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-3">Cookie Policy</h1>
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
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">1. What Are Cookies?</h2>
            <p className="text-[#64748B] leading-relaxed">
              Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit our website. 
              They help us improve your experience, understand how our platform is used, and ensure secure functionality.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">2. Who We Are</h2>
            <p className="text-[#64748B] leading-relaxed mb-4">
              AnyWork is a UK-based digital marketplace connecting Customers with independent Workers for local services.
            </p>
            <p className="text-[#64748B] leading-relaxed mb-3">We use cookies in accordance with:</p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4">
              <li>UK GDPR</li>
              <li>Data Protection Act 2018</li>
              <li>Privacy and Electronic Communications Regulations (PECR)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">3. Types of Cookies We Use</h2>
            
            {/* Essential Cookies */}
            <div className="bg-slate-50 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">1️⃣ Essential Cookies (Strictly Necessary)</h3>
                  <p className="text-[#64748B] text-sm mb-3">
                    These cookies are required for the platform to function properly.
                  </p>
                  <p className="text-[#64748B] text-sm mb-2">They enable:</p>
                  <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                    <li>Secure login</li>
                    <li>Account authentication</li>
                    <li>Booking functionality</li>
                    <li>Payment processing</li>
                    <li>Fraud prevention</li>
                  </ul>
                  <p className="text-sm text-amber-600 mt-3 font-medium">These cookies cannot be disabled.</p>
                </div>
              </div>
            </div>

            {/* Performance Cookies */}
            <div className="bg-slate-50 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">2️⃣ Performance & Analytics Cookies</h3>
                  <p className="text-[#64748B] text-sm mb-3">
                    These help us understand how users interact with the platform so we can improve it.
                  </p>
                  <p className="text-[#64748B] text-sm mb-2">They may collect:</p>
                  <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                    <li>Pages visited</li>
                    <li>Time spent on pages</li>
                    <li>Device type</li>
                    <li>General location (city-level, not exact address)</li>
                  </ul>
                  <p className="text-sm text-[#0052CC] mt-3 font-medium">These cookies are optional and require user consent.</p>
                </div>
              </div>
            </div>

            {/* Functionality Cookies */}
            <div className="bg-slate-50 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">3️⃣ Functionality Cookies</h3>
                  <p className="text-[#64748B] text-sm mb-3">
                    These remember user preferences such as:
                  </p>
                  <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                    <li>Saved location</li>
                    <li>Language settings</li>
                    <li>Previously viewed services</li>
                  </ul>
                  <p className="text-sm text-[#64748B] mt-3">These improve user experience but are not strictly required.</p>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">4️⃣ Marketing Cookies (If Used)</h3>
                  <p className="text-[#64748B] text-sm mb-3">
                    These may be used to:
                  </p>
                  <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1 ml-2">
                    <li>Deliver relevant advertisements</li>
                    <li>Measure campaign performance</li>
                    <li>Retarget users via platforms like Meta or Google</li>
                  </ul>
                  <p className="text-sm text-[#0052CC] mt-3 font-medium">Marketing cookies will only be used with explicit user consent.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">4. Third-Party Cookies</h2>
            <p className="text-[#64748B] leading-relaxed mb-3">
              We may allow trusted third-party service providers to place cookies on our website, including:
            </p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
              <li>Payment processors</li>
              <li>Analytics providers</li>
              <li>Identity verification providers</li>
            </ul>
            <p className="text-[#64748B] leading-relaxed">
              These third parties are responsible for their own privacy practices.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">5. How to Manage Cookies</h2>
            <p className="text-[#64748B] leading-relaxed mb-3">
              When you first visit AnyWork, you will see a cookie consent banner allowing you to:
            </p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
              <li>Accept all cookies</li>
              <li>Reject non-essential cookies</li>
              <li>Customise preferences</li>
            </ul>
            <p className="text-[#64748B] leading-relaxed mb-2">
              You can also control cookies through your browser settings.
            </p>
            <p className="text-amber-600 text-sm font-medium">
              Disabling certain cookies may affect platform functionality.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">6. How Long Cookies Last</h2>
            <div className="flex items-start gap-4 mb-4">
              <Clock className="h-5 w-5 text-[#64748B] flex-shrink-0 mt-1" />
              <div>
                <p className="text-[#64748B] leading-relaxed mb-3">Cookies may be:</p>
                <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-2">
                  <li><strong>Session Cookies</strong> – deleted when you close your browser</li>
                  <li><strong>Persistent Cookies</strong> – remain for a set period unless deleted</li>
                </ul>
                <p className="text-[#64748B] mt-3">Retention periods vary depending on purpose.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">7. Updates to This Policy</h2>
            <p className="text-[#64748B] leading-relaxed mb-3">
              We may update this Cookie Policy from time to time to reflect:
            </p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-4 mb-4">
              <li>Legal changes</li>
              <li>Platform updates</li>
              <li>New features</li>
            </ul>
            <p className="text-[#64748B] leading-relaxed">
              The updated version will always show the latest effective date.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">8. Contact Us</h2>
            <p className="text-[#64748B] leading-relaxed mb-4">
              If you have questions about our use of cookies, contact:
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
            <Link to="/terms" className="text-[#0052CC] hover:underline text-sm">Terms of Service</Link>
            <Link to="/trust-safety" className="text-[#0052CC] hover:underline text-sm">Trust & Safety</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
