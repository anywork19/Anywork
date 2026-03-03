import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  PoundSterling, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Ban,
  Eye,
  ChevronDown,
  ChevronUp
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
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTxn, setExpandedTxn] = useState(null);
  const [processingTxn, setProcessingTxn] = useState(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchPayments();
    }
  }, [authLoading, isAuthenticated, isAdmin, filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'held') {
        params.status = 'held';
        params.payout_status = 'pending';
      } else if (filter === 'released') {
        params.payout_status = 'completed';
      } else if (filter === 'refunded') {
        params.status = 'refunded';
      }

      const response = await api.getAdminPayments(params);
      setTransactions(response.data.transactions);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async (transactionId) => {
    setProcessingTxn(transactionId);
    try {
      await api.releasePayment(transactionId);
      toast.success('Payment released successfully!');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to release payment');
    } finally {
      setProcessingTxn(null);
    }
  };

  const handleRefund = async (transactionId) => {
    if (!window.confirm('Are you sure you want to refund this payment? This action cannot be undone.')) {
      return;
    }
    setProcessingTxn(transactionId);
    try {
      await api.refundPayment(transactionId);
      toast.success('Payment refunded successfully!');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to refund payment');
    } finally {
      setProcessingTxn(null);
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
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
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

  const getStatusBadge = (txn) => {
    if (txn.payout_status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" /> Released
        </span>
      );
    }
    if (txn.payment_status === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <Ban className="h-3 w-3" /> Refunded
        </span>
      );
    }
    if (txn.payment_status === 'held') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="h-3 w-3" /> Held
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        {txn.payment_status}
      </span>
    );
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
              <h1 className="text-2xl font-bold text-[#0F172A]">Admin Payment Dashboard</h1>
              <p className="text-[#64748B]">Manage payouts and refunds</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchPayments}
            disabled={loading}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-base p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Funds Held</p>
                  <p className="text-xl font-bold text-[#0F172A]">£{summary.held_amount.toFixed(2)}</p>
                  <p className="text-xs text-[#94A3B8]">{summary.held_count} transactions</p>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Released</p>
                  <p className="text-xl font-bold text-[#0F172A]">£{summary.released_amount.toFixed(2)}</p>
                  <p className="text-xs text-[#94A3B8]">{summary.released_count} payouts</p>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <PoundSterling className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Platform Fees</p>
                  <p className="text-xl font-bold text-[#0F172A]">£{summary.platform_fees_earned.toFixed(2)}</p>
                  <p className="text-xs text-[#94A3B8]">Total earned</p>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Total Transactions</p>
                  <p className="text-xl font-bold text-[#0F172A]">{transactions.length}</p>
                  <p className="text-xs text-[#94A3B8]">Showing filtered</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'held', label: 'Awaiting Release' },
            { id: 'released', label: 'Released' },
            { id: 'refunded', label: 'Refunded' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-[#0052CC] text-white'
                  : 'bg-white text-[#64748B] hover:bg-slate-50 border border-slate-200'
              }`}
              data-testid={`filter-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="card-base p-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-base p-12 text-center">
            <PoundSterling className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-2">No transactions found</h3>
            <p className="text-[#64748B]">There are no transactions matching your filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn) => (
              <div
                key={txn.transaction_id}
                className="card-base overflow-hidden"
                data-testid={`transaction-${txn.transaction_id}`}
              >
                {/* Main Row */}
                <div
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedTxn(expandedTxn === txn.transaction_id ? null : txn.transaction_id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusBadge(txn)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#0F172A] truncate">
                        {txn.service_type?.replace(/-/g, ' ') || 'Service'}
                      </p>
                      <p className="text-sm text-[#64748B]">
                        {txn.customer_name} → {txn.helper_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-[#0F172A]">£{txn.amount?.toFixed(2)}</p>
                      <p className="text-xs text-[#64748B]">
                        Helper gets £{txn.helper_amount?.toFixed(2)}
                      </p>
                    </div>
                    {expandedTxn === txn.transaction_id ? (
                      <ChevronUp className="h-5 w-5 text-[#94A3B8]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#94A3B8]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTxn === txn.transaction_id && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50">
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-xs font-medium text-[#94A3B8] uppercase mb-2">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-[#64748B]">ID:</span> {txn.transaction_id}</p>
                          <p><span className="text-[#64748B]">Booking ID:</span> {txn.booking_id}</p>
                          <p><span className="text-[#64748B]">Date:</span> {txn.booking_date || 'N/A'}</p>
                          <p><span className="text-[#64748B]">Created:</span> {new Date(txn.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#94A3B8] uppercase mb-2">Payment Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-[#64748B]">Total:</span> £{txn.amount?.toFixed(2)}</p>
                          <p><span className="text-[#64748B]">Platform Fee:</span> £{txn.platform_fee?.toFixed(2)}</p>
                          <p><span className="text-[#64748B]">Helper Amount:</span> £{txn.helper_amount?.toFixed(2)}</p>
                          <p><span className="text-[#64748B]">Status:</span> {txn.booking_status || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {txn.payment_status === 'held' && txn.payout_status === 'pending' && (
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReleasePayout(txn.transaction_id);
                          }}
                          disabled={processingTxn === txn.transaction_id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`release-btn-${txn.transaction_id}`}
                        >
                          {processingTxn === txn.transaction_id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Release £{txn.helper_amount?.toFixed(2)} to Helper
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefund(txn.transaction_id);
                          }}
                          disabled={processingTxn === txn.transaction_id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          data-testid={`refund-btn-${txn.transaction_id}`}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Refund Customer
                        </Button>
                      </div>
                    )}

                    {txn.payout_status === 'completed' && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Released on {txn.payout_date ? new Date(txn.payout_date).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
