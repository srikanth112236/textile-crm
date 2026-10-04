import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import { Calendar, CheckCircle2, XCircle, Clock, Search, Eye, Trash2, X, AlertCircle } from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail view modal state
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<any | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaves/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [token]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/leaves/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/leaves/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchLeaves();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      (l.employeeName && l.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.employeeCode && l.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.leaveType && l.leaveType.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLeaves.length / pageSize) || 1;
  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Employee Leave Approvals & Balances" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search employee, leave type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setFilterStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 font-bold capitalize transition ${
                    filterStatus === st ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Dates & Duration</th>
                  <th className="px-5 py-3.5">Reason Note</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Loading leave requests...
                    </td>
                  </tr>
                ) : paginatedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaves.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{l.employeeName}</div>
                        <div className="text-[11px] text-indigo-600 font-bold font-mono">{l.employeeCode}</div>
                      </td>
                      <td className="px-5 py-3.5 uppercase font-bold text-slate-700">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border text-[11px]">
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {l.startDate} to {l.endDate}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">{l.totalDays} Day(s)</div>
                      </td>
                      <td className="px-5 py-3.5 truncate max-w-xs">{l.reason}</td>
                      <td className="px-5 py-3.5">
                        {l.status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            APPROVED
                          </span>
                        ) : l.status === 'rejected' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            REJECTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ActionPopover
                          actions={[
                            {
                              label: 'View Reason',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setSelectedLeaveDetail(l),
                            },
                            ...(l.status === 'pending'
                              ? [
                                  {
                                    label: 'Approve Request',
                                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                                    onClick: () => handleUpdateStatus(l._id, 'approved'),
                                  },
                                  {
                                    label: 'Reject Request',
                                    icon: <XCircle className="w-4 h-4 text-red-600" />,
                                    onClick: () => handleUpdateStatus(l._id, 'rejected'),
                                  },
                                ]
                              : []),
                            {
                              label: 'Delete Entry',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => setDeleteTarget(l),
                            },
                          ]}
                        />
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
            totalItems={filteredLeaves.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* View Leave Reason Detail Modal */}
        {selectedLeaveDetail && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase font-mono">
                    {selectedLeaveDetail.employeeCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{selectedLeaveDetail.employeeName}</h3>
                </div>
                <button onClick={() => setSelectedLeaveDetail(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block font-semibold">Leave Type</span>
                    <span className="font-bold uppercase text-slate-800">{selectedLeaveDetail.leaveType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Duration</span>
                    <span className="font-bold text-slate-900">{selectedLeaveDetail.totalDays} Day(s)</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block font-semibold mb-1">Date Range</span>
                  <span className="font-bold text-slate-900">
                    {selectedLeaveDetail.startDate} to {selectedLeaveDetail.endDate}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block font-semibold mb-1">Application Reason</span>
                  <p className="text-slate-800 leading-relaxed font-medium">{selectedLeaveDetail.reason}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 gap-2">
                {selectedLeaveDetail.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedLeaveDetail._id, 'rejected');
                        setSelectedLeaveDetail(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-500"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedLeaveDetail._id, 'approved');
                        setSelectedLeaveDetail(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedLeaveDetail(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Leave Application"
          message="Are you sure you want to delete this leave request entry?"
          itemName={deleteTarget ? `${deleteTarget.employeeCode} - ${deleteTarget.leaveType}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
