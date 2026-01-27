import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, MessageCircle, Star, Settings, Calendar, MapPin, Clock, CheckCircle, Shield, Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [helperProfile, setHelperProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const fetchData = async () => {
      try {
        const [jobsRes, bookingsRes] = await Promise.all([
          api.getMyJobs(),
          api.getBookings()
        ]);
        setJobs(jobsRes.data.jobs || []);
        setBookings(bookingsRes.data.bookings || []);

        // Try to get helper profile if user is a helper
        if (user?.is_helper) {
          try {
            const helperRes = await api.getMyHelperProfile();
            setHelperProfile(helperRes.data);
          } catch (e) {
            // Not a helper
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, user]);

  if (!isAuthenticated) {
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
                value="helper" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#0052CC] rounded-none px-6 py-4"
                data-testid="tab-helper"
              >
                Helper Profile
              </TabsTrigger>
            )}
          </TabsList>

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
                        <h4 className="font-semibold text-[#0F172A]">{booking.service_type}</h4>
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
