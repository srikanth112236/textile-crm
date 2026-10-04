import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionPopover } from '../../components/ui/ActionPopover';
import { Pagination } from '../../components/ui/Pagination';
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, X, AlertCircle, Layers } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Cotton Fabric',
    unit: 'Meters',
    price: '250',
    purchasePrice: '180',
    stockQuantity: '500',
    minStockLevel: '50',
    taxRate: '18',
    description: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.price || Number(formData.price) < 0) errors.price = 'Valid selling price is required';
    if (Number(formData.stockQuantity) < 0) errors.stockQuantity = 'Stock quantity cannot be negative';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setActionLoading(true);

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

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
        throw new Error(data.message || 'Failed to save product');
      }

      setShowModal(false);
      fetchProducts();
      setFormData({
        sku: '',
        name: '',
        category: 'Cotton Fabric',
        unit: 'Meters',
        price: '250',
        purchasePrice: '180',
        stockQuantity: '500',
        minStockLevel: '50',
        taxRate: '18',
        description: '',
      });
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (prod: Product) => {
    setEditingId(prod._id);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      unit: prod.unit,
      price: prod.price.toString(),
      purchasePrice: (prod.purchasePrice || 0).toString(),
      stockQuantity: prod.stockQuantity.toString(),
      minStockLevel: (prod.minStockLevel || 50).toString(),
      taxRate: (prod.taxRate || 18).toString(),
      description: prod.description || '',
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProducts();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Products & Textile Stock Ledger" />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search SKU, fabric name, category..."
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
              setEditingId(null);
              setFormData({
                sku: '',
                name: '',
                category: 'Cotton Fabric',
                unit: 'Meters',
                price: '250',
                purchasePrice: '180',
                stockQuantity: '500',
                minStockLevel: '50',
                taxRate: '18',
                description: '',
              });
              setFieldErrors({});
              setError('');
              setShowModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">SKU Code</th>
                  <th className="px-5 py-3.5">Product Name & Spec</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price & GST</th>
                  <th className="px-5 py-3.5">Stock Level</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Loading stock inventory...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No products found. Click "Add New Product" to populate inventory.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => {
                    const isOut = prod.stockQuantity === 0;
                    const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= (prod.minStockLevel || 50);

                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-indigo-600 font-mono">{prod.sku}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{prod.name}</div>
                          <div className="text-[11px] text-slate-400">Unit: {prod.unit}</div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">{prod.category}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">₹{prod.price.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">GST: {prod.taxRate || 18}%</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Low Stock ({prod.stockQuantity} {prod.unit})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {prod.stockQuantity} {prod.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ActionPopover
                            actions={[
                              {
                                label: 'Edit Product',
                                icon: <Edit className="w-4 h-4" />,
                                onClick: () => handleEdit(prod),
                              },
                              {
                                label: 'Delete Product',
                                icon: <Trash2 className="w-4 h-4" />,
                                danger: true,
                                onClick: () => setDeleteTarget(prod),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingId ? 'Edit Product Specification' : 'Add New Textile Product'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      SKU Code (Auto-gen if empty)
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                      placeholder="TEX-5001"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                        fieldErrors.name ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="Organic Cotton Weave"
                    />
                    {fieldErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    >
                      <option value="Cotton Fabric">Cotton Fabric</option>
                      <option value="Yarn & Spool">Yarn & Spool</option>
                      <option value="Finished Garments">Finished Garments</option>
                      <option value="Dyes & Chemical">Dyes & Chemical</option>
                      <option value="Polyester Blend">Polyester Blend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Measurement Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                      placeholder="Meters, Rolls, Kg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden ${
                        fieldErrors.price ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Min Alert Threshold</label>
                    <input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GST Tax (%)</label>
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description / Spec Notes</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                    placeholder="Weave density, color fastness grade, thread count..."
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-semibold shadow-xs"
                  >
                    {actionLoading ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Product SKU"
          message="Are you sure you want to delete this product SKU from inventory? This action cannot be undone."
          itemName={deleteTarget ? `${deleteTarget.sku} - ${deleteTarget.name}` : ''}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
};
