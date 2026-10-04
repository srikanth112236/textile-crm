import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Customer, Product, Invoice } from '../../types';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Send,
  MailCheck,
  Printer,
  Shirt,
  Building2,
  Calendar,
} from 'lucide-react';

export const BillingInvoice: React.FC = () => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomer, setManualCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [lineItems, setLineItems] = useState<
    Array<{ productId: string; quantity: number; unitPrice: number; discountPercentage: number }>
  >([
    { productId: '', quantity: 1, unitPrice: 0, discountPercentage: 0 },
  ]);

  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);

  // View invoice modal state
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Email simulation modal state
  const [sendingEmailModal, setSendingEmailModal] = useState<{
    invoice: Invoice;
    sent: boolean;
  } | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [invRes, custRes, prodRes] = await Promise.all([
        fetch('/api/invoices', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/products', { headers }),
      ]);

      if (invRes.ok) setInvoices(await invRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCustomerChange = (custCode: string) => {
    setSelectedCustomerId(custCode);
    const found = customers.find((c) => c._id === custCode);
    if (found) {
      setManualCustomer({
        name: found.name,
        email: found.email,
        phone: found.phone,
        address: found.address,
      });
    }
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p._id === prodId);
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: prodId,
      unitPrice: prod ? prod.price : 0,
    };
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1, unitPrice: 0, discountPercentage: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculatedSubTotal = lineItems.reduce((acc, item) => {
    const raw = item.unitPrice * item.quantity;
    const disc = (raw * item.discountPercentage) / 100;
    return acc + (raw - disc);
  }, 0);

  const calculatedTaxAmount = Math.max(0, ((calculatedSubTotal - overallDiscount) * taxRate) / 100);
  const calculatedGrandTotal = Math.max(0, calculatedSubTotal - overallDiscount + calculatedTaxAmount);

  const validateInvoiceForm = () => {
    const errors: { [key: string]: string } = {};
    if (!manualCustomer.name.trim()) errors.name = 'Customer name is required';
    if (!manualCustomer.email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(manualCustomer.email)) {
      errors.email = 'Invalid email format';
    }
    if (!manualCustomer.phone.trim()) errors.phone = 'Phone number is required';

    const validItems = lineItems.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) errors.items = 'At least one valid product line item is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateInvoiceForm()) return;

    setActionLoading(true);

    try {
      const validItems = lineItems.filter((item) => item.productId && item.quantity > 0);
      const payload = {
        customerId: selectedCustomerId || undefined,
        customerName: manualCustomer.name,
        customerEmail: manualCustomer.email,
        customerPhone: manualCustomer.phone,
        customerAddress: manualCustomer.address,
        items: validItems,
        taxRate,
        overallDiscount,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate invoice');
      }

      generateInvoicePDF(data.invoice);

      fetchData();
      setShowCreateModal(false);
      setLineItems([{ productId: '', quantity: 1, unitPrice: 0, discountPercentage: 0 }]);
      setSelectedCustomerId('');
      setManualCustomer({ name: '', email: '', phone: '', address: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/invoices/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendEmailSimulated = (inv: Invoice) => {
    setSendingEmailModal({ invoice: inv, sent: false });
    setTimeout(() => {
      setSendingEmailModal({ invoice: inv, sent: true });
    }, 1000);
  };

  const customerSelectOptions = [
    { value: '', label: '-- Choose Registered Customer or Enter Details --' },
    ...customers.map((c) => ({
      value: c._id,
      label: `${c.name} (${c.customerCode})`,
      description: `${c.email} • ${c.phone}`,
    })),
  ];

  const productSelectOptions = [
    { value: '', label: '-- Select Product SKU --' },
    ...products.map((p) => ({
      value: p._id,
      label: `${p.name} (${p.sku})`,
      description: `₹${p.price}/${p.unit} • Available Stock: ${p.stockQuantity}`,
    })),
  ];

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Billing & Invoice Engine" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search invoice #, customer name..."
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
              setError('');
              setFieldErrors({});
              setShowCreateModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>

        {/* Invoice Listing Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer Name & Contact</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Billed Items</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading invoice history...
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No invoices found. Click "Create New Invoice" to generate one.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-indigo-600 font-mono">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        <div className="text-[11px] text-slate-400">{inv.customerEmail}</div>
                      </td>
                      <td className="px-5 py-3.5">{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {inv.items.length} Product Line(s)
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">
                        ₹{inv.grandTotal.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          PAID
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ActionPopover
                          actions={[
                            {
                              label: 'View Invoice Sheet',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setSelectedInvoiceForView(inv),
                            },
                            {
                              label: 'Download PDF',
                              icon: <Download className="w-4 h-4" />,
                              onClick: () => generateInvoicePDF(inv),
                            },
                            {
                              label: 'Send Email Copy',
                              icon: <Send className="w-4 h-4" />,
                              onClick: () => handleSendEmailSimulated(inv),
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
            totalItems={filteredInvoices.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Generate New Billing Invoice
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
                {/* Customer Details section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs">1. Customer & Delivery Info</h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Choose Customer Profile
                    </label>
                    <CustomSelect
                      options={customerSelectOptions}
                      value={selectedCustomerId}
                      onChange={(val) => handleCustomerChange(val)}
                      placeholder="Select Customer..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={manualCustomer.name}
                        onChange={(e) => setManualCustomer({ ...manualCustomer, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                        placeholder="Acme Fabrics Corp"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={manualCustomer.email}
                        onChange={(e) => setManualCustomer({ ...manualCustomer, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                        placeholder="billing@acme.com"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                      <input
                        type="text"
                        value={manualCustomer.phone}
                        onChange={(e) => setManualCustomer({ ...manualCustomer, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                    <textarea
                      rows={2}
                      value={manualCustomer.address}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                      placeholder="Shipping & billing address..."
                    />
                  </div>
                </div>

                {/* Line Items section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">2. Billed Product Line Items</h4>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product Line
                    </button>
                  </div>

                  {fieldErrors.items && <p className="text-red-500 font-semibold">{fieldErrors.items}</p>}

                  <div className="space-y-2.5">
                    {lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-200"
                      >
                        <div className="col-span-5">
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Product SKU</label>
                          <CustomSelect
                            options={productSelectOptions}
                            value={item.productId}
                            onChange={(val) => handleProductChange(idx, val)}
                            placeholder="Choose Product..."
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              const updated = [...lineItems];
                              updated[idx].quantity = val;
                              setLineItems(updated);
                            }}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Unit Price (₹)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                              setLineItems(updated);
                            }}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Discount %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercentage}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].discountPercentage = parseFloat(e.target.value) || 0;
                              setLineItems(updated);
                            }}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Flat Discount Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={overallDiscount}
                        onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 flex flex-col justify-between border border-slate-800">
                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subtotal:</span>
                        <span>₹{calculatedSubTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>GST ({taxRate}%):</span>
                        <span>₹{calculatedTaxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-sm text-emerald-400 pt-2 border-t border-slate-800">
                        <span>Grand Total:</span>
                        <span>₹{calculatedGrandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition"
                      >
                        {actionLoading ? 'Saving...' : 'Generate Invoice & Download PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Realistic Invoice Sheet Detail View Modal */}
        {selectedInvoiceForView && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
              {/* Header Actions */}
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Official Invoice Document Sheet
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => generateInvoicePDF(selectedInvoiceForView)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceForView(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Sheet Layout */}
              <div className="p-8 border border-slate-200 rounded-2xl space-y-6 bg-white shadow-xs">
                {/* Header Letterhead */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="bg-indigo-600 p-2 rounded-xl text-white">
                        <Shirt className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Textile<span className="text-indigo-600">ERP</span> Industries
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs">
                      Industrial Textile Hub, Plot 42, Weaving Sector, Enterprise City, IN
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold rounded-full mb-2">
                      STATUS: PAID
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900 font-mono">
                      {selectedInvoiceForView.invoiceNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Issue Date: {new Date(selectedInvoiceForView.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Billed To / From Meta */}
                <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
                  <div>
                    <span className="font-bold text-slate-400 uppercase block mb-1">BILLED TO (CUSTOMER):</span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{selectedInvoiceForView.customerName}</h4>
                    <p className="text-slate-600 mt-0.5">{selectedInvoiceForView.customerAddress}</p>
                    <p className="text-slate-500 mt-1">
                      Phone: {selectedInvoiceForView.customerPhone} • Email: {selectedInvoiceForView.customerEmail}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-400 uppercase block mb-1">ISSUED BY:</span>
                    <h4 className="font-bold text-slate-900">Textile ERP Billing Operations</h4>
                    <p className="text-slate-500">GSTIN: 27AAAAA0000A1Z5</p>
                    <p className="text-slate-500">Tax Type: GST Integrated Bill of Supply</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div>
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Item Description</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3">Disc %</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoiceForView.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{item.sku}</td>
                          <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="p-3 font-medium">{item.quantity}</td>
                          <td className="p-3">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="p-3">{item.discountPercentage}%</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ₹{item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-900">
                        ₹{selectedInvoiceForView.subTotal.toFixed(2)}
                      </span>
                    </div>

                    {selectedInvoiceForView.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount Applied:</span>
                        <span className="font-semibold">- ₹{selectedInvoiceForView.discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>GST Tax ({selectedInvoiceForView.taxRate}%):</span>
                      <span className="font-semibold text-slate-900">
                        ₹{selectedInvoiceForView.taxAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-800">
                      <span>Grand Total Due:</span>
                      <span className="text-indigo-600">
                        ₹{selectedInvoiceForView.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  Thank you for doing business with Textile Enterprise ERP. For queries regarding this invoice, contact billing@textile-erp.com.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Dispatch Simulated Modal */}
        {sendingEmailModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
              {!sendingEmailModal.sent ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Send className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Sending Invoice to {sendingEmailModal.invoice.customerEmail}...
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <MailCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Invoice Dispatched!</h3>
                  <p className="text-xs text-slate-500">
                    PDF Invoice <strong>{sendingEmailModal.invoice.invoiceNumber}</strong> sent to{' '}
                    <strong>{sendingEmailModal.invoice.customerEmail}</strong>.
                  </p>
                  <button
                    onClick={() => setSendingEmailModal(null)}
                    className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Invoice Record"
          message="Are you sure you want to delete this billing invoice record? This action cannot be undone."
          itemName={deleteTarget ? `${deleteTarget.invoiceNumber} - ${deleteTarget.customerName}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
