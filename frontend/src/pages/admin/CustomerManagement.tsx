import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Customer, Invoice } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import { UserCheck, UserPlus, Search, Eye, Edit, Trash2, X, FileText, AlertCircle, ShoppingBag } from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<{
    customer: Customer;
    invoices: Invoice[];
  } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    goodsCategory: 'Fabrics & Textiles',
    creditLimit: '100000',
    paymentTerms: 'Net 30 Days',
    status: 'active' as 'active' | 'inactive',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Customer / Business name is required';
    if (!formData.email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (Number(formData.creditLimit) < 0) errors.creditLimit = 'Credit limit must be a positive number';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setActionLoading(true);

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer._id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

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
        throw new Error(data.message || 'Failed to save customer');
      }

      setShowAddModal(false);
      setEditingCustomer(null);
      fetchCustomers();
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        goodsCategory: 'Fabrics & Textiles',
        creditLimit: '100000',
        paymentTerms: 'Net 30 Days',
        status: 'active',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      contactPerson: cust.contactPerson || cust.name,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
      gstNumber: cust.gstNumber || '',
      goodsCategory: cust.goodsCategory || 'Fabrics & Textiles',
      creditLimit: (cust.creditLimit || 100000).toString(),
      paymentTerms: cust.paymentTerms || 'Net 30 Days',
      status: cust.status || 'active',
    });
    setFieldErrors({});
    setError('');
    setShowAddModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/customers/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCustomers();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomerDetail(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.goodsCategory && c.goodsCategory.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Customer Accounts & Goods Posting" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search code, business name, category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({
                name: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                gstNumber: '',
                goodsCategory: 'Fabrics & Textiles',
                creditLimit: '100000',
                paymentTerms: 'Net 30 Days',
                status: 'active',
              });
              setFieldErrors({});
              setError('');
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer Code</th>
                  <th className="px-5 py-3.5">Business Name & Contact</th>
                  <th className="px-5 py-3.5">Goods Category</th>
                  <th className="px-5 py-3.5">Credit Limit</th>
                  <th className="px-5 py-3.5">GST & Terms</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading customer records...
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No customer accounts found. Click "Add New Customer" to create one.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((cust) => (
                    <tr key={cust._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-indigo-600 font-mono">{cust.customerCode}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{cust.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {cust.contactPerson ? `Contact: ${cust.contactPerson} • ` : ''}
                          {cust.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          {cust.goodsCategory || 'Fabrics'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{(cust.creditLimit || 100000).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-[11px] text-slate-700">{cust.gstNumber || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{cust.paymentTerms || 'Net 30 Days'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            cust.status === 'inactive'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {cust.status === 'inactive' ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ActionPopover
                          actions={[
                            {
                              label: 'View Invoices & Orders',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => handleViewCustomer(cust._id),
                            },
                            {
                              label: 'Edit Customer',
                              icon: <Edit className="w-4 h-4" />,
                              onClick: () => handleEditClick(cust),
                            },
                            {
                              label: 'Delete Account',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => setDeleteTarget(cust),
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
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Add/Edit Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCustomer ? 'Edit Customer Account' : 'Add New Customer'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1"
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

              <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business / Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                      fieldErrors.name ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="e.g. Acme Textiles Ltd"
                  />
                  {fieldErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                      placeholder="Manager Name"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Goods Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.goodsCategory}
                      onChange={(e) => setFormData({ ...formData, goodsCategory: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    >
                      <option value="Fabrics & Textiles">Fabrics & Textiles</option>
                      <option value="Yarn & Threads">Yarn & Threads</option>
                      <option value="Apparel & Garments">Apparel & Garments</option>
                      <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                      <option value="Raw Cotton">Raw Cotton</option>
                    </select>
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
                      placeholder="client@acme.com"
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
                      placeholder="9876543210"
                    />
                    {fieldErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    >
                      <option value="Immediate Cash">Immediate Cash</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                      fieldErrors.address ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="Factory or Office Address"
                  />
                  {fieldErrors.address && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.address}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCustomer(null);
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
                    {actionLoading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Invoices & Goods History Modal */}
        {selectedCustomerDetail && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase font-mono">
                    {selectedCustomerDetail.customer.customerCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {selectedCustomerDetail.customer.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCustomerDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block font-semibold">Contact & Email</span>
                  <span className="font-bold text-slate-900">{selectedCustomerDetail.customer.email}</span>
                  <div className="text-slate-600">{selectedCustomerDetail.customer.phone}</div>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Goods Category</span>
                  <span className="font-bold text-indigo-600">{selectedCustomerDetail.customer.goodsCategory || 'Fabrics'}</span>
                  <div className="text-slate-600">Credit Limit: ₹{(selectedCustomerDetail.customer.creditLimit || 100000).toLocaleString()}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold">GST & Delivery Address</span>
                  <span className="font-medium text-slate-800">{selectedCustomerDetail.customer.address}</span>
                  {selectedCustomerDetail.customer.gstNumber && (
                    <div className="font-mono text-slate-600 mt-0.5">GSTIN: {selectedCustomerDetail.customer.gstNumber}</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Invoice Billing History
                </h4>
                <div className="max-h-48 overflow-y-auto border rounded-2xl divide-y text-xs">
                  {selectedCustomerDetail.invoices.length === 0 ? (
                    <p className="p-4 text-center text-slate-400">No invoices billed to this customer yet.</p>
                  ) : (
                    selectedCustomerDetail.invoices.map((inv) => (
                      <div key={inv._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-indigo-600 font-mono">{inv.invoiceNumber}</span>
                          <span className="text-slate-400 ml-2">
                            ({new Date(inv.issueDate).toLocaleDateString()})
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900">₹{inv.grandTotal.toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCustomerDetail(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Customer Account"
          message="Are you sure you want to delete this customer account? Associated invoice logs will remain archived."
          itemName={deleteTarget ? `${deleteTarget.customerCode} - ${deleteTarget.name}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
