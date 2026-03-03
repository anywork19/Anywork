import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Flag, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Ban,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

// Hardcoded admin email for simple admin check
const ADMIN_EMAIL = 'admin@anywork.co.uk';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [expandedItem, setExpandedItem] = useState(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, isAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const response = await api.getAdminReports();
        setReports(response.data.reports || []);
      } else {
        const response = await api.getAdminBookings();
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Authentication Required</h2>
          <p className="text-[#64748B] mb-6">Please log in to access the admin dashboard.</p>
          <Button onClick={() => navigate('/login')} className="btn-primary">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Ban className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Access Denied</h2>
          <p className="text-[#64748B] mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Eye className="h-3 w-3" /> Reviewed
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" /> Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <Ban className="h-3 w-3" /> Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="container-app max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-[#64748B]"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Admin Dashboard</h1>
              <p className="text-[#64748B]">Manage reports and bookings</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Flag className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Pending Reports</p>
                <p className="text-xl font-bold text-[#0F172A]">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Total Reports</p>
                <p className="text-xl font-bold text-[#0F172A]">{reports.length}</p>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Active Bookings</p>
                <p className="text-xl font-bold text-[#0F172A]">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-[#0052CC] text-white'
                : 'bg-white text-[#64748B] hover:bg-slate-50 border border-slate-200'
            }`}
            data-testid="tab-reports"
          >
            <Flag className="h-4 w-4 inline mr-2" />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-[#0052CC] text-white'
                : 'bg-white text-[#64748B] hover:bg-slate-50 border border-slate-200'
            }`}
            data-testid="tab-bookings"
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Bookings
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="card-base p-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full" />
          </div>
        ) : activeTab === 'reports' ? (
          reports.length === 0 ? (
            <div className="card-base p-12 text-center">
              <Flag className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#0F172A] mb-2">No reports</h3>
              <p className="text-[#64748B]">No user reports have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.report_id}
                  className="card-base overflow-hidden"
                  data-testid={`report-${report.report_id}`}
                >
                  <div
                    className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedItem(expandedItem === report.report_id ? null : report.report_id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-shrink-0">
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#0F172A]">
                          {report.reason?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-[#64748B]">
                          Reported by: {report.reporter_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <p className="text-sm text-[#64748B]">
                        {new Date(report.created_at).toLocaleDateString('en-GB')}
                      </p>
                      {expandedItem === report.report_id ? (
                        <ChevronUp className="h-5 w-5 text-[#94A3B8]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#94A3B8]" />
                      )}
                    </div>
                  </div>

                  {expandedItem === report.report_id && (
                    <div className="border-t border-slate-100 p-5 bg-slate-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-[#94A3B8] uppercase mb-2">Details</h4>
                          <p className="text-sm text-[#64748B]">{report.details || 'No additional details provided'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-[#94A3B8] uppercase mb-2">Reported User</h4>
                          <p className="text-sm text-[#0F172A]">
                            {report.reported_user?.name || 'Unknown'} ({report.reported_user?.email})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          bookings.length === 0 ? (
            <div className="card-base p-12 text-center">
              <FileText className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#0F172A] mb-2">No bookings</h3>
              <p className="text-[#64748B]">No bookings have been made yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="card-base p-5"
                  data-testid={`booking-${booking.booking_id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#0F172A] capitalize">
                        {booking.service_type?.replace(/-/g, ' ')}
                      </p>
                      <p className="text-sm text-[#64748B]">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(booking.status)}
                      <p className="text-sm text-[#64748B] mt-1">£{booking.total_amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
