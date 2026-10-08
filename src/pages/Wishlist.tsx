// src/pages/Wishlist.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { retentionService, type WishlistItem } from '../services/retention';
import {
  trackViewWishlist,
  trackRemoveFromWishlist,
  trackWishlistToCart,
} from '../services/analytics';
import { authService } from '../services/auth';

export const Wishlist: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await retentionService.getWishlist();
      setItems(data);
      if (data.length > 0) {
        trackViewWishlist(data.map((i) => i.product));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load your wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item: WishlistItem) => {
    try {
      await retentionService.removeFromWishlist(item.productId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      trackRemoveFromWishlist(item.product);
      setFeedback({ type: 'success', text: `Removed ${item.product.name} from wishlist.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to remove item.' });
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    setMovingId(item.productId);
    try {
      const res = await retentionService.moveToCart(item.productId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      trackWishlistToCart(item.product);
      setFeedback({ type: 'success', text: res.message || `${item.product.name} moved to your cart!` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to move item to cart.' });
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-10 lg:py-16">
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
              SAVED PANTRY SELECTION
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#092218] mt-1">
              Your Wishlist &amp; Saved for Later
            </h1>
            <p className="text-xs sm:text-sm text-[#68756E] mt-0.5">
              {currentUser
                ? `${items.length} item(s) saved under ${currentUser.email}`
                : 'Save Bihar makhana packs to purchase anytime'}
            </p>
          </div>

          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs w-fit"
          >
            <span>Explore More Packs</span>
            <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
          </Link>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-[#68756E] border border-[#E8DECB] space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C6A15B] animate-spin mx-auto" />
            <p>Loading your saved pantry packs...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DECB] space-y-3">
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={loadWishlist}
              className="px-4 py-2 bg-[#123B2A] text-white rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DECB] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F7F1E5] text-[#C6A15B] flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">Your Wishlist is Empty</h2>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              You haven't saved any items yet. Browse our freshly harvested Bihar makhana and click
              the heart icon to save packs for later.
            </p>
            <Link
              to="/#pantry"
              className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-[#092218] transition-colors"
            >
              <span>Shop Bihar Makhana</span>
              <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const product = item.product;
              const isOutOfStock = product.stock <= 0;
              const imageUrl =
                product.images && product.images.length > 0
                  ? product.images[0]
                  : '/assets/product-main.png';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    <div className="aspect-square w-full rounded-xl bg-[#FCFAF5] overflow-hidden flex items-center justify-center relative border border-[#E8DECB]/60">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/product-main.png';
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#1C1C1C] line-clamp-1">
                        {product.name}
                      </h3>
                      {product.weight && (
                        <span className="text-[11px] text-[#68756E] block">{product.weight}</span>
                      )}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-lg font-extrabold text-[#123B2A]">
                          ₹{product.price}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs text-[#68756E] line-through">
                            ₹{product.compareAtPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8DECB]/60 flex items-center gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={isOutOfStock || movingId === product.id}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {movingId === product.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-3.5 h-3.5" />
                      )}
                      <span>{isOutOfStock ? 'Out of Stock' : 'Move to Cart'}</span>
                    </button>

                    <button
                      onClick={() => handleRemove(item)}
                      className="p-2 rounded-lg border border-[#E8DECB] hover:bg-rose-50 hover:border-rose-200 text-[#68756E] hover:text-rose-600 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
