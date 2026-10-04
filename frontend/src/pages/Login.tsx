import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [demoRole, setDemoRole] = useState<'admin' | 'employee'>('admin');

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      login(data.token, data.user);

      if (data.user.mustChangePassword) {
        navigate('/force-change-password');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillDemo = (role: 'admin' | 'employee') => {
    setDemoRole(role);
    if (role === 'admin') {
      setEmail('superadmin@gmail.com');
      setPassword('admin123');
    } else {
      setEmail('employee@textile.com');
      setPassword('emp123456');
    }
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col md:flex-row min-h-[640px]">
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
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Login to your account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to access the Textile Enterprise portal.
              </p>
            </div>

            {/* Demo Quick Selector */}
            <div className="mt-6 p-1.5 bg-slate-100/80 rounded-2xl flex items-center gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleAutofillDemo('admin')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  demoRole === 'admin'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleAutofillDemo('employee')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  demoRole === 'employee'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Employee Login</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                    }}
                    placeholder="name@textile-erp.com"
                    className={`block w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 ${
                      fieldErrors.email
                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                        : 'border-slate-200 focus:ring-emerald-500 focus:bg-white'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 ${
                      fieldErrors.password
                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                        : 'border-slate-200 focus:ring-emerald-500 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-700">Keep me logged in</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="font-bold text-emerald-600 hover:text-emerald-500 transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Need an initial Admin account?{' '}
              <Link to="/register-admin" className="font-bold text-emerald-600 hover:text-emerald-500">
                Register Admin
              </Link>
            </p>
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
              <Shirt className="w-3.5 h-3.5" />
              <span>Next-Gen ERP for Textile Manufacturing</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="relative z-10 my-8 space-y-4">
            <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Turn complex operations into strategic, real-time enterprise growth.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Manage inventory stock levels, automated multi-component payroll, attendance tracking, and customer billing seamlessly in one handpicked platform.
            </p>

            {/* Checklist */}
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Payroll & Dynamic Salary Deductions</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time Goods Assignment & Customer Accounts</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Printable Billing Invoices & Stock Reorder Alerts</span>
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

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-slate-800">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <KeyRound className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Forgot Password?</h3>
                <p className="text-xs text-slate-500">Account Password Reset Guidance</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              For security reasons, system administrators can reset employee passwords directly from the{' '}
              <span className="font-bold text-slate-900">Admin Directory</span>. If you are an Admin, you can update credentials from your portal.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
