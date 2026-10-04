import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import { Shirt, Building2, User, Mail, Phone, MapPin, Tag, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, KeyRound, Key } from 'lucide-react';

export const RegisterAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [form, setForm] = useState({
    companyName: '',
    industry: 'Textile Manufacturing & Weaving Mills',
    taxId: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.companyName || !form.contactName || !form.email) {
      setError('Company Name, Contact Name, and Admin Email are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/register-company'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setCreatedCredentials(data.credentials);
      if (data.token && data.user) {
        authLogin(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPasswordChange = () => {
    navigate('/force-change-password');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col md:flex-row min-h-[680px]">
        {/* Left Side: Form Controls */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-between bg-white">
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
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register Textile Enterprise Company</h2>
              <p className="text-xs text-slate-500 mt-1">
                Setup your factory ERP workspace & provision initial Super Administrator account.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
              {/* Company Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" /> Company Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Textile Mills Pvt Ltd"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Industry Type</label>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="Textile Manufacturing & Weaving Mills">Textile Manufacturing & Weaving Mills</option>
                      <option value="Garment & Apparel Production">Garment & Apparel Production</option>
                      <option value="Spinning & Yarn Processing">Spinning & Yarn Processing</option>
                      <option value="Dyeing & Printing Works">Dyeing & Printing Works</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GST / Tax Registration ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      value={form.taxId}
                      onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Head Office Address</label>
                    <input
                      type="text"
                      placeholder="Industrial Zone, Sector 4..."
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Administrator Info */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> Super Administrator Contact
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Srikanth Veda"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@textilecompany.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Provisioning Enterprise Account...' : 'Register Company & Provision Credentials'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500">
                Sign in to your portal →
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Hero Inspiration Artwork & Feature Callouts */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Hero Pill */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold text-[11px] rounded-full backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise Factory Onboarding</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="relative z-10 my-8 space-y-4">
            <h3 className="text-2xl font-extrabold text-white leading-tight tracking-tight">
              Provision your textile manufacturing workspace in seconds.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Empower your plant managers, shift supervisors, and finance teams with role-based access control and automated compliance.
            </p>

            {/* Checklist */}
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Super Admin Provisioning</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GST Tax & Invoice Customization</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Department Shift & Attendance System</span>
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

      {/* Credentials Summary Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Company Registered Successfully!</h3>
              <p className="text-xs text-slate-500">
                Temporary Super Admin credentials generated below:
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Admin Email:</span>
                <span className="font-mono font-bold text-slate-900">{createdCredentials.email}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Temporary Password:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>You will be prompted to set your secure password on first login.</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPasswordChange}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              Set Secure Password & Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
