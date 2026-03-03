import React, { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Inappropriate behavior' },
  { id: 'fraud', label: 'Suspected fraud or scam' },
  { id: 'harassment', label: 'Harassment or abuse' },
  { id: 'fake_profile', label: 'Fake or misleading profile' },
  { id: 'no_show', label: 'Did not show up for booking' },
  { id: 'poor_service', label: 'Poor quality service' },
  { id: 'other', label: 'Other' }
];

export default function ReportUserDialog({ userId, userName, userType = 'user', triggerButton }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to report a user');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      await api.reportUser({
        reported_user_id: userId,
        reason,
        details
      });
      toast.success('Report submitted successfully. Our team will review it.');
      setOpen(false);
      setReason('');
      setDetails('');
    } catch (error) {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <button
            className="w-full text-sm text-[#94A3B8] hover:text-[#64748B] flex items-center justify-center gap-2"
            data-testid="report-user-btn"
          >
            <Flag className="h-4 w-4" />
            Report this {userType}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report {userName || 'User'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div>
            <Label className="text-sm font-medium">Why are you reporting this {userType}?</Label>
            <RadioGroup
              value={reason}
              onValueChange={setReason}
              className="mt-3 space-y-2"
            >
              {REPORT_REASONS.map((r) => (
                <div key={r.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={r.id} id={r.id} data-testid={`reason-${r.id}`} />
                  <Label htmlFor={r.id} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              data-testid="report-details"
              placeholder="Please provide any additional information that might help us investigate..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-[#64748B]">
            <p>Your report will be reviewed by our Trust & Safety team within 24-48 hours. 
            We may contact you for additional information.</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              data-testid="submit-report-btn"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
