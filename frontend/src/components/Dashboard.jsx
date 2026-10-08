import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Clock,
  Users,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock3,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  X,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import StatsCard from './StatsCard';
import { api, SessionManager } from '../services/api';

export default function Dashboard({ userPhone, onLogout }) {
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customer: '',
    phone: '',
    amount: '',
    status: 'Pending',
    description: '',
  });

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getDashboardStats();
      setStats(data);
      setInvoices(data.recent_invoices || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
      if (err.message.includes('expired') || err.message.includes('authenticated')) {
        setTimeout(onLogout, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoice.customer || !newInvoice.amount) {
      alert('Please fill in customer name and amount');
      return;
    }

    try {
      setSubmittingInvoice(true);
      await api.createInvoice(newInvoice);
      setShowModal(false);
      setNewInvoice({
        customer: '',
        phone: '',
        amount: '',
        status: 'Pending',
        description: '',
      });
      // Refresh stats and list
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleToggleStatus = async (invoiceId, currentStatus) => {
    const nextStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await api.updateInvoiceStatus(invoiceId, nextStatus);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update invoice status');
    }
  };

  const openWhatsAppReminder = (invoice) => {
    const phoneClean = (invoice.phone || '').replace(/\D/g, '');
    const num = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    const text = encodeURIComponent(
      `Hello ${invoice.customer},\nThis is a friendly reminder from QuickKhata regarding your pending ledger payment of ${invoice.amount} (${invoice.id} - ${invoice.description || 'Invoice'}).\nPlease settle at your convenience. Thank you!`
    );
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  // Filtered list
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.phone && inv.phone.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'All' ? true : inv.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Business Ledger Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time revenues, customer dues & WhatsApp invoice tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Invoice</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-bold underline cursor-pointer hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Collected Revenue"
          value={stats ? stats.total_revenue : '₹0'}
          subtitle="All settled & paid invoices"
          icon={IndianRupee}
          colorClass="emerald"
          badge="+18% this month"
        />
        <StatsCard
          title="Outstanding Ledger Dues"
          value={stats ? stats.pending_dues : '₹0'}
          subtitle="Awaiting client payment"
          icon={Clock}
          colorClass="amber"
          badge="Action needed"
        />
        <StatsCard
          title="Active Khata Customers"
          value={stats ? stats.active_customers : '0'}
          subtitle="Vendors & regular clients"
          icon={Users}
          colorClass="blue"
        />
        <StatsCard
          title="Total Invoices Created"
          value={stats ? stats.total_invoices : '0'}
          subtitle="All recorded transactions"
          icon={FileText}
          colorClass="purple"
        />
      </div>

      {/* Invoice Ledger Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Transactions & Invoices
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage accounts receivable, mark payments, and send instant reminders
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, ID..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
              {['All', 'Paid', 'Pending', 'Overdue'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Invoice ID</th>
                <th className="py-3.5 px-6">Customer & Phone</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No ledger entries matching your filters</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Invoice ID */}
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">
                      {inv.id}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{inv.customer}</div>
                      {inv.phone && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {inv.phone}
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                      {inv.description || 'Khata Transaction'}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                      {inv.date}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right font-mono font-extrabold text-sm text-slate-900 whitespace-nowrap">
                      {inv.amount}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inv.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {inv.status === 'Paid' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {inv.status === 'Pending' && <Clock3 className="w-3 h-3 text-amber-600" />}
                        {inv.status === 'Overdue' && <AlertCircle className="w-3 h-3 text-red-600" />}
                        <span>{inv.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(inv.id, inv.status)}
                          title={`Mark as ${inv.status === 'Paid' ? 'Pending' : 'Paid'}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          Mark {inv.status === 'Paid' ? 'Pending' : 'Paid'}
                        </button>

                        {/* WhatsApp Reminder (for Pending/Overdue) */}
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => openWhatsAppReminder(inv)}
                            title="Send WhatsApp payment reminder"
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Remind</span>
                          </button>
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

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
              Record Khata Entry
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Add a new transaction or outstanding invoice to your ledger.
            </p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Traders"
                  value={newInvoice.customer}
                  onChange={(e) => setNewInvoice({ ...newInvoice, customer: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 Mobile number"
                  value={newInvoice.phone}
                  onChange={(e) => setNewInvoice({ ...newInvoice, phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2500"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none bg-white font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transaction Notes / Goods Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 10 bags grain wholesale delivered"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                >
                  {submittingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save to Ledger</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
