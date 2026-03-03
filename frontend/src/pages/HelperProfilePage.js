import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, CheckCircle, Shield, MapPin, Clock, Calendar, MessageCircle, ArrowLeft, ChevronRight, Briefcase, Award, Flag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import ReportUserDialog from '../components/ReportUserDialog';

// Sample helper data
const SAMPLE_HELPER = {
  helper_id: 'helper_1',
  user_id: 'user_1',
  user_name: 'Sarah Johnson',
  user_email: 'sarah@example.com',
  user_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  bio: 'Professional cleaner with 5 years experience. I take pride in making homes sparkle! I use eco-friendly products and pay attention to every detail. Your satisfaction is my priority.',
  categories: ['cleaning', 'home-help'],
  hourly_rate: 15,
  fixed_rate: 50,
  postcode: 'SW1A 1AA',
  availability: {
    monday: ['09:00-17:00'],
    tuesday: ['09:00-17:00'],
    wednesday: ['09:00-17:00'],
    thursday: ['09:00-17:00'],
    friday: ['09:00-17:00']
  },
  verified_id: true,
  insured: true,
  rating: 4.9,
  total_reviews: 47,
  reliability_score: 98,
  jobs_completed: 52,
  created_at: '2023-01-15',
  recent_reviews: [
    {
      review_id: 'r1',
      reviewer_name: 'Emma Watson',
      rating: 5,
      comment: 'Sarah did an amazing job cleaning my flat. Everything was spotless! Highly recommend.',
      created_at: '2024-01-10'
    },
    {
      review_id: 'r2',
      reviewer_name: 'John Smith',
      rating: 5,
      comment: 'Very professional and thorough. Arrived on time and was very respectful of my home.',
      created_at: '2024-01-05'
    },
    {
      review_id: 'r3',
      reviewer_name: 'Lisa Brown',
      rating: 4,
      comment: 'Great service overall. Will book again!',
      created_at: '2023-12-28'
    }
  ]
};

