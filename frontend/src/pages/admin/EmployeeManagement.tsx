import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';
import { exportEmployeesToExcel, downloadEmployeeSampleExcel } from '../../utils/excelExporter';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  UploadCloud,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployeeManagement: React.FC = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<any | null>(null);
  const [excelResultModal, setExcelResultModal] = useState<any | null>(null);

  // Confirm delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Production & Weaving',
    designation: 'Staff',
    baseSalary: '30000',
    mandatoryWorkingHours: '8',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone) errors.phone = 'Phone number is required';
    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.designation.trim()) errors.designation = 'Designation is required';
    if (!formData.baseSalary || Number(formData.baseSalary) < 0) errors.baseSalary = 'Valid base salary required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setActionLoading(true);

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee._id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save employee');
      }

      setShowAddModal(false);
      setEditingEmployee(null);

      if (!editingEmployee && data.createdCredentials) {
        setCreatedCredentialsModal(data.createdCredentials);
      }

      fetchEmployees();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: 'Production & Weaving',
        designation: 'Staff',
        baseSalary: '30000',
        mandatoryWorkingHours: '8',
        password: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      baseSalary: emp.baseSalary.toString(),
      mandatoryWorkingHours: emp.mandatoryWorkingHours.toString(),
      password: '',
    });
    setFieldErrors({});
    setError('');
    setShowAddModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/employees/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchEmployees();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setError('Please select an Excel (.xlsx) or CSV file');
      return;
    }

    setActionLoading(true);
    setError('');
    setUploadProgress(25);

    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 25 : prev));
    }, 200);

    try {
      const dataForm = new FormData();
      dataForm.append('file', excelFile);

      const res = await fetch('/api/employees/import-excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: dataForm,
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to import Excel spreadsheet');
      }

      setTimeout(() => {
        setShowExcelModal(false);
        setExcelResultModal(data);
        fetchEmployees();
        setExcelFile(null);
        setUploadProgress(0);
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Employee Directory & Workforce" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Control Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search code, name, dept, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => exportEmployeesToExcel(employees)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              title="Export all employees to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => {
                setError('');
                setShowExcelModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk Import</span>
            </button>

            <button
              onClick={() => {
                setEditingEmployee(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  department: 'Production & Weaving',
                  designation: 'Staff',
                  baseSalary: '30000',
                  mandatoryWorkingHours: '8',
                  password: '',
                });
                setFieldErrors({});
                setError('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee Code</th>
                  <th className="px-5 py-3.5">Name & Contact</th>
                  <th className="px-5 py-3.5">Dept & Position</th>
                  <th className="px-5 py-3.5">Base Salary</th>
                  <th className="px-5 py-3.5">Hours Target</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading employee directory...
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-indigo-600 font-mono">{emp.employeeCode}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{emp.email} • {emp.phone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">{emp.department}</span>
                        <div className="text-[11px] text-slate-400">{emp.designation}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{emp.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {emp.mandatoryWorkingHours} hrs / day
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ActionPopover
                          actions={[
                            {
                              label: 'View Profile',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => (window.location.href = `/admin/employees/${emp._id}`),
                            },
                            {
                              label: 'Edit Details',
                              icon: <Edit className="w-4 h-4" />,
                              onClick: () => handleEditClick(emp),
                            },
                            {
                              label: 'Delete Record',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => setDeleteTarget(emp),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingEmployee ? 'Edit Employee Record' : 'Add New Employee'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEmployee(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateOrUpdate} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                        fieldErrors.firstName ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.firstName && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                        fieldErrors.lastName ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.lastName && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                        fieldErrors.email ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.email && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                        fieldErrors.phone ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base Salary (₹)</label>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mandatory Hours / Day</label>
                    <input
                      type="number"
                      value={formData.mandatoryWorkingHours}
                      onChange={(e) => setFormData({ ...formData, mandatoryWorkingHours: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEmployee(null);
                    }}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-semibold shadow-xs"
                  >
                    {actionLoading ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Excel Import Modal with Sample Download Button */}
        {showExcelModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Bulk Excel / CSV Employee Import
                </h3>
                <button onClick={() => setShowExcelModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sample Excel Instruction Box */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-950">First time importing?</p>
                    <p className="text-[11px] text-emerald-700">Download sample Excel file to format employee data.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadEmployeeSampleExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 transition"
                >
                  Download Sample Excel
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleExcelUpload} className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/80">
                  <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setExcelFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Accepts .xlsx or .csv spreadsheets. Existing employee records are updated safely without data loss.
                  </p>
                </div>

                {uploadProgress > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Uploading & Syncing Data...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExcelModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-bold text-xs shadow-xs transition"
                  >
                    {actionLoading ? 'Importing Employees...' : 'Upload & Sync Employees'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Created Credentials Modal */}
        {createdCredentialsModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Employee Credentials Generated</h3>
                  <p className="text-xs text-slate-500">Provide these login credentials to the employee.</p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2 text-xs font-mono border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Employee Code</span>
                  <span className="text-indigo-400 font-bold text-sm">{createdCredentialsModal.employeeCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Email</span>
                  <span className="text-white font-semibold">{createdCredentialsModal.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Temporary Password</span>
                  <span className="text-amber-400 font-extrabold">{createdCredentialsModal.initialPassword}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Excel Import Summary Modal */}
        {excelResultModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Excel Import Report Summary
                </h3>
                <button onClick={() => setExcelResultModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-emerald-800 font-extrabold block text-lg">
                    {excelResultModal.createdCount}
                  </span>
                  <span className="text-emerald-700 font-semibold">New Employees Created</span>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-amber-800 font-extrabold block text-lg">
                    {excelResultModal.skipped?.length || 0}
                  </span>
                  <span className="text-amber-700 font-semibold">Skipped / Duplicates</span>
                </div>
              </div>

              {excelResultModal.createdCredentials?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">Generated Account Logins:</div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border rounded-2xl p-2.5 bg-slate-50 text-xs font-mono">
                    {excelResultModal.createdCredentials.map((cred: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded-xl border flex justify-between items-center">
                        <div>
                          <span className="font-bold text-indigo-600 mr-2">{cred.employeeCode}</span>
                          <span className="font-semibold text-slate-900">{cred.name}</span>
                          <div className="text-[10px] text-slate-400">{cred.email}</div>
                        </div>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          {cred.initialPassword}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setExcelResultModal(null)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Employee Record"
          message="Are you sure you want to delete this employee? This action cannot be undone."
          itemName={deleteTarget ? `${deleteTarget.employeeCode} - ${deleteTarget.firstName} ${deleteTarget.lastName}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
