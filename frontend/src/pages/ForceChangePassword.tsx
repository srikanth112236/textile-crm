import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import { Shirt, KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, LogOut } from 'lucide-react';

export const ForceChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token, login, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccess(true);
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        login(data.token, updatedUser);
      }

      setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col md:flex-row min-h-[600px]">
        {/* Left Side: Form Controls */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-md shadow-emerald-600/30">
                <Shirt className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Textile<span className="text-emerald-600">ERP</span>
              </span>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">First-Time Password Setup</h2>
              <p className="text-xs text-slate-500 mt-1">
                Security policy requires you to update your temporary credentials before accessing your dashboard.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password updated successfully! Redirecting to your dashboard...</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Updating Password...' : 'Save Password & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={logout}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Cancel & Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Side: Hero Inspiration Artwork & Feature Callouts */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Hero Pill */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold text-[11px] rounded-full backdrop-blur-xs">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Account Security Enforcement</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="relative z-10 my-8 space-y-4">
            <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Protecting your enterprise workspace credentials.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Changing your initial password ensures that only authorized personnel have access to administrative and payroll modules.
            </p>

            {/* Checklist */}
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bcrypt Salted & Hashed Password Storage</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>JWT Token Session Security</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Role-Based Route Guards</span>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 Textile Enterprise ERP</span>
            <span className="font-semibold text-slate-300">ENG v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
