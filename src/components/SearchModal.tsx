import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PantryProduct } from '../types';
import { fetchProducts } from '../services/products';
import { cartService } from '../services/cart';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: PantryProduct) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onItemAdded }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<PantryProduct[]>([]);
  const [results, setResults] = useState<PantryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setResults(data);
      })
      .catch((err) => setError(err?.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && products.length === 0) {
      loadData();
    }
  }, [isOpen, products.length]);

  // Filter results
  useEffect(() => {
    if (!query.trim()) {
      setResults(products);
    } else {
      const q = query.toLowerCase().trim();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.quality.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.weightGrams.toString().includes(q.replace('g', '')) ||
          p.description.toLowerCase().includes(q)
      );
      setResults(filtered);
    }
  }, [query, products]);

  if (!isOpen) return null;

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleAddToCart = (product: PantryProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    cartService.addItem({
      productId: product.id,
      productName: product.name,
      quality: product.quality,
      weightGrams: product.weightGrams,
      price: product.price,
      mrp: product.mrp,
      quantity: 1,
      image: product.image,
    });
    if (onItemAdded) onItemAdded(product);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-[#FCFAF5] rounded-2xl shadow-2xl border border-[#E8DECB] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-5 py-4 border-b border-[#E8DECB] bg-white">
          <Search className="w-5 h-5 text-[#C6A15B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="search-modal-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by quality (Premium/Normal), weight (100g, 200g, 250g), or SKU..."
            className="w-full ml-3 text-xs sm:text-sm text-[#1C1C1C] placeholder-[#68756E]/70 bg-transparent focus:outline-none font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 text-[#68756E] hover:text-[#1C1C1C] rounded-lg mr-1 cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#68756E] hover:text-[#123B2A] rounded-lg hover:bg-[#F7F1E5] transition-colors cursor-pointer"
            aria-label="Close search modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-[#E8DECB]/60">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#68756E] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#123B2A]" />
              <span>Loading pantry catalog...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-xs text-red-600 font-semibold">{error}</p>
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 bg-[#123B2A] text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#68756E]">
                  {query ? `Search Results (${results.length})` : 'All Available Makhana Packs'}
                </span>
              </div>

              {results.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-bold text-[#1C1C1C]">No makhana found matching "{query}"</p>
                  <p className="text-xs text-[#68756E]">
                    Try searching for keywords like "premium", "normal", "100g", "200g", or "250g".
                  </p>
                </div>
              ) : (
                results.map((product) => {
                  const outOfStock = product.stock <= 0;
                  return (
                    <div
                      key={product.id}
                      className="py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4 group hover:bg-[#F7F1E5]/50 px-2 sm:px-3 rounded-xl transition-colors"
                    >
                      <Link
                        to={`/products/makhana?sku=${product.id}`}
                        onClick={handleClose}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg bg-[#F7F1E5] object-contain p-1.5 shrink-0 border border-[#E8DECB]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                product.quality === 'Premium'
                                  ? 'bg-[#123B2A] text-[#FCFAF5]'
                                  : 'bg-[#E8DECB] text-[#123B2A]'
                              }`}
                            >
                              {product.quality}
                            </span>
                            <span className="text-xs font-bold text-[#123B2A]">{product.weightGrams}g</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#1C1C1C] truncate mt-0.5 group-hover:text-[#123B2A] transition-colors">
                            {product.name}
                          </h4>
                          <span className="text-[10px] text-[#68756E] block truncate">SKU: {product.sku}</span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-extrabold text-[#123B2A]">
                            ₹{product.price}
                          </span>
                          {product.mrp > product.price && (
                            <span className="text-[11px] text-[#68756E] line-through ml-1.5 hidden sm:inline">
                              ₹{product.mrp}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={(e) => handleAddToCart(product, e)}
                          className="inline-flex items-center gap-1 bg-[#123B2A] hover:bg-[#092218] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#C6A15B]" />
                          <span>{outOfStock ? 'Sold' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#F7F1E5] px-4 py-3 text-center text-xs text-[#68756E] border-t border-[#E8DECB] flex items-center justify-between">
          <span className="text-[11px] font-medium hidden sm:inline">Press <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#E8DECB] font-mono text-[10px]">ESC</kbd> to exit search</span>
          <Link
            to="/products/makhana"
            onClick={handleClose}
            className="font-bold text-[#123B2A] hover:underline flex items-center gap-1 text-xs"
          >
            Browse Full Pantry Collection <ArrowRight className="w-3.5 h-3.5 text-[#C6A15B]" />
          </Link>
        </div>
      </div>
    </div>
  );
};
