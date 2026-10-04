import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Clock, Play, Square, AlertTriangle, CheckCircle2, ListOrdered, Bell, Coffee, Plus, X, AlertCircle, ShieldCheck, UserCheck, Umbrella, Calendar } from 'lucide-react';
import { NotificationItem } from '../../types';

export const EmployeeDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [todayStatus, setTodayStatus] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myBreakRequests, setMyBreakRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [warningAlert, setWarningAlert] = useState<string | null>(null);

  // Break Request Modal state
  const todayStr = new Date().toISOString().split('T')[0];
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakForm, setBreakForm] = useState({
    date: todayStr,
    requestType: 'break',
    breakType: 'official_out',
    startTime: '13:00',
    endTime: '14:00',
    durationHours: '1',
    reason: '',
  });
  const [breakError, setBreakError] = useState('');

  const fetchTodayStatus = async () => {
    try {
      const res = await fetch('/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTodayStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyBreakRequests = async () => {
    try {
      const res = await fetch('/api/attendance-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyBreakRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchNotifications();
    fetchMyBreakRequests();
  }, [token]);

  const handleClockIn = async () => {
    setActionLoading(true);
    setAlertMessage(null);
    setWarningAlert(null);

    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to clock in');
      }

      setAlertMessage(data.message);
      fetchTodayStatus();
    } catch (err: any) {
      setWarningAlert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setAlertMessage(null);
    setWarningAlert(null);

    try {
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to clock out');
      }

      setAlertMessage(data.message);
      if (data.warningMessage) {
        setWarningAlert(data.warningMessage);
      }
      fetchTodayStatus();
    } catch (err: any) {
      setWarningAlert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitBreakRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakForm.reason) {
      setBreakError('Please provide a reason for the break or out request.');
      return;
    }

    setActionLoading(true);
    setBreakError('');

    try {
      const res = await fetch('/api/attendance-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(breakForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit break request');
      }

      setShowBreakModal(false);
      setBreakForm({
        date: todayStr,
        requestType: 'break',
        breakType: 'official_out',
        startTime: '13:00',
        endTime: '14:00',
        durationHours: '1',
        reason: '',
      });
      fetchMyBreakRequests();
    } catch (err: any) {
      setBreakError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const emp = user?.employeeInfo;
  const targetHours = todayStatus?.mandatoryHours || emp?.mandatoryWorkingHours || 8;
  const totalLogged = todayStatus?.totalHours || 0;
  const remainingHours = Math.max(0, parseFloat((targetHours - totalLogged).toFixed(2)));
  const progressPercent = Math.min(100, Math.round((totalLogged / targetHours) * 100));
  const isClockedIn = todayStatus?.isCurrentlyClockedIn || false;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Employee Workspace & Attendance Clock" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Info & Quick Actions Banner */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20">
              {user?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase font-mono tracking-wider">
                ID: {emp?.employeeCode || 'EMP-1001'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {emp?.designation || 'Staff'} • {emp?.department || 'Textile Department'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowBreakModal(true)}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl text-xs flex items-center gap-2 border border-purple-200/80 transition shadow-xs"
            >
              <Coffee className="w-4 h-4" /> Request Out / Break Time
            </button>

            <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80 text-center text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Mandatory Daily Target</span>
              <span className="font-extrabold text-indigo-600 text-sm block font-mono">
                {targetHours} Hours / Day
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged Today</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{totalLogged} hrs</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{todayStr}</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Status</p>
              <h3 className={`text-xl font-extrabold mt-1 ${totalLogged >= targetHours ? 'text-emerald-600' : 'text-amber-600'}`}>
                {totalLogged >= targetHours ? 'Completed' : `${remainingHours}h Left`}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{progressPercent}% Achieved</p>
            </div>
            <div className={`p-2.5 rounded-xl ${totalLogged >= targetHours ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Break Requests</p>
              <h3 className="text-xl font-extrabold text-purple-600 mt-1 font-mono">{myBreakRequests.length}</h3>
              <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
                {myBreakRequests.filter(r => r.status === 'pending').length} Pending
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Coffee className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unread Alerts</p>
              <h3 className="text-xl font-extrabold text-blue-600 mt-1 font-mono">{notifications.length}</h3>
              <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Notifications</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Notifications Alert Banner */}
        {notifications.length > 0 && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              Notifications & Updates ({notifications.length})
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n._id} className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 mr-2">{n.title}</span>
                    <span className="text-slate-600">{n.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clock Alerts */}
        {alertMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{alertMessage}</span>
          </div>
        )}

        {warningAlert && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-2xl text-xs flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-semibold">{warningAlert}</span>
          </div>
        )}

        {/* HERO: Attendance Clock & Progress Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isClockedIn ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Today's Work Session Tracker
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {isClockedIn ? 'Currently Working (Session Active)' : 'Work Session Paused / Out'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged Today: <strong className="text-slate-900">{totalLogged} hrs</strong> / Mandatory Target: <strong className="text-slate-900">{targetHours} hrs</strong>
                </p>
              </div>
            </div>

            {/* Toggle Action Button */}
            <div>
              {isClockedIn ? (
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-md shadow-amber-600/20 transition flex items-center gap-2 text-xs"
                >
                  <Square className="w-4 h-4 fill-white" />
                  {actionLoading ? 'Clocking Out Session...' : 'Clock Out Session'}
                </button>
              ) : (
                <button
                  onClick={handleClockIn}
                  disabled={actionLoading}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 text-xs"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {actionLoading ? 'Clocking In...' : 'Clock In (New Session)'}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar towards 8 Hours Target */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Daily 8-Hour Mandatory Target Progress</span>
              <span className={totalLogged >= targetHours ? 'text-emerald-600' : 'text-amber-600'}>
                {totalLogged >= targetHours ? '✓ Mandatory Target Completed' : `Short by ${remainingHours} hrs (${progressPercent}%)`}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${totalLogged >= targetHours ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: My Break Requests & Today's Work Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Break & Out Requests List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Coffee className="w-4 h-4 text-purple-600" />
              My Break & Out Requests ({myBreakRequests.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Type & Reason</th>
                    <th className="px-3 py-2.5">Window</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBreakRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        No break requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    myBreakRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">{req.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-slate-800 uppercase text-[9px] bg-slate-100 px-1.5 py-0.5 rounded block w-fit mb-0.5">
                            {req.breakType?.replace('_', ' ')}
                          </span>
                          <span className="text-slate-500 italic text-[11px]">"{req.reason}"</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px]">
                          {req.startTime || 'N/A'} - {req.endTime || 'N/A'} ({req.durationHours}h)
                        </td>
                        <td className="px-3 py-2.5">
                          {req.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Pending
                            </span>
                          ) : req.status === 'approved_paid' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved (Paid)
                            </span>
                          ) : req.status === 'approved_deduction' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Approved (Deducted)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
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
          </div>

          {/* Logged Work Sessions List for Today */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-600" />
              Today's Logged Work Sessions ({todayStatus?.logs?.length || 0})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Session #</th>
                    <th className="px-3 py-2.5">Clock In</th>
                    <th className="px-3 py-2.5">Clock Out</th>
                    <th className="px-3 py-2.5">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        Loading sessions...
                      </td>
                    </tr>
                  ) : !todayStatus?.logs || todayStatus.logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        No sessions clocked in today yet. Click "Clock In" to start.
                      </td>
                    </tr>
                  ) : (
                    todayStatus.logs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-indigo-600 font-mono">Session #{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono">
                          {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'Active'}
                        </td>
                        <td className="px-3 py-2.5 font-extrabold text-slate-900">
                          {log.clockOut ? `${log.durationHours} hrs` : 'Working...'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Break / Out Request Modal */}
        {showBreakModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-purple-600" />
                  Request Break / Out-of-Office Time
                </h3>
                <button onClick={() => setShowBreakModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {breakError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{breakError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitBreakRequest} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={breakForm.date}
                      onChange={(e) => setBreakForm({ ...breakForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Break Category</label>
                    <select
                      value={breakForm.breakType}
                      onChange={(e) => setBreakForm({ ...breakForm, breakType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="official_out">Official Out of Office</option>
                      <option value="lunch">Lunch / Meal Break</option>
                      <option value="personal_break">Personal Emergency Break</option>
                      <option value="shift_adjustment">Shift Time Adjustment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={breakForm.startTime}
                      onChange={(e) => setBreakForm({ ...breakForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={breakForm.endTime}
                      onChange={(e) => setBreakForm({ ...breakForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={breakForm.durationHours}
                      onChange={(e) => setBreakForm({ ...breakForm, durationHours: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Break / Out Request</label>
                  <textarea
                    rows={3}
                    required
                    value={breakForm.reason}
                    onChange={(e) => setBreakForm({ ...breakForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                    placeholder="e.g. Visiting textile machinery supplier for replacement parts..."
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowBreakModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 font-bold shadow-xs"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Request to Admin'}
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
