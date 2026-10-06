import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RefreshCw,
  Check,
  Sparkles,
  AlertCircle,
  Package,
} from 'lucide-react';
import { type PantryProduct } from '../types';
import { fetchProducts } from '../services/products';
import { cartService } from '../services/cart';
import { Toast } from '../components/Toast';

export const Product: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sku = searchParams.get('sku') ?? 'premium-100g';
  const [product, setProduct] = useState<PantryProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      const found = data.find(
        (p) =>
          p.sku === sku ||
          p.slug === sku ||
          p.id === sku ||
          `${p.quality.toLowerCase()}-${p.weightGrams}g` === sku.toLowerCase()
      );
      setProduct(found ?? null);
    } catch (_e) {
      setError('Unable to load product details. Please check your connection.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [sku]);

  // Compute discount safely
  const discountPercentage =
    product && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const isOutOfStock = product ? product.stock <= 0 : false;
  const isLowStock = product ? product.stock > 0 && product.stock <= 20 : false;

  // Variant selector
  const handleSelectVariant = (quality: string, weight: number) => {
    const targetSku = `${quality.toLowerCase()}-${weight}g`;
    navigate(`/products/makhana?sku=${targetSku}`);
  };

  // Add to cart
  const handleAddToCart = (goToCart = false) => {
    if (!product || isOutOfStock) return;
    setIsAdding(true);
    cartService.addItem({
      productId: product.id,
      productName: product.name,
      quality: product.quality,
      weightGrams: product.weightGrams,
      price: product.price,
      mrp: product.mrp,
      quantity,
      image: product.image,
    });
    setToastMessage(`Added ${quantity} × ${product.weightGrams}g ${product.name} to cart.`);
    setIsAdding(false);

    if (goToCart) {
      navigate('/cart');
    }
  };

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] py-8 sm:py-14 animate-pulse">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="h-4 bg-[#F7F1E5] rounded w-48 mb-8" />
          <div className="grid gap-10 lg:grid-cols-12 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB]">
            <div className="lg:col-span-6 aspect-square rounded-2xl bg-[#F7F1E5]" />
            <div className="lg:col-span-6 space-y-6">
              <div className="h-6 bg-[#F7F1E5] rounded w-1/3" />
              <div className="h-10 bg-[#F7F1E5] rounded w-3/4" />
              <div className="h-8 bg-[#F7F1E5] rounded w-1/4" />
              <div className="h-20 bg-[#F7F1E5] rounded w-full" />
              <div className="h-12 bg-[#F7F1E5] rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] px-4 py-20 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-red-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">Product Unavailable</h2>
          <p className="text-xs text-[#68756E]">{error}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={loadProduct}
              className="inline-flex items-center gap-1.5 bg-[#123B2A] text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-[#092218] transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <Link
              to="/#pantry"
              className="inline-flex items-center gap-1.5 border border-[#123B2A] text-[#123B2A] text-xs font-bold px-5 py-3 rounded-xl hover:bg-[#F7F1E5] transition-colors"
            >
              Browse All Makhana
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // NOT FOUND STATE
  if (!product) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] px-4 py-20 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-[#E8DECB] text-center space-y-4 shadow-sm">
          <Package className="w-12 h-12 text-[#68756E]/40 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">Product Not Found</h2>
          <p className="text-xs text-[#68756E]">
            The makhana pack you are looking for does not exist or may have been updated.
          </p>
          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-[#092218] transition-colors"
          >
            Explore Pantry Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF5] py-8 sm:py-14">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        {/* Back Link */}
        <Link
          to="/#pantry"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] mb-6 sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pantry collection
        </Link>

        <div className="grid gap-10 lg:grid-cols-12 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-sm">
          {/* Left: Product Image Gallery */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#F7F1E5] p-8 sm:p-12 rounded-2xl border border-[#E8DECB] relative">
            <span className="self-start text-[10px] font-extrabold uppercase tracking-widest bg-[#123B2A] text-white px-3 py-1 rounded-md shadow-xs">
              {product.quality} Quality
            </span>
            <img
              src={product.image}
              alt={`${product.weightGrams}g ${product.name}`}
              className="max-h-96 w-full object-contain my-6 drop-shadow-md"
            />
            <div className="flex items-center gap-2 text-xs text-[#68756E] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
              <span>Sealed in air-tight food-grade pouches for lasting crunch</span>
            </div>
          </div>

          {/* Right: Product Details & Controls */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6A15B]">
                  NYUTA ELITE MAKHANA
                </span>
                <span className="text-xs text-[#68756E]">• SKU: {product.sku}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#092218] mt-2">
                {product.name}
              </h1>

              {/* Price & Savings */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-3xl font-extrabold text-[#123B2A]">₹{product.price}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-base text-[#68756E] line-through">₹{product.mrp}</span>
                    <span className="bg-[#C6A15B] text-[#092218] text-xs font-extrabold px-2.5 py-0.5 rounded-md shadow-xs">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock Badge */}
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                {isOutOfStock ? (
                  <span className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Currently Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" /> Only {product.stock} packs left in stock!
                  </span>
                ) : (
                  <span className="text-[#123B2A] bg-[#F7F1E5] border border-[#E8DECB] px-3 py-1 rounded-md flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#C6A15B]" /> In Stock ({product.stock} packs available)
                  </span>
                )}
              </div>

              <p className="mt-5 text-xs sm:text-sm text-[#68756E] leading-relaxed">
                {product.description}
              </p>

              {/* Quality Selector Pills */}
              <div className="mt-6 pt-5 border-t border-[#E8DECB]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-2.5">
                  Select Quality Grade:
                </label>
                <div className="flex gap-3">
                  {(['Premium', 'Normal'] as const).map((qual) => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => handleSelectVariant(qual, product.weightGrams)}
                      className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        product.quality === qual
                          ? 'border-[#123B2A] bg-[#123B2A] text-white shadow-xs'
                          : 'border-[#E8DECB] bg-white text-[#1C1C1C] hover:border-[#123B2A]'
                      }`}
                    >
                      {qual} Makhana
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Selector Pills */}
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-2.5">
                  Select Pack Weight:
                </label>
                <div className="flex gap-3">
                  {([100, 200, 250] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleSelectVariant(product.quality, w)}
                      className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        product.weightGrams === w
                          ? 'border-[#123B2A] bg-[#123B2A] text-white shadow-xs'
                          : 'border-[#E8DECB] bg-white text-[#1C1C1C] hover:border-[#123B2A]'
                      }`}
                    >
                      {w}g Pouch
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Picker */}
              {!isOutOfStock && (
                <div className="mt-6 flex items-center gap-4">
                  <label htmlFor="product-qty" className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
                    Quantity:
                  </label>
                  <select
                    id="product-qty"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-[#E8DECB] bg-white px-4 py-2.5 text-sm font-bold text-[#1C1C1C] rounded-xl focus:outline-none focus:border-[#123B2A] cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 10].map((amount) => (
                      <option key={amount} value={amount}>
                        {amount} {amount === 1 ? 'pack' : 'packs'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-[#E8DECB] space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isOutOfStock || isAdding}
                  onClick={() => handleAddToCart(false)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#123B2A] bg-white hover:bg-[#F7F1E5] active:bg-[#E8DECB] text-xs font-extrabold uppercase tracking-wider text-[#123B2A] rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </button>
                <button
                  type="button"
                  disabled={isOutOfStock || isAdding}
                  onClick={() => handleAddToCart(true)}
                  className="min-h-12 bg-[#123B2A] hover:bg-[#092218] active:bg-black text-xs font-extrabold uppercase tracking-wider text-white rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy now
                </button>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-3 gap-2 pt-4 text-[11px] text-[#68756E] border-t border-[#E8DECB]/60">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#123B2A]" />
                  <span>Pan-India Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A]" />
                  <span>100% Authentic Bihar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#123B2A]" />
                  <span>Freshness Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};
