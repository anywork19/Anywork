import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, RefreshCw, 
  ChevronRight, User, Calendar, CreditCard, AlertCircle, TrendingUp,
  Banknote, PiggyBank, ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

export default function AdminPaymentsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/admin/payments' } });
      return;
    }
    fetchPayments();
  }, [isAuthenticated, navigate, statusFilter, payoutFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (payoutFilter !== 'all') params.payout_status = payoutFilter;
      
      const response = await api.getAdminPayments(params);
      setTransactions(response.data.transactions || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!selectedTransaction) return;
    setProcessing(true);
    try {
      await api.releasePayment(selectedTransaction.transaction_id);
      toast.success(`Payment of £${selectedTransaction.helper_amount} released to helper`);
      setActionDialogOpen(false);
      setSelectedTransaction(null);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to release payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefundPayment = async () => {
    if (!selectedTransaction) return;
    setProcessing(true);
    try {
      await api.refundPayment(selectedTransaction.transaction_id);
      toast.success(`Payment of £${selectedTransaction.amount} refunded to customer`);
      setActionDialogOpen(false);
      setSelectedTransaction(null);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to refund payment');
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (txn, type) => {
    setSelectedTransaction(txn);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-slate-100 text-slate-600',
      held: 'bg-amber-100 text-amber-700',
      released: 'bg-green-100 text-green-700',
      refunded: 'bg-red-100 text-red-600',
      paid: 'bg-blue-100 text-blue-700'
    };
    return <Badge className={styles[status] || 'bg-slate-100'}>{status}</Badge>;
  };

  const getPayoutBadge = (status) => {
    const styles = {
      pending: 'bg-slate-100 text-slate-600',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-600',
      cancelled: 'bg-slate-100 text-slate-500'
    };
    return <Badge className={styles[status] || 'bg-slate-100'}>{status}</Badge>;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-2 text-[#64748B] -ml-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-[#0F172A]">Payment Management</h1>
            <p className="text-[#64748B]">Manage escrow payments and payouts to helpers</p>
          </div>
          <Button onClick={fetchPayments} variant="outline" data-testid="refresh-payments">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Held in Escrow</p>
                <p className="text-2xl font-bold text-amber-600">
                  £{summary.held_amount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-[#94A3B8]">{summary.held_count || 0} payments</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Released to Helpers</p>
                <p className="text-2xl font-bold text-green-600">
                  £{summary.released_amount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-[#94A3B8]">{summary.released_count || 0} payouts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Platform Fees Earned</p>
                <p className="text-2xl font-bold text-[#0052CC]">
                  £{summary.platform_fees_earned?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-[#94A3B8]">10% of transactions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#0052CC]" />
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Pending Actions</p>
                <p className="text-2xl font-bold text-[#0F172A]">{summary.held_count || 0}</p>
                <p className="text-xs text-[#94A3B8]">Awaiting release</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#64748B]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card-base p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#64748B]" />
              <span className="text-sm font-medium text-[#64748B]">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="held">Held</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={payoutFilter} onValueChange={setPayoutFilter}>
              <SelectTrigger className="w-40" data-testid="payout-filter">
                <SelectValue placeholder="Payout Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payouts</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Helper
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Payout
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.transaction_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#0F172A] text-sm">{txn.transaction_id}</p>
                          <p className="text-xs text-[#94A3B8]">
                            {txn.service_type || 'Service'} • {txn.booking_date || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#0F172A]">{txn.customer_name || 'Customer'}</p>
                          <p className="text-xs text-[#94A3B8]">{txn.customer_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#0F172A]">{txn.helper_name || 'Helper'}</p>
                          <p className="text-xs text-[#94A3B8]">{txn.helper_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-[#0F172A]">£{txn.amount?.toFixed(2)}</p>
                          <p className="text-xs text-[#64748B]">
                            Fee: £{txn.platform_fee?.toFixed(2)} • Helper: £{txn.helper_amount?.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(txn.payment_status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPayoutBadge(txn.payout_status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {txn.payment_status === 'held' && txn.payout_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(txn, 'release')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`release-${txn.transaction_id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Release
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openActionDialog(txn, 'refund')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                data-testid={`refund-${txn.transaction_id}`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Refund
                              </Button>
                            </>
                          )}
                          {txn.payout_status === 'completed' && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Paid out
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Confirmation Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'release' ? 'Release Payment to Helper' : 'Refund Payment to Customer'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'release'
                  ? 'This will transfer the funds from escrow to the helper. This action cannot be undone.'
                  : 'This will refund the full amount to the customer. This action cannot be undone.'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="py-4 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#64748B]">Transaction ID</p>
                      <p className="font-medium">{selectedTransaction.transaction_id}</p>
                    </div>
                    <div>
                      <p className="text-[#64748B]">Total Amount</p>
                      <p className="font-medium">£{selectedTransaction.amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#64748B]">
                        {actionType === 'release' ? 'Helper Receives' : 'Customer Receives'}
                      </p>
                      <p className="font-bold text-lg text-[#0052CC]">
                        £{actionType === 'release' 
                          ? selectedTransaction.helper_amount?.toFixed(2)
                          : selectedTransaction.amount?.toFixed(2)
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[#64748B]">Platform Fee</p>
                      <p className="font-medium">£{selectedTransaction.platform_fee?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {actionType === 'release' && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Releasing to: {selectedTransaction.helper_name}</p>
                      <p className="text-sm text-green-700">{selectedTransaction.helper_email}</p>
                    </div>
                  </div>
                )}

                {actionType === 'refund' && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Refunding to: {selectedTransaction.customer_name}</p>
                      <p className="text-sm text-red-700">{selectedTransaction.customer_email}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={actionType === 'release' ? handleReleasePayment : handleRefundPayment}
                disabled={processing}
                className={actionType === 'release' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
                }
              >
                {processing ? 'Processing...' : actionType === 'release' ? 'Confirm Release' : 'Confirm Refund'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
