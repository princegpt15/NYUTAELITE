import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [products, setProducts] = useState<PantryProduct[]>([]);
  const [results, setResults] = useState<PantryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all products once
  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setResults(data);
      })
      .catch((err) => setError(err?.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  // Update results when query changes
  useEffect(() => {
    if (!query) {
      setResults(products);
    } else {
      const lowered = query.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowered) ||
          p.quality.toLowerCase().includes(lowered) ||
          p.weightGrams.toString().includes(lowered.replace('g', ''))
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FCFAF5] rounded-xl shadow-2xl border border-[#E8DECB] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E8DECB] bg-white">
          <Search className="w-5 h-5 text-[#68756E] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search makhana, quality (premium/normal), weight (100g, 200g, 250g)..."
            className="w-full ml-3 text-sm text-[#1C1C1C] placeholder-[#68756E] bg-transparent focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#68756E] hover:text-[#1C1C1C] rounded-md mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1 text-[#68756E] hover:text-[#123B2A] rounded-md cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-[#E8DECB]/60">
        {loading && (
          <div className="p-4 text-center text-sm text-[#68756E]">Loading products...</div>
        )}
        {error && (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        )}
          <div className="flex items-center justify-between pb-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#68756E]">
              {query ? `Search Results (${results.length})` : 'All Pantry Makhana Packs'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base font-semibold text-[#1C1C1C]">No makhana found for your search.</p>
              <p className="text-xs text-[#68756E] mt-1">Try searching "premium", "normal", "100g", "200g", or "250g".</p>
            </div>
          ) : (
            results.map((product) => (
              <div key={product.id} className="py-3 flex items-center justify-between gap-4 group hover:bg-[#F7F1E5]/40 px-2 rounded-lg transition-colors">
                <Link
                  to={`/products/makhana?sku=${product.id}`}
                  onClick={handleClose}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 rounded-md bg-[#F7F1E5] object-contain p-1.5 shrink-0 border border-[#E8DECB]"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        product.quality === 'Premium' ? 'bg-[#123B2A] text-[#FCFAF5]' : 'bg-[#E8DECB] text-[#123B2A]'
                      }`}>
                        {product.quality}
                      </span>
                      <span className="text-xs font-bold text-[#123B2A]">{product.weightGrams}g</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1C1C] truncate mt-0.5 group-hover:text-[#123B2A] transition-colors">
                      {product.name}
                    </h4>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#123B2A]">₹{product.price}</span>
                    <span className="text-xs text-[#68756E] line-through ml-1.5">₹{product.mrp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(product, e)}
                    className="inline-flex items-center gap-1 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold px-3 py-2 rounded transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#F7F1E5] px-4 py-2.5 text-center text-xs text-[#68756E] border-t border-[#E8DECB] flex items-center justify-between">
          <span>Tip: Press ESC to exit search</span>
          <Link to="/products/makhana" onClick={handleClose} className="font-bold text-[#123B2A] hover:underline flex items-center gap-1">
            Browse catalog <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