export default function HelperProfilePage() {
  const { helperId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [helper, setHelper] = useState(SAMPLE_HELPER);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchHelper = async () => {
      try {
        const response = await api.getHelper(helperId);
        setHelper({ ...SAMPLE_HELPER, ...response.data });
      } catch (error) {
        console.error('Error fetching helper:', error);
        // Use sample data on error
      } finally {
        setLoading(false);
      }
    };
    fetchHelper();
  }, [helperId]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book a helper');
      navigate('/login', { state: { from: `/helpers/${helperId}` } });
      return;
    }
    navigate(`/checkout/${helperId}`, { state: { helper, selectedDate } });
  };

  const handleRequestQuote = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to request a quote');
      navigate('/login', { state: { from: `/helpers/${helperId}` } });
      return;
    }

    try {
      // Create conversation and send message
      const convResponse = await api.createConversation(helper.user_id);
      await api.sendMessage({
        conversation_id: convResponse.data.conversation_id,
        content: `Hi! I'd like to request a quote. ${quoteMessage}`
      });
      toast.success('Quote request sent!');
      setQuoteDialogOpen(false);
      navigate('/messages');
    } catch (error) {
      toast.error('Failed to send quote request');
    }
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-pulse text-[#64748B]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container-app py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-[#64748B] hover:text-[#0F172A]"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to search
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="card-base p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <img
                  src={helper.user_picture}
                  alt={helper.user_name}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-[#0F172A]">{helper.user_name}</h1>
                    {helper.verified_id && (
                      <Badge className="bg-[#0052CC]/10 text-[#0052CC] rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified ID
                      </Badge>
                    )}
                    {helper.insured && (
                      <Badge className="bg-[#10B981]/10 text-[#10B981] rounded-full">
                        <Shield className="h-3 w-3 mr-1" />
                        Insured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {helper.categories?.map(cat => (
                      <Badge key={cat} variant="secondary" className="rounded-full capitalize">
                        {cat.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-semibold text-lg">{helper.rating}</span>
                      <span className="text-[#64748B]">({helper.total_reviews} reviews)</span>
                    </div>
                    <div className="text-[#64748B]">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {helper.reliability_score}% reliability
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-[#64748B]">
                    <span>
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {helper.postcode}
                    </span>
                    <span>
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      {helper.jobs_completed} jobs completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="card-base">
              <TabsList className="w-full justify-start border-b border-slate-100 rounded-none p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="about" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
                  data-testid="tab-about"
                >
                  About
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
                  data-testid="tab-services"
                >
                  Services
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
                  data-testid="tab-reviews"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="p-6">
                <h3 className="font-semibold text-[#0F172A] mb-3">About me</h3>
                <p className="text-[#64748B] leading-relaxed">{helper.bio}</p>
              </TabsContent>

              <TabsContent value="services" className="p-6">
                <h3 className="font-semibold text-[#0F172A] mb-4">Services offered</h3>
                <div className="space-y-4">
                  {helper.categories?.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <span className="capitalize font-medium">{cat.replace('-', ' ')}</span>
                      <div className="text-right">
                        <p className="font-semibold text-[#0F172A]">£{helper.hourly_rate}/hr</p>
                        {helper.fixed_rate && (
                          <p className="text-sm text-[#64748B]">or £{helper.fixed_rate} fixed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-[#0F172A]">Reviews ({helper.total_reviews})</h3>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="font-semibold">{helper.rating}</span>
                  </div>
                </div>
                <div className="space-y-6">
                  {helper.recent_reviews?.map(review => (
                    <div key={review.review_id} className="border-b border-slate-100 pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#0F172A]">{review.reviewer_name}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#64748B] text-sm">{review.comment}</p>
                      <p className="text-xs text-[#94A3B8] mt-2">
                        {new Date(review.created_at).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="card-base p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-[#0F172A]">
                  £{helper.hourly_rate}
                  <span className="text-base font-normal text-[#64748B]">/hour</span>
                </p>
                {helper.fixed_rate && (
                  <p className="text-sm text-[#64748B] mt-1">
                    or £{helper.fixed_rate} per job
                  </p>
                )}
              </div>

              {/* Availability Calendar */}
              <div className="mb-6">
                <h4 className="font-medium text-[#0F172A] mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check availability
                </h4>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl border border-slate-200"
                  data-testid="availability-calendar"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  data-testid="book-now-btn"
                  onClick={handleBookNow}
                  className="w-full btn-primary"
                >
                  Book now
                </Button>

                <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      data-testid="request-quote-btn"
                      variant="outline"
                      className="w-full btn-secondary"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Request quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request a Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-[#64748B]">
                        Send a message to {helper.user_name} describing what you need help with.
                      </p>
                      <Textarea
                        data-testid="quote-message"
                        placeholder="Describe your task, preferred dates/times, and any specific requirements..."
                        value={quoteMessage}
                        onChange={(e) => setQuoteMessage(e.target.value)}
                        rows={4}
                      />
                      <Button
                        onClick={handleRequestQuote}
                        className="w-full btn-primary"
                        data-testid="send-quote-btn"
                      >
                        Send quote request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Safety Panel */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl space-y-3">
                <h4 className="font-medium text-[#0F172A] text-sm">Safety & Trust</h4>
                <div className="flex items-center gap-3 text-sm">
                  {helper.verified_id ? (
                    <CheckCircle className="h-5 w-5 text-[#0052CC]" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={helper.verified_id ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>
                    Identity verified
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {helper.insured ? (
                    <Shield className="h-5 w-5 text-[#10B981]" />
                  ) : (
                    <Shield className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={helper.insured ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>
                    {helper.insured ? 'Insurance verified' : 'No insurance on file'}
                  </span>
                </div>
              </div>

              {/* Report Button */}
              <ReportUserDialog
                userId={helper.user_id}
                userName={helper.user_name}
                userType="helper"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
