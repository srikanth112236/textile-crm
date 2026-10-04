import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import { Shirt, Building2, User, Mail, Phone, MapPin, Tag, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Key } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30">
            <Shirt className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Register Textile Enterprise Company
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Setup your factory ERP workspace & provision initial Super Administrator account
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Company Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Textile Mills Pvt Ltd"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Industry Type</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Textile Manufacturing & Weaving Mills">Textile Manufacturing & Weaving Mills</option>
                    <option value="Garment & Apparel Production">Garment & Apparel Production</option>
                    <option value="Spinning & Yarn Processing">Spinning & Yarn Processing</option>
                    <option value="Dyeing & Printing Works">Dyeing & Printing Works</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GST / Tax Registration ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    value={form.taxId}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Head Office Address</label>
                  <input
                    type="text"
                    placeholder="Industrial Zone, Sector 4..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Administrator Info */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Super Administrator Contact
              </h3>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Srikanth Veda"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@textilecompany.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 text-xs transition flex items-center justify-center gap-2"
              >
                {loading ? 'Provisioning Enterprise Account...' : 'Register Company & Provision Credentials'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-indigo-400 font-bold hover:underline">
                Sign in to your portal →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Credentials Summary Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Company Registered Successfully!</h3>
              <p className="text-xs text-slate-400">
                Temporary Super Admin credentials generated below:
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Admin Email:</span>
                <span className="font-mono font-bold text-white">{createdCredentials.email}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Temporary Password:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span>You will be prompted to set your secure password on first login.</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPasswordChange}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              Set Secure Password & Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
