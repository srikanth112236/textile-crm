import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/ui/Pagination';
import { Clock, CheckCircle2, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Gift } from 'lucide-react';

export const EmployeeAttendanceHistory: React.FC = () => {
  const { token } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.substring(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [logs, setLogs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/my-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
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
    fetchLogs();
    fetchHolidays();
  }, [token]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    const newMonthStr = newDate.toISOString().substring(0, 7);
    setSelectedMonth(newMonthStr);
    setSelectedDate(`${newMonthStr}-01`);
  };

  // Generate day pills for selected month
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
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const holiday = holidays.find((h) => h.date === fullDateStr);
      const logForDate = logs.find((l) => l.date === fullDateStr);

      daysArr.push({
        dayNumber: i,
        dateStr: fullDateStr,
        dayName,
        isWeekend,
        holiday,
        logForDate,
      });
    }
    return daysArr;
  };

  const daysInMonthList = getDaysInMonth(selectedMonth);

  // Filter logs by selected date if selected, else month
  const filteredLogs = logs.filter((l) => l.date && l.date.startsWith(selectedMonth));

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="My Monthly Attendance Calendar & Log" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* HIRESENSE Monthly Calendar Date Strip */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Monthly Attendance View</h3>
                <p className="text-xs text-slate-400">View your daily hours, festive days, and holiday schedule</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMonthChange('prev')}
                className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-slate-900 text-sm px-3 py-1 bg-slate-100 rounded-xl font-mono">
                {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => handleMonthChange('next')}
                className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Grid Scrollable Strip */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {daysInMonthList.map((item) => {
                const isSelected = selectedDate === item.dateStr;
                const isFestive = !!item.holiday;
                const log = item.logForDate;

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`flex flex-col items-center justify-between w-14 h-20 p-2 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-105 z-10'
                        : isFestive
                        ? 'bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-300'
                        : item.isWeekend
                        ? 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:border-amber-300'
                        : log?.metMandatoryHours
                        ? 'bg-emerald-50/60 text-emerald-900 border-emerald-200/80'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {item.dayName}
                    </span>
                    <span className="text-lg font-extrabold font-mono leading-none">
                      {item.dayNumber}
                    </span>

                    {/* Status Badge Tag */}
                    {isFestive ? (
                      <span className={`text-[9px] px-1 font-bold rounded ${isSelected ? 'bg-indigo-500 text-white' : 'bg-purple-200 text-purple-800'}`}>
                        {item.holiday.name.length > 6 ? item.holiday.name.substring(0, 5) + '..' : item.holiday.name}
                      </span>
                    ) : log ? (
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-indigo-200' : log.metMandatoryHours ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {log.totalHours}h
                      </span>
                    ) : item.isWeekend ? (
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-indigo-200' : 'text-amber-700'}`}>
                        Weekend
                      </span>
                    ) : (
                      <span className={`text-[9px] font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        Off
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Logs Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-extrabold text-slate-900 text-sm">
              Attendance Records for {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              Total Logged: {filteredLogs.reduce((acc, l) => acc + (l.totalHours || 0), 0)} Hours
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Hours Logged</th>
                  <th className="px-5 py-3.5">Mandatory Target</th>
                  <th className="px-5 py-3.5">Notes & Approved Breaks</th>
                  <th className="px-5 py-3.5">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading history...
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No attendance logs recorded for {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{log.date}</td>
                      <td className="px-5 py-3.5 font-mono">
                        {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'In Progress'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{log.totalHours} hrs</td>
                      <td className="px-5 py-3.5">{log.mandatoryHours} hrs</td>
                      <td className="px-5 py-3.5 text-slate-500 italic max-w-xs truncate">{log.notes || '—'}</td>
                      <td className="px-5 py-3.5">
                        {log.metMandatoryHours ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Met Target
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Short Hours
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
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      </main>
    </div>
  );
};
