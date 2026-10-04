import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Payroll } from '../../types';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { generatePayslipPDF } from '../../utils/pdfGenerator';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import {
  DollarSign,
  Download,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  Search,
  CheckSquare,
  Calculator,
  Trash2,
  Bell,
  Clock,
  Calendar,
} from 'lucide-react';

export const PayrollManagement: React.FC = () => {
  const { token } = useAuth();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection state for Bulk Mark Paid
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detailed View Modal state
  const [selectedPayslipForView, setSelectedPayslipForView] = useState<Payroll | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Payroll | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll/all?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, year, token]);

  const handleGeneratePayroll = async (empId?: string) => {
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ month, year, employeeId: empId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to calculate payroll');
      }

      setMessage(data.message);
      fetchPayrolls();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePay = async (id: string, newStatus: 'approved' | 'paid') => {
    try {
      const res = await fetch(`/api/payroll/approve/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setMessage(`Salary marked as ${newStatus.toUpperCase()} and notified to employee!`);
        fetchPayrolls();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/payroll/bulk-pay', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed bulk payment update');
      }

      setMessage(data.message);
      setSelectedIds([]);
      fetchPayrolls();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/payroll/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPayrolls();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedPayrolls.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPayrolls.map((p) => p._id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    value: m.toString(),
    label: new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' }),
  }));

  const yearOptions = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
  ];

  const filteredPayrolls = payrolls.filter(
    (p) =>
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payrollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayrolls.length / pageSize) || 1;
  const paginatedPayrolls = filteredPayrolls.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Payroll Engine & Salary Calculations" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search code, employee..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Period:</span>
              <div className="w-36">
                <CustomSelect
                  options={monthOptions}
                  value={month.toString()}
                  onChange={(val) => setMonth(Number(val))}
                  searchable={false}
                />
              </div>
              <div className="w-28">
                <CustomSelect
                  options={yearOptions}
                  value={year.toString()}
                  onChange={(val) => setYear(Number(val))}
                  searchable={false}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkMarkPaid}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Mark {selectedIds.length} Paid</span>
              </button>
            )}

            <button
              onClick={() => handleGeneratePayroll()}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Calculate Bulk Payroll</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 border">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 border">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedPayrolls.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="px-5 py-3.5">Payroll Ref & Employee</th>
                  <th className="px-5 py-3.5">Days Present / Total</th>
                  <th className="px-5 py-3.5">Hours Worked</th>
                  <th className="px-5 py-3.5">Base Salary</th>
                  <th className="px-5 py-3.5">Deductions</th>
                  <th className="px-5 py-3.5">Net Payable</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      Loading payroll records...
                    </td>
                  </tr>
                ) : paginatedPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No payroll records generated yet for {month}/{year}. Click "Calculate Bulk Payroll".
                    </td>
                  </tr>
                ) : (
                  paginatedPayrolls.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{p.employeeName}</div>
                        <div className="text-[11px] text-indigo-600 font-bold font-mono">
                          {p.employeeCode} • {p.payrollNumber}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">
                          {p.daysPresent} / {p.totalWorkingDays} days
                        </span>
                        <div className="text-[10px] text-red-500 font-semibold">
                          {p.daysAbsent > 0 ? `${p.daysAbsent} absent day(s)` : 'Full Attendance'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900">{p.totalHoursWorked} hrs</span>
                        <div className="text-[10px] text-slate-400">Target: {p.requiredHours} hrs</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        ₹{p.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-red-600 font-semibold">
                        - ₹{(p.hourlyDeductions + p.unpaidLeaveDeductions).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-emerald-700 text-sm">
                        ₹{p.netSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.status === 'paid' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PAID
                          </span>
                        ) : p.status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            APPROVED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            DRAFT
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ActionPopover
                          actions={[
                            {
                              label: 'Detailed Salary Breakdown',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setSelectedPayslipForView(p),
                            },
                            {
                              label: 'Recalculate Individual',
                              icon: <Calculator className="w-4 h-4" />,
                              onClick: () => handleGeneratePayroll(typeof p.employee === 'string' ? p.employee : p.employee._id),
                            },
                            ...(p.status !== 'paid'
                              ? [
                                  {
                                    label: 'Mark as Paid',
                                    icon: <CheckSquare className="w-4 h-4 text-emerald-600" />,
                                    onClick: () => handleApprovePay(p._id, 'paid'),
                                  },
                                ]
                              : []),
                            {
                              label: 'Download PDF Payslip',
                              icon: <Download className="w-4 h-4" />,
                              onClick: () => generatePayslipPDF(p),
                            },
                            {
                              label: 'Delete Record',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => setDeleteTarget(p),
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
            totalItems={filteredPayrolls.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Detailed Salary Calculation Breakdown Modal */}
        {selectedPayslipForView && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase font-mono">
                    {selectedPayslipForView.payrollNumber}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    Salary Breakdown: {selectedPayslipForView.employeeName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPayslipForView(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block font-semibold">Pay Period</span>
                  <span className="font-bold text-slate-900">
                    {selectedPayslipForView.month}/{selectedPayslipForView.year}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Employee Code</span>
                  <span className="font-bold text-indigo-600 font-mono">{selectedPayslipForView.employeeCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Days Present</span>
                  <span className="font-bold text-slate-900">
                    {selectedPayslipForView.daysPresent} / {selectedPayslipForView.totalWorkingDays} days
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Hours Worked</span>
                  <span className="font-bold text-slate-900">
                    {selectedPayslipForView.totalHoursWorked} hrs (Target: {selectedPayslipForView.requiredHours}h)
                  </span>
                </div>
              </div>

              {/* Mathematical Breakdown Table */}
              <div className="space-y-2 text-xs border border-slate-200 rounded-2xl p-4 bg-white">
                <h4 className="font-bold text-slate-900 mb-2 border-b pb-1">Mathematical Formula & Line Items</h4>

                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Base Monthly Salary:</span>
                  <span className="font-bold text-slate-900">
                    ₹{selectedPayslipForView.baseSalary.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-red-600">
                  <span>Unpaid Absent Leave Deductions:</span>
                  <span className="font-semibold">
                    - ₹{selectedPayslipForView.unpaidLeaveDeductions.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-red-600">
                  <span>Short Hours Penalty Deductions:</span>
                  <span className="font-semibold">
                    - ₹{selectedPayslipForView.hourlyDeductions.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-2 font-extrabold text-sm text-emerald-700 border-t border-slate-800 mt-2">
                  <span>NET SALARY DISBURSED:</span>
                  <span>₹{selectedPayslipForView.netSalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-center gap-2.5 text-xs">
                <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-indigo-900 font-medium">
                  When marked as PAID, employee is automatically notified in Employee Portal.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                {selectedPayslipForView.status !== 'paid' && (
                  <button
                    onClick={() => {
                      handleApprovePay(selectedPayslipForView._id, 'paid');
                      setSelectedPayslipForView(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 shadow-xs"
                  >
                    Mark Paid & Notify Employee
                  </button>
                )}
                <button
                  onClick={() => generatePayslipPDF(selectedPayslipForView)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Payroll Record"
          message="Are you sure you want to delete this generated payroll calculation record?"
          itemName={deleteTarget ? `${deleteTarget.payrollNumber} - ${deleteTarget.employeeName}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
