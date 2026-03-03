import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

export default function ReviewForm({ booking, helperName, onSuccess, triggerButton }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setLoading(true);
    try {
      await api.createReview({
        booking_id: booking.booking_id,
        helper_id: booking.helper_id,
        rating,
        comment: comment.trim()
      });
      toast.success('Review submitted successfully!');
      setOpen(false);
      setRating(0);
      setComment('');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            variant="outline"
            className="text-[#0052CC] border-[#0052CC]"
            data-testid="leave-review-btn"
          >
            <Star className="h-4 w-4 mr-2" />
            Leave Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {helperName || 'Helper'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Star Rating */}
          <div>
            <Label className="text-sm font-medium">How would you rate your experience?</Label>
            <div className="flex items-center gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-[#F59E0B] fill-[#F59E0B]'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-[#64748B] mt-2">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Tell us about your experience</Label>
            <Textarea
              id="comment"
              data-testid="review-comment"
              placeholder="What did you like? Was the helper on time? Would you recommend them?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-[#94A3B8] mt-1">
              Minimum 10 characters
            </p>
          </div>

          {/* Service Info */}
          {booking && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-[#64748B]">
                Service: <span className="text-[#0F172A] capitalize">{booking.service_type?.replace(/-/g, ' ')}</span>
              </p>
              <p className="text-[#64748B]">
                Date: <span className="text-[#0F172A]">{new Date(booking.date).toLocaleDateString('en-GB')}</span>
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0 || comment.trim().length < 10}
            className="w-full btn-primary"
            data-testid="submit-review-btn"
          >
            {loading ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
