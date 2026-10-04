import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  DollarSign,
  UserCheck,
  Package,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    totalSales: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    shortHoursCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [empRes, attRes, invRes, custRes, prodRes] = await Promise.all([
          fetch('/api/employees', { headers }),
          fetch('/api/attendance/all', { headers }),
          fetch('/api/invoices', { headers }),
          fetch('/api/customers', { headers }),
          fetch('/api/products', { headers }),
        ]);

        const employees = empRes.ok ? await empRes.json() : [];
        const attendanceData = attRes.ok ? await attRes.json() : { records: [] };
        const invoices = invRes.ok ? await invRes.json() : [];
        const customers = custRes.ok ? await custRes.json() : [];
        const products = prodRes.ok ? await prodRes.json() : [];

        const totalSalesSum = invoices.reduce((acc: number, inv: any) => acc + (inv.grandTotal || 0), 0);
        const lowStock = products.filter((p: any) => p.stockQuantity < 50).length;
        const shortHours = (attendanceData.records || []).filter(
          (a: any) => a.clockOut && !a.metMandatoryHours
        ).length;

        setStats({
          totalEmployees: employees.length,
          todayAttendance: attendanceData.records?.length || 0,
          totalSales: totalSalesSum,
          totalCustomers: customers.length,
          lowStockCount: lowStock,
          shortHoursCount: shortHours,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Admin Dashboard Overview" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Employees</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                {loading ? '...' : stats.totalEmployees}
              </h3>
              <p className="text-xs text-indigo-600 font-medium mt-1">Active workforce</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Attendance</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                {loading ? '...' : stats.todayAttendance}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Clocked in today</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Revenue</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                {loading ? '...' : `₹${stats.totalSales.toLocaleString()}`}
              </h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Total invoiced</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                {loading ? '...' : stats.totalCustomers}
              </h3>
              <p className="text-xs text-blue-600 font-medium mt-1">Registered clients</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-600">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* System Warnings & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4">Quick Operational Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/admin/invoices"
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 group"
              >
                <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Create Invoice</p>
                  <p className="text-xs text-gray-500">Bill customers</p>
                </div>
              </Link>

              <Link
                to="/admin/employees"
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 group"
              >
                <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Manage Staff</p>
                  <p className="text-xs text-gray-500">Add or Import Excel</p>
                </div>
              </Link>

              <Link
                to="/admin/payroll"
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 group"
              >
                <div className="p-2 bg-amber-600 text-white rounded-lg group-hover:scale-105 transition">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Process Payroll</p>
                  <p className="text-xs text-gray-500">Salary & Payslips</p>
                </div>
              </Link>

              <Link
                to="/admin/products"
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 group"
              >
                <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Stock Inventory</p>
                  <p className="text-xs text-gray-500">Products & SKU</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Critical System Alerts */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Operational Alerts & Rules
              </h2>
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-amber-900">Short Working Hours Alert</span>
                    <p className="text-xs text-amber-700">
                      {stats.shortHoursCount} employee(s) clocked out below mandatory 8h target today.
                    </p>
                  </div>
                  <Link
                    to="/admin/attendance"
                    className="text-amber-800 font-bold text-xs flex items-center gap-1 hover:underline"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-blue-900">Low Stock Inventory</span>
                    <p className="text-xs text-blue-700">
                      {stats.lowStockCount} product SKU(s) have stock &lt; 50 units.
                    </p>
                  </div>
                  <Link
                    to="/admin/products"
                    className="text-blue-800 font-bold text-xs flex items-center gap-1 hover:underline"
                  >
                    Check Stock <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              Textile Enterprise ERP System running smoothly. MongoDB Local Port: 27017
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
