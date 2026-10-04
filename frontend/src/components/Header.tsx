import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const Header: React.FC<{ title?: string }> = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 border border-slate-200">
          {user?.role === 'admin' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Role</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Employee ({user?.employeeInfo?.employeeCode || 'EMP'})</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
