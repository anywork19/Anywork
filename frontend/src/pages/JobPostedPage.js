import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Share2, Copy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function JobPostedPage() {
  const location = useLocation();
  const job = location.state?.job;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${job?.job_id}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="card-base p-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-[#10B981]" />
          </div>

          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Job Posted!</h1>
          <p className="text-[#64748B] mb-6">
            Your job has been posted successfully. Helpers in your area will be able to see it and send you quotes.
          </p>

          {job && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-[#0F172A]">{job.title}</h3>
              <p className="text-sm text-[#64748B] mt-1">{job.category} • {job.postcode}</p>
              <p className="text-sm text-[#64748B]">
                {job.date_needed} at {job.time_needed} • {job.duration_hours}hr{job.duration_hours > 1 ? 's' : ''}
              </p>
              <p className="font-semibold text-[#0F172A] mt-2">
                £{job.budget_amount}{job.budget_type === 'hourly' ? '/hr' : ' fixed'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link to="/browse">
              <Button className="w-full btn-primary" data-testid="browse-helpers-btn">
                Browse Helpers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyLink}
                data-testid="copy-link-btn"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                data-testid="share-btn"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm text-[#94A3B8] mt-6">
          You'll receive notifications when helpers respond to your job.
        </p>
      </div>
    </div>
  );
}
