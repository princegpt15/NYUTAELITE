import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Check, Sparkles, AlertCircle, Plus, Minus, RefreshCw } from 'lucide-react';
import type { PantryProduct } from '../types';
import { cartService } from '../services/cart';
import { retentionService } from '../services/retention';
import { authService } from '../services/auth';
import { trackSelectItem, trackAddToWishlist } from '../services/analytics';

interface ProductCardProps {
  product: PantryProduct;
  onAdded?: (message: string) => void;
  listId?: string;
  listName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdded,
  listId = 'product_collection',
  listName = 'Makhana Collection',
}) => {
  const navigate = useNavigate();
  // Local quantity reflects the authoritative shared cart state (0 means not in cart)
  const [quantity, setQuantity] = useState(0);
  const [adding, setAdding] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Sync component state with the shared cart
  useEffect(() => {
    // Initialise from current cart contents
    const init = () => {
      const items = cartService.getItems();
      const match = items.find((i) => i.productId === product.id);
      setQuantity(match?.quantity ?? 0);
    };
    init();

    // Subscribe to cart updates
    const unsubscribe = cartService.subscribe((items) => {
      const match = items.find((i) => i.productId === product.id);
      setQuantity(match?.quantity ?? 0);
    });

    return () => {
      unsubscribe();
    };
  }, [product.id]);

  const discountSavings = Math.max(0, product.mrp - product.price);
  const discountPercent =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 20;

  const displayName = product.name === 'Normal Makhana' ? 'Regular Makhana' : product.name;
  const badgeQuality = product.quality === 'Premium' ? 'PREMIUM' : 'REGULAR';
  const displayWeight = `${product.weightGrams} g`;
  const productUrl = `/products/makhana?sku=${product.id || product.sku}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || adding) return;
    if (product.stock <= 0) return;

    setAdding(true);
    try {
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
      setQuantity(1);
      if (onAdded) {
        onAdded(`Added 1 × ${displayWeight} ${displayName} to cart.`);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    if (quantity >= product.stock) {
      if (onAdded) onAdded(`Maximum available stock reached (${product.stock} units).`);
      return;
    }

    const nextQty = quantity + 1;
    setAdding(true);
    try {
      cartService.updateQuantity(product.id, nextQty);
      setQuantity(nextQty);
    } finally {
      setAdding(false);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;

    const nextQty = quantity - 1;
    setAdding(true);
    try {
      if (nextQty <= 0) {
        cartService.removeItem(product.id);
        setQuantity(0);
        if (onAdded) onAdded(`Removed ${displayName} from cart.`);
      } else {
        cartService.updateQuantity(product.id, nextQty);
        setQuantity(nextQty);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login?redirect=/wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await retentionService.removeFromWishlist(product.id);
        setIsWishlisted(false);
        if (onAdded) onAdded(`Removed ${displayName} from wishlist.`);
      } else {
        await retentionService.addToWishlist(product.id);
        setIsWishlisted(true);
        trackAddToWishlist(product);
        if (onAdded) onAdded(`Added ${displayName} to wishlist!`);
      }
    } catch {
      setIsWishlisted(!isWishlisted);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article
      className="group relative flex flex-col justify-between h-full bg-[#F7FAF4] rounded-2xl border border-[#D4E2D1] shadow-xs hover:shadow-md hover:border-[#123B2A] transition-all duration-300 p-2.5 sm:p-3 select-none"
      aria-label={`${badgeQuality} Makhana ${displayWeight}`}
    >
      <div>
        {/* Top Product Image Container */}
        <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-white border border-[#E2ECE0] flex items-center justify-center shadow-2xs">
          <Link
            to={productUrl}
            onClick={() => trackSelectItem({ listId, listName, product })}
            className="block h-full w-full"
            aria-label={`View details for ${displayName} ${displayWeight}`}
          >
            <img
              src={product.image}
              alt={`${displayName} ${displayWeight}`}
              className="h-full w-full object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-106"
              loading="lazy"
              width={260}
              height={260}
            />
          </Link>

          {/* Top Left: Quality Badge */}
          <div className="absolute left-2 top-2 z-10 pointer-events-none">
            <span
              className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md shadow-2xs ${
                product.quality === 'Premium'
                  ? 'bg-[#123B2A] text-[#FCFAF5] border border-[#C6A15B]/60'
                  : 'bg-[#E5EFE2] text-[#123B2A] border border-[#CFDFCC]'
              }`}
            >
              {badgeQuality}
            </span>
          </div>

          {/* Top Right: Wishlist & Discount */}
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1 z-10">
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              aria-label={
                isWishlisted
                  ? `Remove ${displayName} from wishlist`
                  : `Add ${displayName} to wishlist`
              }
              className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-2xs min-h-[28px] min-w-[28px] flex items-center justify-center ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-[#F7FAF4]/95 text-[#4E6257] hover:text-rose-600 hover:bg-white border border-[#D4E2D1]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            {discountPercent > 0 && (
              <span className="bg-[#C6A15B] text-[#092218] text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[#092218]/75 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="pt-2 sm:pt-2.5 flex flex-col">
          {/* Net weight tag */}
          <span className="text-[11px] font-black text-[#566A5E] tracking-tight">
            {displayWeight}
          </span>

          {/* Product Name */}
          <Link
            to={productUrl}
            onClick={() => trackSelectItem({ listId, listName, product })}
            className="block mt-0.5 group-hover:text-[#123B2A] transition-colors"
          >
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#1C1C1C] leading-snug line-clamp-1">
              {displayName}
            </h3>
          </Link>

          {/* Stock State */}
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold min-h-[16px]">
            {isOutOfStock ? (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> Out of stock
              </span>
            ) : isLowStock ? (
              <span className="text-amber-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C6A15B] shrink-0" /> Only {product.stock} left
              </span>
            ) : (
              <span className="text-[#123B2A] flex items-center gap-1">
                <Check className="w-3 h-3 text-[#C6A15B] shrink-0" /> Fresh stock
              </span>
            )}
          </div>

          {/* Pricing & Savings */}
          <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-black text-[#123B2A]">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-[10px] sm:text-[11px] text-[#6E7B74] line-through">
                ₹{product.mrp}
              </span>
            )}
            {discountSavings > 0 && (
              <span className="text-[9px] font-extrabold text-[#0D442E] bg-[#E1EFE0] px-1.5 py-0.5 rounded border border-[#C2DEC0]">
                SAVE ₹{discountSavings}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Blinkit-style prominent Add / Stepper button */}
      <div className="mt-2.5 pt-2 border-t border-[#D4E2D1]">
        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="w-full py-1.5 bg-neutral-100 text-neutral-400 text-[11px] font-black uppercase tracking-wider rounded-xl cursor-not-allowed border border-neutral-200"
          >
            OUT OF STOCK
          </button>
        ) : quantity > 0 ? (
          <div className="flex items-center justify-between bg-[#123B2A] text-white rounded-xl p-0.5 sm:p-1 shadow-xs border border-[#123B2A]">
            <button
              type="button"
              disabled={adding}
              onClick={handleDecrement}
              aria-label={`Decrease quantity of ${displayName}`}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-black/25 active:scale-90 transition-transform font-black text-white cursor-pointer disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className="font-black text-xs sm:text-sm text-[#FCFAF5] px-2 select-none"
              aria-live="polite"
            >
              {adding ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : quantity}
            </span>
            <button
              type="button"
              disabled={adding || quantity >= product.stock}
              onClick={handleIncrement}
              aria-label={`Increase quantity of ${displayName}`}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-black/25 active:scale-90 transition-transform font-black text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={adding}
            onClick={handleAddToCart}
            aria-label={`Add 1 pack of ${displayName} to cart`}
            className="w-full py-1.5 sm:py-2 bg-[#123B2A] hover:bg-[#092218] active:scale-[0.98] text-[#FCFAF5] text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 border border-[#123B2A]"
          >
            {adding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C6A15B]" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#C6A15B] stroke-[3]" />
                <span>ADD</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
};
