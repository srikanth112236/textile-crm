import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Employee, Attendance } from '../../types';
import { User, Clock, ArrowLeft, Mail, Phone, Building, Briefcase, DollarSign } from 'lucide-react';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [userAccount, setUserAccount] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`/api/employees/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setEmployee(data.employee);
          setUserAccount(data.userAccount);
        }

        const attRes = await fetch(`/api/attendance/my-history?employeeId=${id}`, { headers });
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendance(attData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <Header title="Employee Details" />
        <div className="p-8 text-center text-gray-500">Loading employee profile...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <Header title="Employee Not Found" />
        <div className="p-8 text-center text-red-500">Employee record not found.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title={`Employee Profile: ${employee.firstName} ${employee.lastName}`} />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Employee List
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl">
              {employee.firstName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                {employee.employeeCode}
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">Status: {employee.status.toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <span>Dept: {employee.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>Designation: {employee.designation}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase font-semibold">Base Monthly Salary</span>
              <span className="font-extrabold text-gray-900">₹{employee.baseSalary.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase font-semibold">Mandatory Hours / Day</span>
              <span className="font-bold text-blue-700">{employee.mandatoryWorkingHours} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase font-semibold">First-Time Pass Change</span>
              <span className={`font-bold text-xs ${userAccount?.mustChangePassword ? 'text-amber-600' : 'text-emerald-600'}`}>
                {userAccount?.mustChangePassword ? 'Pending Change' : 'Completed'}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Attendance History & Working Hours Log
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Total Hours</th>
                  <th className="px-4 py-3">Mandatory Target</th>
                  <th className="px-4 py-3">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">
                      No attendance records logged yet for this employee.
                    </td>
                  </tr>
                ) : (
                  attendance.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{log.date}</td>
                      <td className="px-4 py-3">
                        {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{log.totalHours} hrs</td>
                      <td className="px-4 py-3">{log.mandatoryHours} hrs</td>
                      <td className="px-4 py-3">
                        {log.metMandatoryHours ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Met Target ({log.totalHours}h)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Short Working Hours ({log.totalHours}h / {log.mandatoryHours}h)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
