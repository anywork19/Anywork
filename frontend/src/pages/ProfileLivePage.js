import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function ProfileLivePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="card-base p-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-[#10B981]" />
          </div>

          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Your Profile is Live!</h1>
          <p className="text-[#64748B] mb-6">
            Congratulations! Your helper profile is now visible to customers in your area. 
            Start receiving job requests and build your reputation.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-[#0052CC] mb-2">What's Next?</h3>
            <ul className="space-y-2 text-sm text-[#0F172A]">
              <li>✓ Complete ID verification for a "Verified" badge</li>
              <li>✓ Add insurance details for an "Insured" badge</li>
              <li>✓ Respond quickly to messages to boost your ranking</li>
              <li>✓ Deliver great service to earn 5-star reviews</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link to="/dashboard">
              <Button className="w-full btn-primary" data-testid="view-dashboard-btn">
                View Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full"
              data-testid="share-profile-btn"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Your Profile
            </Button>
          </div>
        </div>

        <p className="text-sm text-[#94A3B8] mt-6">
          Need help? Visit our <Link to="/help" className="text-[#0052CC] hover:underline">Help Centre</Link>
        </p>
      </div>
    </div>
  );
}
