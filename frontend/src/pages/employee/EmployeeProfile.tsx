import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { User as UserIcon, Lock, ShieldCheck, Mail, Phone, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const EmployeeProfile: React.FC = () => {
  const { token, user, updateUser } = useAuth();
  const emp = user?.employeeInfo;

  const [firstName, setFirstName] = useState(emp?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(emp?.lastName || user?.name?.split(' ')[1] || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfileMessage('Profile details updated successfully');
      if (data.user) {
        updateUser(data.user);
      }
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="My Employee Profile & Credentials" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-600/20">
              {user?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider block">
                ID: {emp?.employeeCode || 'EMP-1001'}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {emp?.designation || 'Staff Member'} • {emp?.department || 'Textile Department'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Joining Date</span>
              <span className="font-bold text-slate-900 font-mono">
                {emp?.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Base Salary</span>
              <span className="font-bold text-emerald-600 font-mono">
                ₹{emp?.baseSalary ? emp.baseSalary.toLocaleString() : 'N/A'}/mo
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Daily Target</span>
              <span className="font-bold text-indigo-600 font-mono">
                {emp?.mandatoryWorkingHours || 8} Hours
              </span>
            </div>
          </div>
        </div>

        {/* Edit Personal Profile Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-600" /> Personal Information
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Email & Phone are read-only</span>
          </div>

          {profileMessage && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-xs flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          {profileError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || emp?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={emp?.phone || 'Not Provided'}
                  className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Security Password Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" /> Security & Password Settings
            </h3>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>

          {passwordMessage && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-xs flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="Enter your current password..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
              >
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
