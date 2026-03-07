import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, MessageCircle, Star, Settings, Calendar, MapPin, Clock, CheckCircle, Shield, Edit, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import ReviewForm from '../components/ReviewForm';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [helperBookings, setHelperBookings] = useState([]);
  const [helperProfile, setHelperProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingBooking, setProcessingBooking] = useState(null);

  const fetchData = async () => {
    try {
      const [jobsRes, bookingsRes] = await Promise.all([
        api.getMyJobs(),
        api.getBookings()
      ]);
      setJobs(jobsRes.data.jobs || []);
      setBookings(bookingsRes.data.bookings || []);

      // Try to get helper profile and helper's bookings if user is a helper
      if (user?.is_helper) {
        try {
          const [helperRes, helperBookingsRes] = await Promise.all([
            api.getMyHelperProfile(),
            api.getHelperBookings()
          ]);
          setHelperProfile(helperRes.data);
          setHelperBookings(helperBookingsRes.data.bookings || []);
        } catch (e) {
          // Not a helper or no bookings
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return; // Wait for auth to complete
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate, user, authLoading]);

  const handleAcceptBooking = async (bookingId) => {
    setProcessingBooking(bookingId);
    try {
      await api.updateBookingStatus(bookingId, { status: 'confirmed' });
      toast.success('Booking accepted! Contact the customer to arrange details.');
      fetchData();
    } catch (error) {
      toast.error('Failed to accept booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to decline this booking?')) return;
    setProcessingBooking(bookingId);
    try {
      await api.updateBookingStatus(bookingId, { status: 'declined' });
      toast.success('Booking declined');
      fetchData();
    } catch (error) {
      toast.error('Failed to decline booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    setProcessingBooking(bookingId);
    try {
      await api.updateBookingStatus(bookingId, { status: 'completed' });
      toast.success('Booking marked as completed!');
      fetchData();
    } catch (error) {
      toast.error('Failed to complete booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

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
        {/* Header */}
        <div className="card-base p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#0052CC] flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-[#64748B]">{user?.email}</p>
              {user?.is_helper && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-[#0052CC]/10 text-[#0052CC]">Helper</Badge>
                  {helperProfile?.verified_id && (
                    <Badge className="bg-[#10B981]/10 text-[#10B981]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => navigate('/settings')} data-testid="settings-btn">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/post-job" className="card-base p-6 hover:border-[#0052CC] transition-colors group">
            <Briefcase className="h-8 w-8 text-[#0052CC] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-[#0F172A]">Post a Job</h3>
            <p className="text-sm text-[#64748B]">Get help with a task</p>
          </Link>
          <Link to="/browse" className="card-base p-6 hover:border-[#0052CC] transition-colors group">
            <User className="h-8 w-8 text-[#0052CC] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-[#0F172A]">Browse Helpers</h3>
            <p className="text-sm text-[#64748B]">Find local help</p>
          </Link>
          <Link to="/messages" className="card-base p-6 hover:border-[#0052CC] transition-colors group">
            <MessageCircle className="h-8 w-8 text-[#0052CC] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-[#0F172A]">Messages</h3>
            <p className="text-sm text-[#64748B]">Chat with helpers</p>
          </Link>
          {!user?.is_helper ? (
            <Link to="/become-helper" className="card-base p-6 hover:border-[#FF5A5F] transition-colors group border-dashed">
              <Star className="h-8 w-8 text-[#FF5A5F] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-[#0F172A]">Become a Helper</h3>
              <p className="text-sm text-[#64748B]">Start earning</p>
            </Link>
          ) : (
            <div className="card-base p-6 bg-[#0052CC]/5 border-[#0052CC]/20">
              <Star className="h-8 w-8 text-[#F59E0B] mb-3" />
              <h3 className="font-semibold text-[#0F172A]">Your Rating</h3>
              <p className="text-lg font-bold text-[#0F172A]">
                {helperProfile?.rating || 0} <span className="text-sm font-normal text-[#64748B]">({helperProfile?.total_reviews || 0} reviews)</span>
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="card-base">
          <TabsList className="w-full justify-start border-b border-slate-100 rounded-none p-0 h-auto bg-transparent">
            <TabsTrigger 
              value="bookings" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
              data-testid="tab-bookings"
            >
              My Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="jobs" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
              data-testid="tab-jobs"
            >
              Posted Jobs
            </TabsTrigger>
            {user?.is_helper && (
              <TabsTrigger 
                value="requests" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4 relative"
                data-testid="tab-requests"
              >
                Booking Requests
                {helperBookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {helperBookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {user?.is_helper && (
              <TabsTrigger 
                value="helper" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
                data-testid="tab-helper"
              >
                Helper Profile
              </TabsTrigger>
            )}
          </TabsList>

          {/* Helper Booking Requests Tab */}
          {user?.is_helper && (
            <TabsContent value="requests" className="p-6">
              {helperBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-[#94A3B8] mb-4" />
                  <p className="text-[#64748B]">No booking requests yet</p>
                  <p className="text-sm text-[#94A3B8] mt-2">When customers book your services, requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {helperBookings.map((booking) => (
                    <div 
                      key={booking.booking_id} 
                      className={`p-4 border rounded-xl ${booking.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'}`}
                      data-testid={`helper-booking-${booking.booking_id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-[#10B981]/10 text-[#10B981]' :
                              booking.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                              booking.status === 'completed' ? 'bg-[#0052CC]/10 text-[#0052CC]' :
                              booking.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-[#64748B]'
                            }>
                              {booking.status}
                            </Badge>
                            {booking.preferred_payment && (
                              <Badge variant="outline" className="text-xs">
                                {booking.preferred_payment === 'cash' ? '💵 Cash' : '🏦 Bank Transfer'}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-[#0F172A] capitalize">
                            {booking.service_type?.replace(/-/g, ' ')}
                          </h4>
                          <p className="text-sm text-[#64748B]">
                            Customer: {booking.customer_name || 'Customer'}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {booking.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.duration_hours} hours
                            </span>
                          </div>
                          {booking.notes && (
                            <p className="mt-3 text-sm text-[#64748B] bg-slate-50 p-3 rounded-lg">
                              "{booking.notes}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-[#0F172A]">£{booking.total_amount}</p>
                          <p className="text-xs text-[#94A3B8]">Estimated total</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {booking.status === 'pending' && (
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200">
                          <Button
                            onClick={() => handleAcceptBooking(booking.booking_id)}
                            disabled={processingBooking === booking.booking_id}
                            className="bg-[#10B981] hover:bg-[#059669] text-white"
                            data-testid={`accept-${booking.booking_id}`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept Booking
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeclineBooking(booking.booking_id)}
                            disabled={processingBooking === booking.booking_id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            data-testid={`decline-${booking.booking_id}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                          <Link to={`/messages`}>
                            <Button variant="outline">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message Customer
                            </Button>
                          </Link>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200">
                          <Button
                            onClick={() => handleCompleteBooking(booking.booking_id)}
                            disabled={processingBooking === booking.booking_id}
                            className="btn-primary"
                            data-testid={`complete-${booking.booking_id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </Button>
                          <Link to={`/messages`}>
                            <Button variant="outline">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message Customer
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="bookings" className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-[#94A3B8] mb-4" />
                <p className="text-[#64748B]">No bookings yet</p>
                <Link to="/browse">
                  <Button className="mt-4" variant="outline">Browse Helpers</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.booking_id} className="p-4 border border-slate-100 rounded-xl" data-testid={`booking-${booking.booking_id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-[#0F172A] capitalize">{booking.service_type?.replace(/-/g, ' ')}</h4>
                        <p className="text-sm text-[#64748B]">
                          {booking.helper_name || 'Helper'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.time}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          booking.status === 'confirmed' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          booking.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                          booking.status === 'completed' ? 'bg-[#0052CC]/10 text-[#0052CC]' :
                          'bg-slate-100 text-[#64748B]'
                        }>
                          {booking.status}
                        </Badge>
                        <p className="font-semibold text-[#0F172A] mt-2">£{booking.total_amount}</p>
                      </div>
                    </div>
                    {/* Leave Review button for completed bookings */}
                    {booking.status === 'completed' && booking.customer_id === user?.user_id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <ReviewForm
                          booking={booking}
                          helperName={booking.helper_name}
                          onSuccess={() => {
                            // Optionally refresh bookings
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="p-6">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-[#94A3B8] mb-4" />
                <p className="text-[#64748B]">No jobs posted yet</p>
                <Link to="/post-job">
                  <Button className="mt-4 btn-primary">Post a Job</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.job_id} className="p-4 border border-slate-100 rounded-xl" data-testid={`job-${job.job_id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-[#0F172A]">{job.title}</h4>
                        <p className="text-sm text-[#64748B] capitalize">{job.category.replace('-', ' ')}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.postcode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {job.date_needed}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          job.status === 'open' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          job.status === 'in_progress' ? 'bg-[#0052CC]/10 text-[#0052CC]' :
                          job.status === 'completed' ? 'bg-slate-100 text-[#64748B]' :
                          'bg-red-100 text-red-600'
                        }>
                          {job.status}
                        </Badge>
                        <p className="font-semibold text-[#0F172A] mt-2">
                          £{job.budget_amount}{job.budget_type === 'hourly' ? '/hr' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {user?.is_helper && (
            <TabsContent value="helper" className="p-6">
              {helperProfile ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0F172A]">Your Helper Profile</h3>
                      <p className="text-[#64748B]">{helperProfile.bio}</p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="edit-profile-btn">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#0F172A]">{helperProfile.jobs_completed}</p>
                      <p className="text-sm text-[#64748B]">Jobs Completed</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#0F172A]">{helperProfile.rating || 0}</p>
                      <p className="text-sm text-[#64748B]">Rating</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#0F172A]">{helperProfile.reliability_score}%</p>
                      <p className="text-sm text-[#64748B]">Reliability</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#0F172A]">£{helperProfile.hourly_rate}</p>
                      <p className="text-sm text-[#64748B]">Hourly Rate</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {helperProfile.verified_id && (
                      <Badge className="bg-[#0052CC]/10 text-[#0052CC]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified ID
                      </Badge>
                    )}
                    {helperProfile.insured && (
                      <Badge className="bg-[#10B981]/10 text-[#10B981]">
                        <Shield className="h-3 w-3 mr-1" />
                        Insured
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#64748B]">No helper profile found</p>
                  <Link to="/become-helper">
                    <Button className="mt-4 btn-primary">Create Profile</Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
