import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components & Layout
import { Sidebar } from './components/Sidebar';

// Public Pages
import { Login } from './pages/Login';
import { RegisterAdmin } from './pages/RegisterAdmin';
import { ForceChangePassword } from './pages/ForceChangePassword';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EmployeeManagement } from './pages/admin/EmployeeManagement';
import { EmployeeDetail } from './pages/admin/EmployeeDetail';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { ProductManagement } from './pages/admin/ProductManagement';
import { BillingInvoice } from './pages/admin/BillingInvoice';
import { AttendanceTracker } from './pages/admin/AttendanceTracker';
import { PayrollManagement } from './pages/admin/PayrollManagement';
import { SalarySettingsPage } from './pages/admin/SalarySettingsPage';
import { LeaveManagement } from './pages/admin/LeaveManagement';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { EmployeeAttendanceHistory } from './pages/employee/EmployeeAttendanceHistory';
import { EmployeePayslips } from './pages/employee/EmployeePayslips';
import { EmployeeLeaves } from './pages/employee/EmployeeLeaves';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';

// Protected Route Wrapper
const ProtectedLayout: React.FC<{ allowedRole?: 'admin' | 'employee' | 'customer' }> = ({ allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        Loading Textile Enterprise ERP...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    const defaultRoute = user.role === 'admin' ? '/admin/dashboard' : user.role === 'customer' ? '/customer/dashboard' : '/employee/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
      <Sidebar />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<EmployeeManagement />} />
        <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
        <Route path="/admin/customers" element={<CustomerManagement />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/invoices" element={<BillingInvoice />} />
        <Route path="/admin/attendance" element={<AttendanceTracker />} />
        <Route path="/admin/leaves" element={<LeaveManagement />} />
        <Route path="/admin/salary-settings" element={<SalarySettingsPage />} />
        <Route path="/admin/payroll" element={<PayrollManagement />} />

        {/* Employee Routes */}
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<EmployeeProfile />} />
        <Route path="/employee/attendance" element={<EmployeeAttendanceHistory />} />
        <Route path="/employee/leaves" element={<EmployeeLeaves />} />
        <Route path="/employee/payslips" element={<EmployeePayslips />} />

        {/* Customer Routes */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'customer' ? '/customer/dashboard' : '/employee/dashboard'} replace />}
        />
      </Routes>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />
          <Route path="/force-change-password" element={<ForceChangePassword />} />

          {/* Protected Portal Layout */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
