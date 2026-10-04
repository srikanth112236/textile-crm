import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/ui/Pagination';
import { DollarSign, FileText, Printer, CheckCircle2, Clock, X, Eye, ShieldCheck, Building2 } from 'lucide-react';

export const EmployeePayslips: React.FC = () => {
  const { token, user } = useAuth();
  const emp = user?.employeeInfo;

  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payslip Sheet Modal State
  const [viewingPayslip, setViewingPayslip] = useState<any | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payroll/my-payslips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayslips(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [token]);

  const handlePrintPayslip = () => {
    window.print();
  };

  const totalPages = Math.ceil(payslips.length / pageSize) || 1;
  const paginatedPayslips = payslips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="My Salary Details & Payslips" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Base Salary Overview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Salary Configured</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ₹{emp?.baseSalary ? emp.baseSalary.toLocaleString() : 'N/A'} <span className="text-xs text-slate-400 font-normal">/ month</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {emp?.mandatoryWorkingHours || 8} Mandatory Hours / Day • {emp?.department || 'Production'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center text-xs space-y-1">
            <span className="text-slate-400 block font-semibold">Total Payslips Issued</span>
            <span className="font-extrabold text-indigo-600 text-lg block">
              {payslips.length} Payslip Statements
            </span>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-sm">Issued Monthly Salary Statements</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Payslip #</th>
                  <th className="px-5 py-3.5">Month / Year</th>
                  <th className="px-5 py-3.5">Days Present</th>
                  <th className="px-5 py-3.5">Hours Worked</th>
                  <th className="px-5 py-3.5">Base Salary</th>
                  <th className="px-5 py-3.5">Total Deductions</th>
                  <th className="px-5 py-3.5">Net Payable</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      Loading payslips...
                    </td>
                  </tr>
                ) : paginatedPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No payslips generated yet by Admin.
                    </td>
                  </tr>
                ) : (
                  paginatedPayslips.map((p) => {
                    const totalDeduction = (p.hourlyDeductions || 0) + (p.unpaidLeaveDeductions || 0);
                    return (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-indigo-600 font-mono">{p.payrollNumber}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {p.month}/{p.year}
                        </td>
                        <td className="px-5 py-3.5">{p.daysPresent} Days</td>
                        <td className="px-5 py-3.5">{p.totalHoursWorked} hrs</td>
                        <td className="px-5 py-3.5 font-mono">₹{p.baseSalary?.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-mono text-red-600">
                          {totalDeduction > 0 ? `-₹${totalDeduction.toLocaleString()}` : '₹0'}
                        </td>
                        <td className="px-5 py-3.5 font-extrabold text-slate-900 font-mono">
                          ₹{p.netSalary?.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          {p.status === 'paid' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setViewingPayslip(p)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1 ml-auto transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={payslips.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Printable Payslip Modal */}
        {viewingPayslip && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-slate-100 my-8">
              {/* Header Actions */}
              <div className="flex items-center justify-between border-b pb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Employee Payslip Statement</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPayslip}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setViewingPayslip(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Payslip Document Content */}
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6 font-sans">
                {/* Company Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">TEXTILE ENTERPRISE ERP</h2>
                      <p className="text-xs text-slate-500 font-medium">Textile Manufacturing & Mills Private Ltd.</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-mono font-bold text-indigo-600 block text-sm">{viewingPayslip.payrollNumber}</span>
                    <span className="text-slate-400 font-semibold block mt-0.5">
                      Pay Period: {viewingPayslip.month}/{viewingPayslip.year}
                    </span>
                  </div>
                </div>

                {/* Employee Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Employee Name</span>
                    <span className="font-bold text-slate-900 text-sm">{viewingPayslip.employeeName || user?.name}</span>
                    <span className="text-slate-500 block font-mono text-[11px] mt-0.5">Code: {viewingPayslip.employeeCode || emp?.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Department & Role</span>
                    <span className="font-bold text-slate-900 text-sm">{emp?.department || 'Weaving'}</span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">{emp?.designation || 'Operator'}</span>
                  </div>
                </div>

                {/* Attendance Summary Grid */}
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px]">Total Month Days</span>
                    <span className="font-extrabold text-slate-900 text-sm">{viewingPayslip.totalWorkingDays || 26}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px]">Days Present</span>
                    <span className="font-extrabold text-emerald-600 text-sm">{viewingPayslip.daysPresent}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px]">Days Absent</span>
                    <span className="font-extrabold text-amber-600 text-sm">{viewingPayslip.daysAbsent}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px]">Hours Logged</span>
                    <span className="font-extrabold text-indigo-600 text-sm">{viewingPayslip.totalHoursWorked} h</span>
                  </div>
                </div>

                {/* Financial Earnings & Deductions Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Salary Component / Deduction</th>
                        <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">Base Monthly Salary</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          ₹{viewingPayslip.baseSalary?.toLocaleString()}
                        </td>
                      </tr>
                      {viewingPayslip.unpaidLeaveDeductions > 0 && (
                        <tr>
                          <td className="px-4 py-2.5 font-sans text-red-600">Unpaid Leave Deductions</td>
                          <td className="px-4 py-2.5 text-right text-red-600">
                            -₹{viewingPayslip.unpaidLeaveDeductions?.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {viewingPayslip.hourlyDeductions > 0 && (
                        <tr>
                          <td className="px-4 py-2.5 font-sans text-red-600">Short Hours Deductions</td>
                          <td className="px-4 py-2.5 text-right text-red-600">
                            -₹{viewingPayslip.hourlyDeductions?.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-50 font-bold border-t border-slate-200 text-sm">
                        <td className="px-4 py-3 font-sans text-slate-900">Net Payable Amount</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-extrabold text-base">
                          ₹{viewingPayslip.netSalary?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Status */}
                <div className="flex justify-between items-center text-xs pt-2">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Computer Generated Payslip Statement
                  </div>
                  <span className="font-bold uppercase px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                    STATUS: {viewingPayslip.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
