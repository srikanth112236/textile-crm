import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Users,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  Coffee,
  Plus,
  ChevronLeft,
  ChevronRight,
  Gift,
} from 'lucide-react';

export const AttendanceTracker: React.FC = () => {
  const { token } = useAuth();
  
  // Current selected month (YYYY-MM) and date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.substring(0, 7));
  const [dateFilter, setDateFilter] = useState<string>(todayStr);

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [breakRequests, setBreakRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'break_requests' | 'holidays'>('attendance');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Manual Adjust Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustData, setAdjustData] = useState({
    totalHours: '8',
    status: 'present',
    notes: '',
  });

  // New Holiday Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: todayStr,
    type: 'festive',
    isPaid: true,
  });

  // Request Approval Admin Note
  const [adminNoteInput, setAdminNoteInput] = useState<{ [key: string]: string }>({});

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Attendance Records for the date
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance/all?date=${dateFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Holidays
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

  // Fetch Break Requests
  const fetchBreakRequests = async () => {
    try {
      const res = await fetch(`/api/attendance-requests?month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBreakRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, token]);

  useEffect(() => {
    fetchHolidays();
    fetchBreakRequests();
  }, [selectedMonth, token]);

  // Handle Month Change
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    const newMonthStr = newDate.toISOString().substring(0, 7);
    setSelectedMonth(newMonthStr);
    setDateFilter(`${newMonthStr}-01`);
  };

  // Calculate days in month for HIRESENSE Date Strip
  const getDaysInMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month, 0);
    const daysCount = date.getDate();
    const daysArr = [];
    for (let i = 1; i <= daysCount; i++) {
      const dayNumStr = i < 10 ? `0${i}` : `${i}`;
      const fullDateStr = `${yearMonth}-${dayNumStr}`;
      const d = new Date(year, month - 1, i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = d.getDay() === 0 || d.getDay() === 6; // Sunday or Saturday
      const holiday = holidays.find((h) => h.date === fullDateStr);

      daysArr.push({
        dayNumber: i,
        dateStr: fullDateStr,
        dayName,
        isWeekend,
        holiday,
      });
    }
    return daysArr;
  };

  const daysInMonthList = getDaysInMonth(selectedMonth);

  // Submit Holiday
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.date) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(holidayForm),
      });
      if (res.ok) {
        setShowHolidayModal(false);
        setHolidayForm({ name: '', date: todayStr, type: 'festive', isPaid: true });
        fetchHolidays();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchHolidays();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Break Request Approval / Rejection
  const handleRequestStatusUpdate = async (requestId: string, status: 'approved_paid' | 'approved_deduction' | 'rejected') => {
    try {
      const note = adminNoteInput[requestId] || '';
      const res = await fetch(`/api/attendance-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (res.ok) {
        fetchBreakRequests();
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/attendance/adjust/${adjustTarget._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          totalHours: Number(adjustData.totalHours),
          status: adjustData.status,
          notes: adjustData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to adjust attendance log');
      }

      setShowAdjustModal(false);
      setAdjustTarget(null);
      fetchAttendance();
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
      const res = await fetch(`/api/attendance/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAttendance();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const shortHoursCount = attendanceRecords.filter((a) => a.clockOut && !a.metMandatoryHours).length;
  const metTargetCount = attendanceRecords.filter((a) => a.metMandatoryHours).length;
  const inProgressCount = attendanceRecords.filter((a) => a.clockIn && !a.clockOut).length;
  const pendingRequestsCount = breakRequests.filter((r) => r.status === 'pending').length;

  const filteredRecords = attendanceRecords.filter((rec) => {
    const emp = rec.employee;
    const matchesSearch =
      !searchTerm ||
      (emp?.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp?.firstName && emp.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp?.lastName && emp.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp?.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'short'
        ? rec.clockOut && !rec.metMandatoryHours
        : statusFilter === 'met'
        ? rec.metMandatoryHours
        : statusFilter === 'working'
        ? rec.clockIn && !rec.clockOut
        : true;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Attendance & Festive Schedule Dashboard" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* ULTRA-COMPACT TOP STATS BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Logged Today</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 leading-none">{attendanceRecords.length}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">{dateFilter}</span>
              </div>
            </div>
          </div>

          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Working Now</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-blue-600 leading-none">{inProgressCount}</span>
                <span className="text-[10px] text-blue-500 font-medium">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Met Target (8h+)</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-emerald-600 leading-none">{metTargetCount}</span>
                <span className="text-[10px] text-emerald-600 font-medium">Compliant</span>
              </div>
            </div>
          </div>

          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Short Hours</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-amber-600 leading-none">{shortHoursCount}</span>
                <span className="text-[10px] text-amber-600 font-medium">Flagged</span>
              </div>
            </div>
          </div>

          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Break Requests</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-purple-600 leading-none">{pendingRequestsCount}</span>
                <button 
                  onClick={() => setActiveTab('break_requests')}
                  className="text-[10px] text-purple-600 font-bold hover:underline"
                >
                  Review →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPACT MONTHLY DATE STRIP */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xs">Monthly Date Strip</h3>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• Click date to filter logs</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMonthChange('prev')}
                className="p-1 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-slate-900 text-xs px-2.5 py-0.5 bg-slate-100 rounded-lg font-mono">
                {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => handleMonthChange('next')}
                className="p-1 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowHolidayModal(true)}
                className="ml-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 transition"
              >
                <Gift className="w-3.5 h-3.5" /> Holidays
              </button>
            </div>
          </div>

          {/* Days Strip Row */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1.5 min-w-max">
              {daysInMonthList.map((item) => {
                const isSelected = dateFilter === item.dateStr;
                const isFestive = !!item.holiday;

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setDateFilter(item.dateStr)}
                    className={`flex flex-col items-center justify-between w-11 h-15 p-1.5 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105 z-10'
                        : isFestive
                        ? 'bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-300'
                        : item.isWeekend
                        ? 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:border-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {item.dayName}
                    </span>
                    <span className="text-base font-extrabold font-mono leading-none">
                      {item.dayNumber}
                    </span>

                    {/* Status Badge Tag */}
                    {isFestive ? (
                      <span className={`text-[8px] px-0.5 font-bold rounded ${isSelected ? 'bg-indigo-500 text-white' : 'bg-purple-200 text-purple-800'}`}>
                        {item.holiday.name.length > 5 ? item.holiday.name.substring(0, 4) + '..' : item.holiday.name}
                      </span>
                    ) : item.isWeekend ? (
                      <span className={`text-[8px] font-bold ${isSelected ? 'text-indigo-200' : 'text-amber-700'}`}>
                        Wknd
                      </span>
                    ) : (
                      <span className={`text-[8px] font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        Work
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COMBINED CONTROLS & TABS BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Logs ({filteredRecords.length})
            </button>

            <button
              onClick={() => setActiveTab('break_requests')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'break_requests'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Break Requests
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] bg-purple-500 text-white rounded-full">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                activeTab === 'holidays'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Holidays ({holidays.length})
            </button>
          </div>

          {activeTab === 'attendance' && (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search code, name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="working">Working Now</option>
                <option value="met">Met Target</option>
                <option value="short">Short Hours</option>
              </select>

              <CustomDatePicker
                value={dateFilter}
                onChange={(val) => {
                  setDateFilter(val);
                  setSelectedMonth(val.substring(0, 7));
                }}
                className="w-36"
              />
            </div>
          )}
        </div>

        {/* TAB 1: Daily Attendance Table */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee Code</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Clock In</th>
                    <th className="px-4 py-3">Clock Out</th>
                    <th className="px-4 py-3">Hours Logged</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Notes & Breaks</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        Loading attendance records...
                      </td>
                    </tr>
                  ) : paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        No attendance logs recorded for {dateFilter}.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((log) => {
                      const emp = log.employee;
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-bold text-indigo-600 font-mono">
                            {emp?.employeeCode || 'EMP'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {emp?.firstName} {emp?.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">{emp?.department}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'In Progress'}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{log.totalHours} hrs</td>
                          <td className="px-4 py-3">{log.mandatoryHours} hrs</td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                            {log.notes || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {!log.clockOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Working
                              </span>
                            ) : log.metMandatoryHours ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Met Target ({log.totalHours}h)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Short ({log.totalHours}h)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ActionPopover
                              actions={[
                                {
                                  label: 'Adjust Record',
                                  icon: <Edit className="w-4 h-4" />,
                                  onClick: () => {
                                    setAdjustTarget(log);
                                    setAdjustData({
                                      totalHours: log.totalHours.toString(),
                                      status: log.status || 'present',
                                      notes: log.notes || '',
                                    });
                                    setError('');
                                    setShowAdjustModal(true);
                                  },
                                },
                                {
                                  label: 'Delete Record',
                                  icon: <Trash2 className="w-4 h-4" />,
                                  danger: true,
                                  onClick: () => setDeleteTarget(log),
                                },
                              ]}
                            />
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
              totalItems={filteredRecords.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* TAB 2: Break & Adjustment Requests Queue */}
        {activeTab === 'break_requests' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs">Employee Break & Attendance Adjustment Requests</h3>
                <p className="text-[11px] text-slate-400">Review official out-of-office, lunch break, and adjustment submissions</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Employee</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Type & Reason</th>
                    <th className="px-4 py-2.5">Window & Duration</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No break or adjustment requests submitted for {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    breakRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-900">{req.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.employeeCode}</div>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{req.date}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.2 rounded font-bold text-[9px] uppercase bg-slate-100 text-slate-700 inline-block mr-1">
                            {req.breakType?.replace('_', ' ') || req.requestType}
                          </span>
                          <span className="text-slate-600 text-xs italic">"{req.reason}"</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-mono text-xs">{req.startTime || 'N/A'} - {req.endTime || 'N/A'}</div>
                          <div className="font-bold text-indigo-600">{req.durationHours} hrs</div>
                        </td>
                        <td className="px-4 py-2.5">
                          {req.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Pending
                            </span>
                          ) : req.status === 'approved_paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved (Paid)
                            </span>
                          ) : req.status === 'approved_deduction' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Approved (Deducted)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Rejected
                            </span>
                          )}
                          {req.adminNote && <p className="text-[9px] text-slate-400 mt-0.5">Note: {req.adminNote}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex flex-col items-end gap-1">
                              <input
                                type="text"
                                placeholder="Admin note..."
                                value={adminNoteInput[req._id] || ''}
                                onChange={(e) => setAdminNoteInput({ ...adminNoteInput, [req._id]: e.target.value })}
                                className="px-2 py-1 bg-slate-50 border rounded text-[10px] w-36"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRequestStatusUpdate(req._id, 'approved_paid')}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold"
                                >
                                  Approve (Paid)
                                </button>
                                <button
                                  onClick={() => handleRequestStatusUpdate(req._id, 'approved_deduction')}
                                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[9px] font-bold"
                                >
                                  Approve (Deduct)
                                </button>
                                <button
                                  onClick={() => handleRequestStatusUpdate(req._id, 'rejected')}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-bold"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Configured Holidays */}
        {activeTab === 'holidays' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs">Festive Days & Public Holiday Calendar Rules</h3>
                <p className="text-[11px] text-slate-400">Configured holidays automatically highlight on employee attendance calendars</p>
              </div>
              <button
                onClick={() => setShowHolidayModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Festive Day
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {holidays.length === 0 ? (
                <div className="col-span-full text-center py-6 text-slate-400 text-xs">
                  No custom festive days or holidays added yet. Click "Add Festive Day" above.
                </div>
              ) : (
                holidays.map((h) => (
                  <div key={h._id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-800">
                        {h.type}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-xs mt-0.5">{h.name}</h4>
                      <p className="text-[11px] font-mono text-indigo-600 font-bold mt-0.5">{h.date}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(h._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Add Holiday Modal */}
        {showHolidayModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">Add Festive Day / Public Holiday</h3>
                <button onClick={() => setShowHolidayModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHoliday} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Holiday Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali, Christmas, Factory Annual Day"
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Holiday Date</label>
                  <CustomDatePicker
                    value={holidayForm.date}
                    onChange={(val) => setHolidayForm({ ...holidayForm, date: val })}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category Type</label>
                    <select
                      value={holidayForm.type}
                      onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="festive">Festive Day</option>
                      <option value="public_holiday">Public Holiday</option>
                      <option value="weekend">Special Weekend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Paid Status</label>
                    <select
                      value={holidayForm.isPaid ? 'true' : 'false'}
                      onChange={(e) => setHolidayForm({ ...holidayForm, isPaid: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="true">Paid Holiday</option>
                      <option value="false">Unpaid Holiday</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowHolidayModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold shadow-xs"
                  >
                    {actionLoading ? 'Saving...' : 'Save Holiday'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Record Modal */}
        {showAdjustModal && adjustTarget && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">Adjust Attendance Record</h3>
                <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Employee</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {adjustTarget.employee?.firstName} {adjustTarget.employee?.lastName} ({adjustTarget.employee?.employeeCode})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Hours Worked</label>
                    <input
                      type="number"
                      step="0.5"
                      value={adjustData.totalHours}
                      onChange={(e) => setAdjustData({ ...adjustData, totalHours: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={adjustData.status}
                      onChange={(e) => setAdjustData({ ...adjustData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half_day">Half Day</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager Note / Adjustment Reason</label>
                  <textarea
                    rows={2}
                    value={adjustData.notes}
                    onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="Manual shift adjustment by admin..."
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold shadow-xs"
                  >
                    {actionLoading ? 'Saving...' : 'Save Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Attendance Log"
          message="Are you sure you want to delete this attendance log entry?"
          itemName={deleteTarget ? `${deleteTarget.employee?.employeeCode} - ${dateFilter}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
