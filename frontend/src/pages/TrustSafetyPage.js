import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Star, Clock, Flag, AlertTriangle, Users, Lock, Phone, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero */}
      <section className="bg-white py-16">
        <div className="container-app text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#0052CC]/10 flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-[#0052CC]" />
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-4">Trust & Safety</h1>
          <p className="text-xl text-[#64748B] max-w-2xl mx-auto">
            Your safety is our top priority. Learn how we keep the AnyWork community secure.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-app max-w-4xl">
          <div className="space-y-12">
            {/* ID Verification */}
            <div className="card-base p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0052CC]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-[#0052CC]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-3">ID Verification</h2>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    Helpers can verify their identity by uploading a government-issued ID. 
                    Once verified, they receive a blue "Verified" badge on their profile.
                  </p>
                  <ul className="space-y-2 text-[#64748B]">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981]" />
                      Photo ID checked against profile picture
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981]" />
                      Name and details verified
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981]" />
                      Look for the blue badge when booking
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="card-base p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-8 w-8 text-[#10B981]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Insurance Status</h2>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    Many helpers carry their own public liability insurance. 
                    Helpers can upload proof of insurance to receive an "Insured" badge.
                  </p>
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-900">
                        Insurance is optional and not all helpers are insured. 
                        Always check the profile before booking if insurance is important to you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews & Ratings */}
            <div className="card-base p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                  <Star className="h-8 w-8 text-[#F59E0B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Reviews & Ratings</h2>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    Our two-way review system ensures accountability. After each completed job, 
                    both customers and helpers can leave honest reviews.
                  </p>
                  <ul className="space-y-2 text-[#64748B]">
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#F59E0B]" />
                      5-star rating system
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#F59E0B]" />
                      Written reviews for detailed feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#F59E0B]" />
                      Reviews from verified bookings only
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="card-base p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FF5A5F]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-8 w-8 text-[#FF5A5F]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Reliability Score</h2>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    Each helper has a reliability score based on their track record. 
                    This takes into account job completion rate, punctuality, and cancellations.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <p className="text-2xl font-bold text-[#10B981]">95%+</p>
                      <p className="text-sm text-[#64748B]">Excellent</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <p className="text-2xl font-bold text-[#F59E0B]">80-94%</p>
                      <p className="text-sm text-[#64748B]">Good</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <p className="text-2xl font-bold text-[#EF4444]">&lt;80%</p>
                      <p className="text-sm text-[#64748B]">Needs Work</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting */}
            <div className="card-base p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Flag className="h-8 w-8 text-[#64748B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Report a User</h2>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    If you experience any issues, you can report a user directly from their profile. 
                    Our team reviews all reports and takes appropriate action.
                  </p>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    Reasons you might report a user:
                  </p>
                  <ul className="space-y-2 text-[#64748B]">
                    <li className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Inappropriate behaviour
                    </li>
                    <li className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Misleading profile information
                    </li>
                    <li className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      No-show without notice
                    </li>
                    <li className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Safety concerns
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Secure Payments */}
            <div className="card-base p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0052CC]/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-8 w-8 text-[#0052CC]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Secure Payments</h2>
                  <p className="text-[#64748B] leading-relaxed mb-4">
                    All payments are processed securely through Stripe. Your payment details 
                    are never stored on our servers.
                  </p>
                  <ul className="space-y-2 text-[#64748B]">
                    <li className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#10B981]" />
                      256-bit SSL encryption
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#10B981]" />
                      PCI DSS compliant
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#10B981]" />
                      Funds held until job completed
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Marketplace Disclaimer */}
            <div className="card-base p-8 bg-blue-50 border-blue-100">
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-[#0052CC] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">Marketplace Information</h3>
                  <p className="text-[#64748B] leading-relaxed">
                    AnyWork is a marketplace that connects people who need help with independent 
                    individuals who can help. Helpers on our platform are not employees of AnyWork. 
                    We provide tools for verification and reviews, but we encourage all users to 
                    review profiles carefully and communicate clearly before booking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Need Help?</h3>
            <p className="text-[#64748B] mb-6">
              If you have safety concerns or need assistance, our support team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" className="rounded-full">
                <Mail className="h-4 w-4 mr-2" />
                support@anywork.co.uk
              </Button>
              <Button variant="outline" className="rounded-full">
                <Phone className="h-4 w-4 mr-2" />
                0800 123 4567
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
