// src/pages/admin/AdminProducts.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Power,
  RefreshCw,
  Boxes,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { FormInput } from '../../components/FormInput';
import type {
  AdminProduct,
  AdminPagination,
  AdminProductsFilterParams,
  AdminCreateProductPayload,
  AdminUpdateProductPayload,
} from '../../types/admin';

// Presentation threshold for stock warning
const LOW_STOCK_THRESHOLD = 10;

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIsActive, setSelectedIsActive] = useState<string>('');
  const [selectedLowStock, setSelectedLowStock] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deactivate/Reactivate Confirmation Dialog
  const [productToToggle, setProductToToggle] = useState<AdminProduct | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    category: string;
    weight: string;
    price: string;
    compareAtPrice: string;
    stock: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
  }>({
    name: '',
    sku: '',
    category: 'Premium',
    weight: '250',
    price: '',
    compareAtPrice: '',
    stock: '50',
    description: '',
    imageUrl: '',
    isActive: true,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminProductsFilterParams = {
        page: currentPage,
        limit: 15,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        isActive: selectedIsActive === 'true' ? true : selectedIsActive === 'false' ? false : undefined,
        lowStock: selectedLowStock === 'true' ? true : undefined,
      };
      const res = await adminService.getProducts(params);
      setProducts(res.products);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve product inventory.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedCategory, selectedIsActive, selectedLowStock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedIsActive('');
    setSelectedLowStock('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedCategory || selectedIsActive || selectedLowStock
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Premium',
      weight: '250',
      price: '',
      compareAtPrice: '',
      stock: '50',
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku || '',
      category: p.category || 'Premium',
      weight: p.weight ? String(p.weight) : '',
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      stock: String(p.stock),
      description: p.description || '',
      imageUrl: typeof p.images === 'string' ? p.images : Array.isArray(p.images) ? p.images[0] : '',
      isActive: p.isActive,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formData.price);
    const compareAtPriceNum = formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null;
    const stockNum = parseInt(formData.stock, 10);
    const weightNum = formData.weight ? parseFloat(formData.weight) : null;

    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('SKU identifier is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Price must be a positive number in INR.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Stock must be an integer of 0 or greater.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProduct) {
        // Update product
        const payload: AdminUpdateProductPayload = {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category || null,
          weight: weightNum,
          price: priceNum,
          compareAtPrice: compareAtPriceNum,
          stock: stockNum,
          description: formData.description.trim() || null,
          images: formData.imageUrl.trim() || null,
          isActive: formData.isActive,
        };
        const updated = await adminService.updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSuccessMessage(`Product "${updated.name}" updated successfully.`);
      } else {
        // Create product
        const payload: AdminCreateProductPayload = {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category || null,
          weight: weightNum,
          price: priceNum,
          compareAtPrice: compareAtPriceNum,
          stock: stockNum,
          description: formData.description.trim() || null,
          images: formData.imageUrl.trim() || null,
          isActive: formData.isActive,
        };
        const created = await adminService.createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setSuccessMessage(`Product "${created.name}" created successfully.`);
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Operation failed. Please check field values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActiveConfirm = async () => {
    if (!productToToggle) return;
    setIsSubmitting(true);
    try {
      const updated = await adminService.updateProduct(productToToggle.id, {
        isActive: !productToToggle.isActive,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSuccessMessage(
        `Product "${updated.name}" has been ${updated.isActive ? 'reactivated' : 'deactivated'}.`
      );
      setProductToToggle(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update product active state.');
      setProductToToggle(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          Out of Stock ({stock})
        </span>
      );
    }
    if (stock <= LOW_STOCK_THRESHOLD) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Low Stock ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
        In Stock ({stock})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase">
            CATALOG &amp; INVENTORY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-0.5">
            Products &amp; Stock
          </h1>
          <p className="text-xs text-[#68756E]">
            {pagination.total} total SKUs managed in the pantry catalog
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E8DECB] hover:bg-[#F7F1E5] text-xs font-bold text-[#123B2A] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#C6A15B]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-900 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchProducts}
            className="underline font-bold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Product Name, SKU, or Category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Category Select */}
            <div className="flex-1 sm:w-36">
              <select
                aria-label="Filter by Category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Premium">Premium</option>
                <option value="Normal">Normal</option>
              </select>
            </div>

            {/* Active / Inactive Select */}
            <div className="flex-1 sm:w-36">
              <select
                aria-label="Filter by Active Status"
                value={selectedIsActive}
                onChange={(e) => {
                  setSelectedIsActive(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Low Stock Select */}
            <div className="flex-1 sm:w-36">
              <select
                aria-label="Filter by Stock Level"
                value={selectedLowStock}
                onChange={(e) => {
                  setSelectedLowStock(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Stock</option>
                <option value="true">Low Stock (≤10)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Filter
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-[#E8DECB] hover:bg-[#F7F1E5] text-[#68756E] text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products Data Table Card */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-[#F7F1E5] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center mx-auto border border-[#E8DECB]">
              <Boxes className="w-6 h-6 text-[#C6A15B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#092218]">No Products Found</h3>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No products match your active search or filter criteria.'
                : 'There are currently no products configured in the catalog.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors mt-2"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5 text-[#C6A15B]" />
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Product &amp; SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Inventory Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DECB]/60">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FCFAF5] transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-[#1C1C1C] text-sm">
                        {product.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#68756E] mt-0.5">
                        {product.sku || 'No SKU'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#123B2A] bg-[#F7F1E5] px-2 py-0.5 rounded text-[11px]">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1C1C1C] font-semibold">
                      {product.weight ? `${product.weight}g` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#123B2A] text-sm">
                          ₹{product.price}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-[11px] text-[#68756E] line-through">
                            ₹{product.compareAtPrice}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStockBadge(product.stock)}
                    </td>
                    <td className="py-3.5 px-4">
                      {product.isActive ? (
                        <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-300">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#123B2A] hover:text-white text-[#123B2A] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setProductToToggle(product)}
                          title={product.isActive ? 'Deactivate Product' : 'Reactivate Product'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            product.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-700 hover:text-white'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#FCFAF5] border-t border-[#E8DECB] flex items-center justify-between text-xs">
            <span className="text-[#68756E]">
              Showing page <span className="font-bold text-[#1C1C1C]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#1C1C1C]">{pagination.totalPages}</span> ({pagination.total} products)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="p-2 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] hover:bg-[#F7F1E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                aria-label="Next page"
                className="p-2 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] hover:bg-[#F7F1E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="w-full max-w-xl bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DECB] shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DECB]">
              <div>
                <h3 id="product-modal-title" className="font-serif text-xl font-bold text-[#092218]">
                  {editingProduct ? 'Edit Product SKU' : 'Create New Makhana Product'}
                </h3>
                <p className="text-xs text-[#68756E]">
                  {editingProduct
                    ? `Updating catalog specifications for ${editingProduct.sku}`
                    : 'Add a new verified SKU to the live pantry catalog'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#68756E] hover:text-[#1C1C1C] rounded-lg hover:bg-[#F7F1E5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <FormInput
                label="Product Title *"
                placeholder="e.g. Premium Bihar Phool Makhana"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  label="SKU Identifier *"
                  placeholder="e.g. NYM-PREM-250"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Quality / Grade
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] focus:bg-white"
                  >
                    <option value="Premium">Premium Grade (Jumbo 6+ Suta)</option>
                    <option value="Normal">Normal Grade (Standard 5+ Suta)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormInput
                  label="Net Weight (g)"
                  type="number"
                  placeholder="250"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />

                <FormInput
                  label="Selling Price (₹) *"
                  type="number"
                  placeholder="160"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />

                <FormInput
                  label="MRP / Compare Price (₹)"
                  type="number"
                  placeholder="199"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  label="Initial Stock Level (Packs) *"
                  type="number"
                  placeholder="50"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />

                <FormInput
                  label="Product Image URL (Optional)"
                  placeholder="https://... or /assets/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pantry product description, harvesting origin, purity certifications..."
                  className="w-full p-3 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] focus:bg-white"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="product-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#123B2A] focus:ring-[#123B2A] cursor-pointer"
                />
                <label htmlFor="product-active" className="text-xs font-bold text-[#1C1C1C] cursor-pointer">
                  Product is Active on Public Storefront
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8DECB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg border border-[#E8DECB] hover:bg-[#F7F1E5] text-xs font-bold uppercase tracking-wider text-[#1C1C1C] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate / Reactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToToggle)}
        title={productToToggle?.isActive ? 'Deactivate Product?' : 'Reactivate Product?'}
        message={
          productToToggle?.isActive
            ? `Are you sure you want to deactivate "${productToToggle?.name}"? It will no longer be visible or purchasable on the customer storefront.`
            : `Are you sure you want to reactivate "${productToToggle?.name}"? It will immediately become available in customer catalog queries.`
        }
        confirmLabel={productToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
        cancelLabel="Keep Current State"
        isDestructive={Boolean(productToToggle?.isActive)}
        isLoading={isSubmitting}
        onConfirm={handleToggleActiveConfirm}
        onCancel={() => setProductToToggle(null)}
      />
    </div>
  );
};
