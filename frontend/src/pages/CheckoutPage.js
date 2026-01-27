import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, CreditCard, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { helperId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [polling, setPolling] = useState(false);

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
    notes: ''
  });

  // Calculate pricing
  const hourlyRate = helper.hourly_rate || 15;
  const subtotal = hourlyRate * bookingData.duration_hours;
  const platformFee = Math.round(subtotal * 0.1 * 100) / 100; // 10% platform fee
  const total = subtotal + platformFee;

  // Check for payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error('Payment status check timed out. Please check your bookings.');
      return;
    }

    setPolling(true);
    try {
      const response = await api.getPaymentStatus(sessionId);
      
      if (response.data.payment_status === 'paid') {
        toast.success('Payment successful! Booking confirmed.');
        navigate('/bookings');
        return;
      } else if (response.data.status === 'expired') {
        toast.error('Payment session expired. Please try again.');
        setPolling(false);
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPolling(false);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to complete booking');
      navigate('/login', { state: { from: `/checkout/${helperId}` } });
      return;
    }

    if (!disclaimer) {
      toast.error('Please accept the disclaimer to continue');
      return;
    }

    setLoading(true);
    try {
      // Create booking first
      const bookingResponse = await api.createBooking({
        helper_id: helper.helper_id,
        service_type: helper.categories?.[0] || 'general',
        date: bookingData.date,
        time: bookingData.time,
        duration_hours: bookingData.duration_hours,
        total_amount: total,
        platform_fee: platformFee,
        notes: bookingData.notes
      });

      // Create checkout session
      const checkoutResponse = await api.createCheckout({
        booking_id: bookingResponse.data.booking_id,
        origin_url: window.location.origin
      });

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      toast.error('Failed to process booking. Please try again.');
      setLoading(false);
    }
  };

  if (polling) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#0052CC] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#64748B]">Confirming your payment...</p>
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
              <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Complete Your Booking</h1>

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
                  <Label htmlFor="date">Date</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="date"
                      data-testid="booking-date"
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
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
                <Label>Duration</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBookingData({ ...bookingData, duration_hours: Math.max(1, bookingData.duration_hours - 1) })}
                    data-testid="decrease-duration"
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold text-[#0F172A] min-w-[100px] text-center">
                    {bookingData.duration_hours} hour{bookingData.duration_hours > 1 ? 's' : ''}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBookingData({ ...bookingData, duration_hours: bookingData.duration_hours + 1 })}
                    data-testid="increase-duration"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Input
                  id="notes"
                  data-testid="booking-notes"
                  placeholder="Any special requirements or instructions..."
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Disclaimer */}
            <div className="card-base p-6">
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl mb-6">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Important Information</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    You are booking an independent individual through AnyWork. 
                    Any qualifications or insurance are displayed on their profile. 
                    AnyWork connects customers with helpers but does not employ them.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="disclaimer"
                  data-testid="disclaimer-checkbox"
                  checked={disclaimer}
                  onCheckedChange={setDisclaimer}
                />
                <Label htmlFor="disclaimer" className="text-sm text-[#64748B] cursor-pointer leading-relaxed">
                  I understand that I am booking an independent helper and that AnyWork is a marketplace 
                  connecting people who need help with those who can help. I have reviewed the helper's 
                  profile including any verification badges.
                </Label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="card-base p-6 sticky top-24">
              <h3 className="font-semibold text-[#0F172A] mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">
                    {helper.user_name} × {bookingData.duration_hours}hr{bookingData.duration_hours > 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Platform fee (10%)</span>
                  <span className="font-medium">£{platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-semibold text-[#0F172A]">Total</span>
                  <span className="font-bold text-xl text-[#0F172A]">£{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleBooking}
                disabled={loading || !disclaimer}
                className="w-full btn-primary mt-6"
                data-testid="pay-now-btn"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : `Pay £${total.toFixed(2)}`}
              </Button>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-[#64748B] mb-2">
                  <Shield className="h-4 w-4 text-[#10B981]" />
                  <span>Secure payment by Stripe</span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Your payment is protected. Funds are held until the job is completed.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
                <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
