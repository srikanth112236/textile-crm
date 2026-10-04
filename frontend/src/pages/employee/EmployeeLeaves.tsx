import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { Pagination } from '../../components/ui/Pagination';
import { Calendar, Plus, Clock, CheckCircle2, X, AlertCircle, Gift, Tag, Umbrella } from 'lucide-react';

export const EmployeeLeaves: React.FC = () => {
  const { token } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [leavesData, setLeavesData] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'leaves' | 'holidays'>('leaves');
  const [loading, setLoading] = useState(true);

  // Apply Leave Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'casual',
    startDate: todayStr,
    endDate: todayStr,
    reason: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaves/my-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeavesData(data.leaves || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/holidays', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data.holidays || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
    fetchHolidays();
  }, [token]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason || !leaveForm.startDate || !leaveForm.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(leaveForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit leave request');
      }

      setShowApplyModal(false);
      setLeaveForm({ leaveType: 'casual', startDate: todayStr, endDate: todayStr, reason: '' });
      fetchMyLeaves();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(leavesData.length / pageSize) || 1;
  const paginatedLeaves = leavesData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="My Leaves & Holiday Schedule" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Leaves Allowance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Allowance</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats?.monthlyAllowed || 2} Days</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Paid Leave Limit</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Umbrella className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used This Month</p>
              <h3 className="text-xl font-extrabold text-amber-600 mt-1">{stats?.usedThisMonth || 0} Days</h3>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Approved</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Monthly</p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{stats?.remainingMonthly || 2} Days</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Available Paid</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Yearly</p>
              <h3 className="text-xl font-extrabold text-purple-600 mt-1">{stats?.remainingYearly || 24} Days</h3>
              <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Annual Balance</p>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-4 py-2 text-xs font-bold rounded-2xl transition ${
                activeTab === 'leaves'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              My Leave Requests ({leavesData.length})
            </button>
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-4 py-2 text-xs font-bold rounded-2xl transition ${
                activeTab === 'holidays'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Company Festive Days & Holidays ({holidays.length})
            </button>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Apply for New Leave
          </button>
        </div>

        {/* TAB 1: My Leave Requests Table */}
        {activeTab === 'leaves' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Start Date</th>
                    <th className="px-5 py-3.5">End Date</th>
                    <th className="px-5 py-3.5">Total Days</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Loading leave records...
                      </td>
                    </tr>
                  ) : paginatedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No leave requests submitted yet. Click "Apply for New Leave" above.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaves.map((l) => (
                      <tr key={l._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-800">
                            {l.leaveType} Leave
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{l.startDate}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{l.endDate}</td>
                        <td className="px-5 py-3.5 font-extrabold text-indigo-600">{l.totalDays} Days</td>
                        <td className="px-5 py-3.5 text-slate-600 italic max-w-xs truncate">"{l.reason}"</td>
                        <td className="px-5 py-3.5">
                          {l.status === 'pending' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Pending Approval
                            </span>
                          ) : l.status === 'approved' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={leavesData.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* TAB 2: Company Holidays Schedule */}
        {activeTab === 'holidays' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Festive Days & Public Holiday Calendar</h3>
                <p className="text-xs text-slate-400">Official company holidays and paid festive days</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {holidays.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400 text-xs">
                  No company festive days scheduled yet.
                </div>
              ) : (
                holidays.map((h) => (
                  <div key={h._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                        {h.type}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{h.name}</h4>
                      <p className="text-xs font-mono text-indigo-600 font-bold mt-0.5">{h.date}</p>
                    </div>
                    <Gift className="w-5 h-5 text-purple-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Apply Leave Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">Apply for Leave</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="paid">Paid Annual Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                    <CustomDatePicker
                      value={leaveForm.startDate}
                      onChange={(val) => setLeaveForm({ ...leaveForm, startDate: val })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                    <CustomDatePicker
                      value={leaveForm.endDate}
                      onChange={(val) => setLeaveForm({ ...leaveForm, endDate: val })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Leave</label>
                  <textarea
                    rows={3}
                    required
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="Provide details about your leave request..."
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold shadow-xs"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Leave Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
