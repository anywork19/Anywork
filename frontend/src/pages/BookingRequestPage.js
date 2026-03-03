import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle, Shield, CheckCircle, Banknote, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

export default function BookingRequestPage() {
  const { helperId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get helper and date from navigation state or fetch
  const helper = location.state?.helper || {
    helper_id: helperId,
    user_name: 'Helper',
    hourly_rate: 15,
    categories: ['cleaning']
  };

  const selectedDate = location.state?.selectedDate || new Date();

  const [bookingData, setBookingData] = useState({
    date: selectedDate.toISOString().split('T')[0],
    time: '10:00',
    duration_hours: 2,
    notes: '',
    preferred_payment: 'cash' // cash or bank_transfer
  });

  // Calculate pricing (for display only - actual payment is between users)
  const hourlyRate = helper.hourly_rate || 15;
  const estimatedTotal = hourlyRate * bookingData.duration_hours;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to request a booking');
      navigate('/login', { state: { from: `/book/${helperId}` } });
      return;
    }

    if (!disclaimer) {
      toast.error('Please accept the disclaimer to continue');
      return;
    }

    setLoading(true);
    try {
      // Create booking request
      await api.createBooking({
        helper_id: helper.helper_id,
        service_type: helper.categories?.[0] || 'general',
        date: bookingData.date,
        time: bookingData.time,
        duration_hours: bookingData.duration_hours,
        total_amount: estimatedTotal,
        platform_fee: 0, // No platform fee
        notes: bookingData.notes,
        preferred_payment: bookingData.preferred_payment,
        status: 'pending' // Booking needs helper confirmation
      });

      setSuccess(true);
      toast.success('Booking request sent!');
    } catch (error) {
      toast.error('Failed to send booking request. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-8">
        <div className="container-app max-w-lg">
          <div className="card-base p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Booking Request Sent!</h1>
            <p className="text-[#64748B] mb-6">
              Your booking request has been sent to {helper.user_name}. They will review and confirm your request.
            </p>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-[#0F172A] mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] font-bold">1.</span>
                  {helper.user_name} will review your request
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] font-bold">2.</span>
                  You'll receive a message to discuss details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0052CC] font-bold">3.</span>
                  Arrange payment directly with {helper.user_name}
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/messages')}
                className="btn-primary flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Go to Messages
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                View My Bookings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="container-app max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-[#64748B]"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Booking Form */}
          <div className="md:col-span-3 space-y-6">
            <div className="card-base p-6">
              <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Request a Booking</h1>

              {/* Helper Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                <img
                  src={helper.user_picture || 'https://via.placeholder.com/60'}
                  alt={helper.user_name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-[#0F172A]">{helper.user_name}</h3>
                  <p className="text-sm text-[#64748B] capitalize">
                    {helper.categories?.join(', ').replace(/-/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="date">Preferred Date</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="date"
                      data-testid="booking-date"
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="time">Preferred Time</Label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="time"
                      data-testid="booking-time"
                      type="time"
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <Label htmlFor="duration">Estimated Duration</Label>
                <select
                  id="duration"
                  data-testid="booking-duration"
                  value={bookingData.duration_hours}
                  onChange={(e) => setBookingData({ ...bookingData, duration_hours: parseInt(e.target.value) })}
                  className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={8}>Full day (8 hours)</option>
                </select>
              </div>

              {/* Preferred Payment Method */}
              <div className="mb-6">
                <Label className="mb-3 block">How would you like to pay?</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingData({ ...bookingData, preferred_payment: 'cash' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      bookingData.preferred_payment === 'cash'
                        ? 'border-[#0052CC] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="payment-cash"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        bookingData.preferred_payment === 'cash' ? 'bg-[#0052CC]' : 'bg-slate-100'
                      }`}>
                        <Banknote className={`h-5 w-5 ${
                          bookingData.preferred_payment === 'cash' ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">Cash</p>
                        <p className="text-xs text-[#64748B]">Pay in person</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingData({ ...bookingData, preferred_payment: 'bank_transfer' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      bookingData.preferred_payment === 'bank_transfer'
                        ? 'border-[#0052CC] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="payment-bank"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        bookingData.preferred_payment === 'bank_transfer' ? 'bg-[#0052CC]' : 'bg-slate-100'
                      }`}>
                        <Building2 className={`h-5 w-5 ${
                          bookingData.preferred_payment === 'bank_transfer' ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">Bank Transfer</p>
                        <p className="text-xs text-[#64748B]">Direct to helper</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <Label htmlFor="notes">Message to {helper.user_name} (optional)</Label>
                <Textarea
                  id="notes"
                  data-testid="booking-notes"
                  placeholder="Describe what you need help with, any special requirements, access instructions..."
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="mt-2 min-h-[100px]"
                />
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl mb-6">
                <Checkbox
                  id="disclaimer"
                  data-testid="disclaimer-checkbox"
                  checked={disclaimer}
                  onCheckedChange={(checked) => setDisclaimer(checked)}
                  className="mt-1"
                />
                <label htmlFor="disclaimer" className="text-sm text-[#64748B] cursor-pointer">
                  I understand that I am booking an independent helper. AnyWork is a platform only and does not process payments. 
                  I will arrange payment directly with the helper and accept responsibility for verifying their identity.
                </label>
              </div>

              <Button
                onClick={handleBooking}
                disabled={loading || !disclaimer}
                className="w-full btn-primary h-12 text-base"
                data-testid="submit-booking"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending Request...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Send Booking Request
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="card-base p-6 sticky top-24">
              <h2 className="font-semibold text-[#0F172A] mb-4">Booking Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Service</span>
                  <span className="text-[#0F172A] capitalize">{helper.categories?.[0]?.replace(/-/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Helper rate</span>
                  <span className="text-[#0F172A]">£{hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Duration</span>
                  <span className="text-[#0F172A]">{bookingData.duration_hours} hours</span>
                </div>
                
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-[#0F172A]">Estimated Total</span>
                    <span className="text-[#0052CC]">£{estimatedTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">Final price may vary - discuss with helper</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">Direct Payment</p>
                    <p className="text-xs text-[#64748B] mt-1">
                      You'll arrange payment directly with {helper.user_name}. AnyWork does not handle payments.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <Shield className="h-4 w-4" />
                  <span>Always verify helper identity before payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
