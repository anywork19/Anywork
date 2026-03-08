import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Briefcase, Calendar, Shield, AlertTriangle, TrendingUp, Activity, 
  Search, Filter, Eye, Ban, CheckCircle, Clock, ChevronRight, X,
  BarChart3, UserCheck, FileText, RefreshCw, Download, Settings
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Users
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  // Jobs
  const [jobs, setJobs] = useState([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobSearch, setJobSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetail, setJobDetail] = useState(null);

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingFilter, setBookingFilter] = useState('all');

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);

  // Verifications
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationDetail, setVerificationDetail] = useState(null);

  // Modals
  const [actionModal, setActionModal] = useState({ open: false, type: '', target: null });
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes, chartRes] = await Promise.all([
        api.getAdminDashboardStats(),
        api.getAdminActivity(15),
        api.getAdminChartData(7)
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data.activities || []);
      setChartData(chartRes.data.chart_data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (userSearch) params.search = userSearch;
      if (userFilter !== 'all') {
        if (userFilter === 'helper' || userFilter === 'customer') params.role = userFilter;
        else params.status = userFilter;
      }
      const res = await api.getAdminUsers(params);
      setUsers(res.data.users || []);
      setUsersTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadJobs = async () => {
    try {
      const params = {};
      if (jobSearch) params.search = jobSearch;
      if (jobFilter !== 'all') params.status = jobFilter;
      const res = await api.getAdminJobs(params);
      setJobs(res.data.jobs || []);
      setJobsTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Failed to load jobs');
    }
  };

  const loadBookings = async () => {
    try {
      const params = {};
      if (bookingFilter !== 'all') params.status = bookingFilter;
      const res = await api.getAdminBookings(params);
      setBookings(res.data.bookings || []);
      setBookingsTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  };

  const loadReports = async () => {
    try {
      const res = await api.getAdminReports();
      setReports(res.data.reports || []);
      setReportsTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Failed to load reports');
    }
  };

  const loadVerifications = async () => {
    try {
      const res = await api.getAdminVerifications();
      setVerifications(res.data.verifications || []);
    } catch (error) {
      toast.error('Failed to load verifications');
    }
  };

  // Load tab-specific data
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    
    switch (activeTab) {
      case 'users': loadUsers(); break;
      case 'jobs': loadJobs(); break;
      case 'bookings': loadBookings(); break;
      case 'reports': loadReports(); break;
      case 'verifications': loadVerifications(); break;
      default: break;
    }
  }, [activeTab, userSearch, userFilter, jobSearch, jobFilter, bookingFilter, isAuthenticated, user]);

  const viewUserDetail = async (userId) => {
    setSelectedUser(userId);
    try {
      const res = await api.getAdminUserDetail(userId);
      setUserDetail(res.data);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const viewJobDetail = async (jobId) => {
    setSelectedJob(jobId);
    try {
      const res = await api.getAdminJobDetail(jobId);
      setJobDetail(res.data);
    } catch (error) {
      toast.error('Failed to load job details');
    }
  };

  const viewVerificationDetail = async (verificationId) => {
    setSelectedVerification(verificationId);
    try {
      const res = await api.getVerificationDetail(verificationId);
      setVerificationDetail(res.data);
    } catch (error) {
      toast.error('Failed to load verification details');
    }
  };

  const handleUserAction = async (userId, action) => {
    setProcessingAction(true);
    try {
      await api.updateUserStatus(userId, action, actionReason);
      toast.success(`User ${action}ed successfully`);
      setActionModal({ open: false, type: '', target: null });
      setActionReason('');
      loadUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleJobAction = async (jobId, status) => {
    setProcessingAction(true);
    try {
      await api.updateJobStatus(jobId, status, actionReason);
      toast.success(`Job ${status} successfully`);
      setActionModal({ open: false, type: '', target: null });
      setActionReason('');
      loadJobs();
    } catch (error) {
      toast.error(`Failed to update job`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleVerificationAction = async (status) => {
    setProcessingAction(true);
    try {
      await api.updateVerificationStatus(selectedVerification, { status, rejection_reason: actionReason });
      toast.success(`Verification ${status}`);
      setSelectedVerification(null);
      setVerificationDetail(null);
      setActionReason('');
      loadVerifications();
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update verification');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700',
      cancelled: 'bg-slate-100 text-slate-700',
      open: 'bg-emerald-100 text-emerald-700',
      active: 'bg-blue-100 text-blue-700',
      closed: 'bg-slate-100 text-slate-700',
      removed: 'bg-red-100 text-red-700',
      verified: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      in_progress: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <div className="bg-[#0F172A] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-[#0052CC]" />
              <h1 className="text-xl font-bold">AnyWork Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-white hover:bg-slate-800">
                Exit Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="gap-2" data-testid="admin-tab-dashboard">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="admin-tab-users">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2" data-testid="admin-tab-jobs">
              <Briefcase className="h-4 w-4" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2" data-testid="admin-tab-bookings">
              <Calendar className="h-4 w-4" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-2" data-testid="admin-tab-verifications">
              <UserCheck className="h-4 w-4" /> Verifications
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2" data-testid="admin-tab-reports">
              <AlertTriangle className="h-4 w-4" /> Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Users</p>
                      <p className="text-2xl font-bold text-[#0F172A]">{stats?.total_users || 0}</p>
                      <p className="text-xs text-green-600 mt-1">+{stats?.users_today || 0} today</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Jobs</p>
                      <p className="text-2xl font-bold text-[#0F172A]">{stats?.total_jobs || 0}</p>
                      <p className="text-xs text-green-600 mt-1">+{stats?.jobs_today || 0} today</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Active Jobs</p>
                      <p className="text-2xl font-bold text-[#0F172A]">{stats?.active_jobs || 0}</p>
                      <p className="text-xs text-blue-600 mt-1">{stats?.in_progress_jobs || 0} in progress</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Activity className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Completed</p>
                      <p className="text-2xl font-bold text-[#0F172A]">{stats?.completed_jobs || 0}</p>
                      <p className="text-xs text-slate-500 mt-1">jobs completed</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0F172A]">{stats?.total_helpers || 0}</p>
                      <p className="text-xs text-slate-500">Helpers</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0F172A]">{stats?.verified_users || 0}</p>
                      <p className="text-xs text-slate-500">Verified</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0F172A]">{stats?.pending_verifications || 0}</p>
                      <p className="text-xs text-slate-500">Pending Review</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0F172A]">{stats?.pending_reports || 0}</p>
                      <p className="text-xs text-slate-500">Open Reports</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart & Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Simple Chart */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0F172A]">Last 7 Days</h3>
                    <TrendingUp className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {chartData.map((day, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-10">{day.day}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.max(day.users * 10, 4)}%` }} />
                          <span className="text-xs text-slate-600">{day.users} users</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${Math.max(day.jobs * 10, 4)}%` }} />
                          <span className="text-xs text-slate-600">{day.jobs} jobs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0F172A]">Recent Activity</h3>
                    <Button variant="ghost" size="sm" onClick={loadDashboardData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {activity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.type === 'user_registered' ? 'bg-blue-100 text-blue-600' :
                          item.type === 'job_posted' ? 'bg-emerald-100 text-emerald-600' :
                          item.type === 'booking_created' ? 'bg-purple-100 text-purple-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {item.type === 'user_registered' ? <Users className="h-4 w-4" /> :
                           item.type === 'job_posted' ? <Briefcase className="h-4 w-4" /> :
                           item.type === 'booking_created' ? <Calendar className="h-4 w-4" /> :
                           <Shield className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0F172A] truncate">{item.message}</p>
                          <p className="text-xs text-slate-500">{formatDate(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                    data-testid="admin-user-search"
                  />
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                  data-testid="admin-user-filter"
                >
                  <option value="all">All Users</option>
                  <option value="helper">Helpers</option>
                  <option value="customer">Customers</option>
                  <option value="verified">Verified</option>
                  <option value="suspended">Suspended</option>
                </select>
                <span className="text-sm text-slate-500">{usersTotal} users</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.user_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                              {u.picture ? (
                                <img src={u.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-slate-600">{u.name?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <span className="font-medium text-[#0F172A]">{u.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            u.is_helper ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : u.is_helper ? 'Helper' : 'Customer'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.is_suspended ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>
                          ) : u.is_verified ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Verified</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => viewUserDetail(u.user_id)} data-testid={`view-user-${u.user_id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {u.role !== 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActionModal({ open: true, type: u.is_suspended ? 'activate' : 'suspend', target: u })}
                                className={u.is_suspended ? 'text-green-600' : 'text-red-600'}
                                data-testid={`action-user-${u.user_id}`}
                              >
                                {u.is_suspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-10"
                    data-testid="admin-job-search"
                  />
                </div>
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                  data-testid="admin-job-filter"
                >
                  <option value="all">All Jobs</option>
                  <option value="open">Open</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="removed">Removed</option>
                </select>
                <span className="text-sm text-slate-500">{jobsTotal} jobs</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Posted By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Budget</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Posted</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => (
                      <tr key={job.job_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#0F172A] truncate max-w-[200px]">{job.title}</p>
                          <p className="text-xs text-slate-500">{job.postcode}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{job.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{job.poster?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">£{job.budget}</td>
                        <td className="px-4 py-3">{getStatusBadge(job.status || 'open')}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(job.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => viewJobDetail(job.job_id)} data-testid={`view-job-${job.job_id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {job.status !== 'removed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActionModal({ open: true, type: 'remove_job', target: job })}
                                className="text-red-600"
                                data-testid={`remove-job-${job.job_id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
                <select
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                  data-testid="admin-booking-filter"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
                <span className="text-sm text-slate-500">{bookingsTotal} bookings</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Booking ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Helper</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking.booking_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{booking.booking_id?.slice(-8)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{booking.job?.title || 'Direct booking'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{booking.customer?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{booking.helper?.name || 'Unknown'}</td>
                        <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(booking.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A]">ID Verification Requests</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {verifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No verification requests</div>
                ) : (
                  verifications.map((v) => (
                    <div key={v.verification_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">{v.user_name}</p>
                          <p className="text-sm text-slate-500">{v.user_email} • {v.id_type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(v.status)}
                        <span className="text-sm text-slate-500">{formatDate(v.submitted_at)}</span>
                        <Button variant="outline" size="sm" onClick={() => viewVerificationDetail(v.verification_id)} data-testid={`review-verification-${v.verification_id}`}>
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A]">User Reports ({reportsTotal})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No reports</div>
                ) : (
                  reports.map((r) => (
                    <div key={r.report_id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-[#0F172A]">{r.reason}</p>
                          <p className="text-sm text-slate-600 mt-1">{r.details}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            Reported user: {r.reported_user?.name || 'Unknown'} ({r.reported_user?.email})
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(r.status)}
                          <p className="text-xs text-slate-500 mt-1">{formatDate(r.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setUserDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {userDetail ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Name</p><p className="font-medium">{userDetail.user?.name}</p></div>
                <div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{userDetail.user?.email}</p></div>
                <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium">{userDetail.user?.phone || 'N/A'}</p></div>
                <div><p className="text-xs text-slate-500">Joined</p><p className="font-medium">{formatDate(userDetail.user?.created_at)}</p></div>
              </div>
              {userDetail.jobs?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recent Jobs</h4>
                  <div className="space-y-2">
                    {userDetail.jobs.map(j => (
                      <div key={j.job_id} className="p-2 bg-slate-50 rounded text-sm">{j.title}</div>
                    ))}
                  </div>
                </div>
              )}
              {userDetail.bookings?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recent Bookings</h4>
                  <div className="space-y-2">
                    {userDetail.bookings.map(b => (
                      <div key={b.booking_id} className="p-2 bg-slate-50 rounded text-sm flex justify-between">
                        <span>{b.booking_id?.slice(-8)}</span>
                        {getStatusBadge(b.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => { setSelectedJob(null); setJobDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {jobDetail ? (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-lg">{jobDetail.job?.title}</h3>
                <p className="text-slate-600 mt-1">{jobDetail.job?.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Budget</p><p className="font-medium">£{jobDetail.job?.budget}</p></div>
                <div><p className="text-xs text-slate-500">Category</p><p className="font-medium">{jobDetail.job?.category}</p></div>
                <div><p className="text-xs text-slate-500">Location</p><p className="font-medium">{jobDetail.job?.postcode}</p></div>
                <div><p className="text-xs text-slate-500">Posted By</p><p className="font-medium">{jobDetail.poster?.name}</p></div>
              </div>
              {jobDetail.applications?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Applications ({jobDetail.applications.length})</h4>
                  <div className="space-y-2">
                    {jobDetail.applications.map(a => (
                      <div key={a.booking_id} className="p-2 bg-slate-50 rounded text-sm flex justify-between items-center">
                        <span>{a.helper?.name || 'Unknown'}</span>
                        {getStatusBadge(a.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Detail Modal */}
      <Dialog open={!!selectedVerification} onOpenChange={() => { setSelectedVerification(null); setVerificationDetail(null); setActionReason(''); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Review</DialogTitle>
          </DialogHeader>
          {verificationDetail ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Name</p><p className="font-medium">{verificationDetail.user_name}</p></div>
                <div><p className="text-xs text-slate-500">ID Type</p><p className="font-medium">{verificationDetail.id_type?.replace('_', ' ')}</p></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">ID Photo</p>
                  <img src={verificationDetail.id_front} alt="ID" className="w-full rounded-lg border" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Selfie</p>
                  <img src={verificationDetail.selfie} alt="Selfie" className="w-full rounded-lg border" />
                </div>
              </div>

              {verificationDetail.ai_verification && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm font-medium">AI Verification Result</p>
                  <p className="text-sm text-slate-600">
                    Match: {verificationDetail.ai_verification.match ? 'Yes' : 'No'} • 
                    Confidence: {verificationDetail.ai_verification.confidence}%
                  </p>
                  <p className="text-xs text-slate-500">{verificationDetail.ai_verification.reason}</p>
                </div>
              )}

              {verificationDetail.status === 'pending' && (
                <>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Rejection reason (required if rejecting)..."
                    rows={2}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600"
                      onClick={() => handleVerificationAction('rejected')}
                      disabled={processingAction}
                      data-testid="reject-verification"
                    >
                      Reject
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerificationAction('verified')}
                      disabled={processingAction}
                      data-testid="approve-verification"
                    >
                      Approve
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Modal */}
      <Dialog open={actionModal.open} onOpenChange={() => { setActionModal({ open: false, type: '', target: null }); setActionReason(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === 'suspend' ? 'Suspend User' :
               actionModal.type === 'activate' ? 'Activate User' :
               actionModal.type === 'remove_job' ? 'Remove Job' : 'Confirm Action'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              {actionModal.type === 'suspend' && `Are you sure you want to suspend ${actionModal.target?.name}?`}
              {actionModal.type === 'activate' && `Are you sure you want to activate ${actionModal.target?.name}?`}
              {actionModal.type === 'remove_job' && `Are you sure you want to remove "${actionModal.target?.title}"?`}
            </p>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Reason (optional)..."
              rows={2}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setActionModal({ open: false, type: '', target: null })}>
                Cancel
              </Button>
              <Button
                className={`flex-1 ${actionModal.type === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={() => {
                  if (actionModal.type === 'suspend' || actionModal.type === 'activate') {
                    handleUserAction(actionModal.target?.user_id, actionModal.type);
                  } else if (actionModal.type === 'remove_job') {
                    handleJobAction(actionModal.target?.job_id, 'removed');
                  }
                }}
                disabled={processingAction}
              >
                {processingAction ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
