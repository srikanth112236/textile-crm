import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  FileText,
  Clock,
  DollarSign,
  User,
  LogOut,
  Shirt,
  Sliders,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: propsCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleToggle = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
    if (onToggleCollapse) onToggleCollapse();
  };

  const isCollapsed = propsCollapsed !== undefined ? propsCollapsed : collapsed;

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 relative group ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-bold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    } ${isCollapsed ? 'justify-center px-2' : ''}`;

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white text-slate-800 flex flex-col h-screen sticky top-0 border-r border-slate-200/80 shadow-xs z-30 transition-all duration-300 shrink-0`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-600/20 shrink-0">
            <Shirt className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                Textile<span className="text-indigo-600 font-normal">ERP</span>
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">
                {user?.role} Portal
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleToggle}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Navigation
          </div>
        )}

        {isAdmin ? (
          <>
            <NavLink to="/admin/dashboard" className={linkStyle} title="Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to="/admin/employees" className={linkStyle} title="Employees">
              <Users className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Employees</span>}
            </NavLink>
            <NavLink to="/admin/customers" className={linkStyle} title="Customers">
              <UserCheck className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Customers</span>}
            </NavLink>
            <NavLink to="/admin/products" className={linkStyle} title="Products & Stock">
              <Package className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Products & Stock</span>}
            </NavLink>
            <NavLink to="/admin/invoices" className={linkStyle} title="Billing & Invoices">
              <FileText className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Billing & Invoices</span>}
            </NavLink>

            {!isCollapsed && (
              <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Rules & Operations
              </div>
            )}
            <NavLink to="/admin/attendance" className={linkStyle} title="Attendance Monitor">
              <Clock className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Attendance Monitor</span>}
            </NavLink>
            <NavLink to="/admin/leaves" className={linkStyle} title="Leave Approvals">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Leave Approvals</span>}
            </NavLink>
            <NavLink to="/admin/salary-settings" className={linkStyle} title="Salary & Leave Rules">
              <Sliders className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Salary & Leave Rules</span>}
            </NavLink>
            <NavLink to="/admin/payroll" className={linkStyle} title="Payroll & Payslips">
              <DollarSign className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Payroll & Payslips</span>}
            </NavLink>
          </>
        ) : user?.role === 'customer' ? (
          <>
            <NavLink to="/customer/dashboard" className={linkStyle} title="Customer Orders Portal">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Orders & Invoices</span>}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/employee/dashboard" className={linkStyle} title="Clock In / Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Clock In / Dashboard</span>}
            </NavLink>
            <NavLink to="/employee/profile" className={linkStyle} title="My Profile">
              <User className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>My Profile</span>}
            </NavLink>
            <NavLink to="/employee/attendance" className={linkStyle} title="Attendance History">
              <Clock className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Attendance History</span>}
            </NavLink>
            <NavLink to="/employee/leaves" className={linkStyle} title="My Leaves & Balances">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>My Leaves & Balances</span>}
            </NavLink>
            <NavLink to="/employee/payslips" className={linkStyle} title="My Payslips">
              <DollarSign className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>My Payslips</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
