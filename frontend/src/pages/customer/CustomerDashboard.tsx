import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/ui/Pagination';
import { Package, ShoppingCart, DollarSign, FileText, CheckCircle2, Clock, AlertCircle, Plus, X, Eye, Building2, Tag, ShieldCheck, Printer } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { token, user } = useAuth();

  const [customerData, setCustomerData] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Order Request Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [orderError, setOrderError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // View Invoice Sheet Modal
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers/portal-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerData(data.customer || null);
        setInvoices(data.invoices || []);
        setProducts(data.products || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setOrderError('Please select a product from the catalog');
      return;
    }

    setActionLoading(true);
    setOrderError('');

    try {
      const res = await fetch('/api/customers/request-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{ productId: selectedProductId, quantity: Number(quantity) }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit order request');
      }

      setShowOrderModal(false);
      setSelectedProductId('');
      setQuantity(100);
      fetchPortalData();
    } catch (err: any) {
      setOrderError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const totalPages = Math.ceil(invoices.length / pageSize) || 1;
  const paginatedInvoices = invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Customer Portal & Product Order Tracking" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Customer Profile Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/20">
              {user?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider block">
                Customer Code: {customerData?.customerCode || 'CUST-2001'}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">{customerData?.name || user?.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Contact: {customerData?.contactPerson || user?.name} • Category: {customerData?.goodsCategory || 'Textiles & Fabrics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
            >
              <ShoppingCart className="w-4 h-4" /> Place Product Order / Request Invoice
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{summary?.totalInvoices || 0}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Invoices Issued</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">₹{summary?.totalInvoiced?.toLocaleString() || 0}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Grand Total</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">₹{summary?.totalPaid?.toLocaleString() || 0}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Settled Payments</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Balance</p>
              <h3 className="text-xl font-extrabold text-amber-600 mt-1 font-mono">₹{summary?.totalDue?.toLocaleString() || 0}</h3>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Outstanding Due</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Product Catalog Overview */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Available Textile Fabric & Yarn Catalog</h3>
              <p className="text-xs text-slate-400">Order directly from available mill stock</p>
            </div>
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Create Order Request
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-6 text-slate-400 text-xs">
                No active products in catalog right now.
              </div>
            ) : (
              products.map((p) => (
                <div key={p._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                      {p.category}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">{p.name}</h4>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">SKU: {p.sku}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      ₹{p.price} <span className="text-[10px] text-slate-400 font-normal">/ {p.unit || 'meter'}</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProductId(p._id);
                        setShowOrderModal(true);
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500"
                    >
                      Order
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Orders & Invoices Tracking Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-sm">My Orders & Invoices History</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Items Count</th>
                  <th className="px-5 py-3.5">Subtotal</th>
                  <th className="px-5 py-3.5">GST Tax (18%)</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Loading order history...
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No invoices or orders submitted yet.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-indigo-600 font-mono">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3.5 font-mono">{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{inv.items?.length || 0} Items</td>
                      <td className="px-5 py-3.5 font-mono">₹{inv.subTotal?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">₹{inv.taxAmount?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900 font-mono">₹{inv.grandTotal?.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        {inv.status === 'paid' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid In Full
                          </span>
                        ) : inv.status === 'partially_paid' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Partially Paid
                          </span>
                        ) : inv.status === 'pending' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Pending Admin Approval
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1 ml-auto transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Invoice Sheet
                        </button>
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
            totalItems={invoices.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Create Order Request Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  Order Products & Request Invoice
                </h3>
                <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{orderError}</span>
                </div>
              )}

              <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Product from Stock</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="">-- Choose Fabric / Yarn Product --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku}) - ₹{p.price}/{p.unit || 'meter'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Required</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold shadow-xs"
                  >
                    {actionLoading ? 'Submitting Request...' : 'Submit Order Request to Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Invoice Sheet Modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-slate-100 my-8">
              <div className="flex items-center justify-between border-b pb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Commercial Invoice Statement</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setViewingInvoice(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6 font-sans">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">TEXTILE ENTERPRISE ERP</h2>
                      <p className="text-xs text-slate-500 font-medium">Textile Manufacturing & Mills Private Ltd.</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-mono font-bold text-indigo-600 block text-sm">{viewingInvoice.invoiceNumber}</span>
                    <span className="text-slate-400 font-semibold block mt-0.5">
                      Issue Date: {new Date(viewingInvoice.issueDate || viewingInvoice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Billed To Customer</span>
                    <span className="font-bold text-slate-900 text-sm">{viewingInvoice.customerName}</span>
                    <span className="text-slate-500 block font-mono text-[11px] mt-0.5">{viewingInvoice.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Billing Address</span>
                    <span className="font-medium text-slate-800 text-xs block mt-0.5">{viewingInvoice.customerAddress}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Item & SKU</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {viewingInvoice.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">
                            {item.name} <span className="text-[10px] text-slate-400 block font-mono">SKU: {item.sku}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right">₹{item.unitPrice?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">₹{item.totalPrice?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-4 py-2 font-sans font-semibold text-slate-600 text-right">Subtotal</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">₹{viewingInvoice.subTotal?.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-4 py-2 font-sans text-slate-500 text-right">GST Tax ({viewingInvoice.taxRate || 18}%)</td>
                        <td className="px-4 py-2 text-right text-slate-600">₹{viewingInvoice.taxAmount?.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-100 font-bold text-sm">
                        <td colSpan={3} className="px-4 py-2.5 font-sans text-slate-900 text-right">Grand Total</td>
                        <td className="px-4 py-2.5 text-right text-indigo-600 font-extrabold text-base">₹{viewingInvoice.grandTotal?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-slate-400 font-medium">Textile Enterprise Official Billed Statement</span>
                  <span className="font-bold uppercase px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
                    STATUS: {viewingInvoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
