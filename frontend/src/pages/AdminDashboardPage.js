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
  FileText,
  Shield,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
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
  const [verifications, setVerifications] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications');
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationDetail, setVerificationDetail] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

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
      } else if (activeTab === 'bookings') {
        const response = await api.getAdminBookings();
        setBookings(response.data.bookings || []);
      } else if (activeTab === 'verifications') {
        const response = await api.getAdminVerifications();
        setVerifications(response.data.verifications || []);
        setPendingVerifications(response.data.pending_count || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewVerificationDetail = async (verificationId) => {
    try {
      const response = await api.getVerificationDetail(verificationId);
      setVerificationDetail(response.data);
      setSelectedVerification(verificationId);
    } catch (error) {
      toast.error('Failed to load verification details');
    }
  };

  const handleVerificationAction = async (action) => {
    if (!selectedVerification) return;
    
    if (action === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(selectedVerification);
    try {
      await api.updateVerificationStatus(selectedVerification, {
        status: action,
        rejection_reason: action === 'rejected' ? rejectionReason : null
      });
      toast.success(action === 'verified' ? 'User verified successfully!' : 'Verification rejected');
      setSelectedVerification(null);
      setVerificationDetail(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update verification');
    } finally {
      setProcessingId(null);
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
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" /> {status === 'verified' ? 'Verified' : 'Resolved'}
          </span>
        );
      case 'dismissed':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <Ban className="h-3 w-3" /> {status === 'rejected' ? 'Rejected' : 'Dismissed'}
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Pending Verifications</p>
                <p className="text-xl font-bold text-[#0F172A]">{pendingVerifications}</p>
              </div>
            </div>
          </div>

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
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors relative ${
              activeTab === 'verifications'
                ? 'bg-[#0052CC] text-white'
                : 'bg-white text-[#64748B] hover:bg-slate-50 border border-slate-200'
            }`}
            data-testid="tab-verifications"
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Verifications
            {pendingVerifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingVerifications}
              </span>
            )}
          </button>
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
        ) : activeTab === 'verifications' ? (
          verifications.length === 0 ? (
            <div className="card-base p-12 text-center">
              <Shield className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#0F172A] mb-2">No verifications</h3>
              <p className="text-[#64748B]">No ID verification requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((v) => (
                <div
                  key={v.verification_id}
                  className={`card-base p-5 ${v.status === 'pending' ? 'border-l-4 border-amber-500' : ''}`}
                  data-testid={`verification-${v.verification_id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(v.status)}
                        <span className="text-xs text-[#94A3B8]">
                          {v.id_type?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-medium text-[#0F172A]">{v.user_name}</p>
                      <p className="text-sm text-[#64748B]">{v.user_email}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Submitted: {new Date(v.submitted_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <Button
                      onClick={() => viewVerificationDetail(v.verification_id)}
                      className="btn-primary"
                      data-testid={`review-${v.verification_id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
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

      {/* Verification Review Modal */}
      <Dialog open={!!selectedVerification} onOpenChange={() => {
        setSelectedVerification(null);
        setVerificationDetail(null);
        setRejectionReason('');
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0052CC]" />
              Review Verification
            </DialogTitle>
          </DialogHeader>

          {verificationDetail ? (
            <div className="space-y-6 mt-4">
              {/* User Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-xs font-medium text-[#94A3B8] uppercase mb-2">Applicant</h4>
                <p className="font-medium text-[#0F172A]">{verificationDetail.user_name}</p>
                <p className="text-sm text-[#64748B]">{verificationDetail.user_email}</p>
                <p className="text-xs text-[#94A3B8] mt-2">
                  ID Type: {verificationDetail.id_type?.replace('_', ' ')}
                </p>
              </div>

              {/* ID Front */}
              <div>
                <h4 className="text-sm font-medium text-[#0F172A] mb-3">Front of ID</h4>
                <div className="border rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={verificationDetail.id_front}
                    alt="ID Front"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              </div>

              {/* ID Back (if exists) */}
              {verificationDetail.id_back && (
                <div>
                  <h4 className="text-sm font-medium text-[#0F172A] mb-3">Back of ID</h4>
                  <div className="border rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={verificationDetail.id_back}
                      alt="ID Back"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Selfie */}
              <div>
                <h4 className="text-sm font-medium text-[#0F172A] mb-3">Selfie</h4>
                <div className="border rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={verificationDetail.selfie}
                    alt="Selfie"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#64748B]">Current Status:</span>
                {getStatusBadge(verificationDetail.status)}
              </div>

              {/* Rejection Reason Input (only show if pending) */}
              {verificationDetail.status === 'pending' && (
                <div>
                  <h4 className="text-sm font-medium text-[#0F172A] mb-2">Rejection Reason (required if rejecting)</h4>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full"
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons (only show if pending) */}
              {verificationDetail.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleVerificationAction('rejected')}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={processingId === selectedVerification}
                    data-testid="reject-verification-btn"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleVerificationAction('verified')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={processingId === selectedVerification}
                    data-testid="approve-verification-btn"
                  >
                    {processingId === selectedVerification ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Already processed */}
              {verificationDetail.status !== 'pending' && (
                <div className={`p-4 rounded-xl ${
                  verificationDetail.status === 'verified' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`font-medium ${
                    verificationDetail.status === 'verified' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationDetail.status === 'verified' 
                      ? 'This user has been verified.'
                      : 'This verification was rejected.'}
                  </p>
                  {verificationDetail.rejection_reason && (
                    <p className="text-sm text-red-600 mt-2">
                      Reason: {verificationDetail.rejection_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
