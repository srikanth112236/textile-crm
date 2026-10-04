import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Sliders, Clock, Calendar, DollarSign, CheckCircle2, AlertCircle, Save, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';

export const SalarySettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    workingDaysPerMonth: 26,
    mandatoryDailyHours: 8,
    workdaySchedule: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    monthlyPaidLeaves: 2,
    yearlyPaidLeaves: 24,
    baseSalaryPercentage: 50,
    hraPercentage: 20,
    daPercentage: 15,
    specialAllowancePercentage: 15,
    pfDeductionPercentage: 12,
    esiPercentage: 1.75,
    overtimeRatePerHour: 250,
    shortHoursDeductionEnabled: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/salary-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          workingDaysPerMonth: data.workingDaysPerMonth ?? 26,
          mandatoryDailyHours: data.mandatoryDailyHours ?? 8,
          workdaySchedule: {
            monday: data.workdaySchedule?.monday ?? true,
            tuesday: data.workdaySchedule?.tuesday ?? true,
            wednesday: data.workdaySchedule?.wednesday ?? true,
            thursday: data.workdaySchedule?.thursday ?? true,
            friday: data.workdaySchedule?.friday ?? true,
            saturday: data.workdaySchedule?.saturday ?? true,
            sunday: data.workdaySchedule?.sunday ?? false,
          },
          monthlyPaidLeaves: data.monthlyPaidLeaves ?? 2,
          yearlyPaidLeaves: data.yearlyPaidLeaves ?? 24,
          baseSalaryPercentage: data.baseSalaryPercentage ?? 50,
          hraPercentage: data.hraPercentage ?? 20,
          daPercentage: data.daPercentage ?? 15,
          specialAllowancePercentage: data.specialAllowancePercentage ?? 15,
          pfDeductionPercentage: data.pfDeductionPercentage ?? 12,
          esiPercentage: data.esiPercentage ?? 1.75,
          overtimeRatePerHour: data.overtimeRatePerHour ?? 250,
          shortHoursDeductionEnabled: data.shortHoursDeductionEnabled ?? true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleToggleDay = (dayKey: keyof typeof settings.workdaySchedule) => {
    setSettings((prev) => ({
      ...prev,
      workdaySchedule: {
        ...prev.workdaySchedule,
        [dayKey]: !prev.workdaySchedule[dayKey],
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/salary-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update salary settings');
      }

      setMessage('Salary components, workday schedule, and rules saved successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dayLabels: { key: keyof typeof settings.workdaySchedule; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Salary Components, Workday Schedule & Rule Config" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {message && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-3 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs flex items-center gap-3 border border-red-200 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: Attendance & Working Hours Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Attendance & Mandatory Working Hours Rules</h3>
                <p className="text-xs text-slate-400">Configure mandatory daily hours and active weekly workdays</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Daily Working Hours</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={settings.mandatoryDailyHours}
                  onChange={(e) => setSettings({ ...settings, mandatoryDailyHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Mandatory hours required per day (e.g. 8 hrs)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Monthly Working Days</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.workingDaysPerMonth}
                  onChange={(e) => setSettings({ ...settings, workingDaysPerMonth: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standard monthly working days (e.g. 26 days)</span>
              </div>
            </div>

            {/* WEEKDAY WORKDAY SCHEDULE TOGGLES */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Workday Schedule Config</h4>
              <p className="text-xs text-slate-400">Toggle days on/off to define active working days vs weekend holidays</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {dayLabels.map(({ key, label }) => {
                  const isWorkday = settings.workdaySchedule[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToggleDay(key)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-2 ${
                        isWorkday
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isWorkday ? 'bg-indigo-600 text-white' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {isWorkday ? 'Active Workday' : 'Weekend Off'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Paid Leave Policies */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Paid Leave Policies (Monthly & Yearly)</h3>
                <p className="text-xs text-slate-400">Approved leave quotas exempt from salary deduction</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Monthly Paid Leaves</label>
                <input
                  type="number"
                  min="0"
                  value={settings.monthlyPaidLeaves}
                  onChange={(e) => setSettings({ ...settings, monthlyPaidLeaves: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Yearly Paid Leaves</label>
                <input
                  type="number"
                  min="0"
                  value={settings.yearlyPaidLeaves}
                  onChange={(e) => setSettings({ ...settings, yearlyPaidLeaves: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Detailed Salary Components & Deductions Structure */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Salary Components, Overtime Pay & Deductions Structure</h3>
                <p className="text-xs text-slate-400">Configure HRA, DA, PF, ESI, Overtime Pay Rate, and Short Hours Rules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Basic Pay (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.baseSalaryPercentage}
                  onChange={(e) => setSettings({ ...settings, baseSalaryPercentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">HRA Allowance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.hraPercentage}
                  onChange={(e) => setSettings({ ...settings, hraPercentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">DA Allowance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.daPercentage}
                  onChange={(e) => setSettings({ ...settings, daPercentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Allowance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.specialAllowancePercentage}
                  onChange={(e) => setSettings({ ...settings, specialAllowancePercentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PF Deduction (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.pfDeductionPercentage}
                  onChange={(e) => setSettings({ ...settings, pfDeductionPercentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ESI Deduction (%)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="100"
                  value={settings.esiPercentage}
                  onChange={(e) => setSettings({ ...settings, esiPercentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Overtime Pay Rate (₹ / hr)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.overtimeRatePerHour}
                  onChange={(e) => setSettings({ ...settings, overtimeRatePerHour: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600 text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Short Hours Penalty Deduction</span>
                <span className="text-[11px] text-slate-400">Deduct salary automatically for short uncompleted hours on present days</span>
              </div>
              <input
                type="checkbox"
                checked={settings.shortHoursDeductionEnabled}
                onChange={(e) => setSettings({ ...settings, shortHoursDeductionEnabled: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md shadow-indigo-600/20 text-xs flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving Rules & Components...' : 'Save Global Rules & Components'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
