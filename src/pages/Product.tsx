import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { type PantryProduct } from '../types';
import { fetchProducts } from '../services/products';
import { cartService } from '../services/cart';
import { Toast } from '../components/Toast';

export const Product: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sku = searchParams.get('sku') ?? 'premium-100g';
  // Product will be fetched from the backend; initialise as null until loaded
  const [product, setProduct] = useState<PantryProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

// Fetch products on mount / when SKU changes
useEffect(() => {
  const load = async () => {
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
      setError('Unable to load product. Please try again.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [sku]);

// Compute discount safely; if product is null, default to 0
const discountPercentage = product ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

// Variant selector
const handleSelectVariant = (quality: string, weight: number) => {
  const targetSku = `${quality.toLowerCase()}-${weight}g`;
  navigate(`/products/makhana?sku=${targetSku}`);
};

// Add to cart (guard against missing product)
const handleAddToCart = (goToCart = false) => {
  if (!product) return;
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
  if (goToCart) {
    navigate('/cart');
  }
};

// Loading / error / not‑found handling
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading…</p>
    </div>
  );
}
if (error) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-600">{error}</p>
    </div>
  );
}
if (!product) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-600">Product not found.</p>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#FCFAF5] py-8 sm:py-14">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        {/* Back Link */}
        <Link
          to="/#pantry"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pantry collection
        </Link>

        <div className="grid gap-10 lg:grid-cols-12 bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DECB] shadow-sm">
          {/* Left: Product Image Gallery */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#F7F1E5] p-8 rounded-xl border border-[#E8DECB]">
            <span className="self-start text-[10px] font-extrabold uppercase tracking-widest bg-[#123B2A] text-white px-2.5 py-1 rounded">
              {product.quality} Quality
            </span>
            <img
              src={product.image}
              alt={`${product.weightGrams}g ${product.name}`}
              className="max-h-96 w-full object-contain my-6"
            />
            <div className="flex items-center gap-2 text-xs text-[#68756E]">
              <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
              <span>Sealed for natural fresh crunch</span>
            </div>
          </div>

          {/* Right: Product Details & Controls */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6A15B]">
                  NYUTA ELITE MAKHANA
                </span>
                <span className="text-xs text-[#68756E]">• SKU: {product.sku}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1C1C] mt-2">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl font-extrabold text-[#123B2A]">₹{product.price}</span>
                <span className="text-sm text-[#68756E] line-through">₹{product.mrp}</span>
                <span className="bg-[#C6A15B] text-[#092218] text-xs font-extrabold px-2 py-0.5 rounded">
                  {discountPercentage}% OFF
                </span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-[#68756E] leading-relaxed">
                {product.description}
              </p>

              {/* Quality Selector Pills */}
              <div className="mt-6 pt-5 border-t border-[#E8DECB]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-2">
                  Select Quality Grade:
                </label>
                <div className="flex gap-3">
                  {(['Premium', 'Normal'] as const).map((qual) => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => handleSelectVariant(qual, product.weightGrams)}
                      className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
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
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-2">
                  Select Pack Weight:
                </label>
                <div className="flex gap-3">
                  {([100, 200, 250] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleSelectVariant(product.quality, w)}
                      className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
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
              <div className="mt-5 flex items-center gap-4">
                <label htmlFor="quantity" className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
                  Quantity:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-[#E8DECB] bg-white px-3 py-2 text-sm font-bold text-[#1C1C1C] rounded-lg focus:outline-none focus:border-[#123B2A] cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 10].map((amount) => (
                    <option key={amount} value={amount}>
                      {amount} {amount === 1 ? 'pack' : 'packs'}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-semibold text-[#123B2A] bg-[#F7F1E5] px-2.5 py-1 rounded">
                  In Stock ({product.stock} available)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-[#E8DECB] space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#123B2A] bg-white hover:bg-[#F7F1E5] text-xs font-extrabold uppercase tracking-wider text-[#123B2A] rounded-lg transition-colors cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  className="min-h-12 bg-[#123B2A] hover:bg-[#092218] text-xs font-extrabold uppercase tracking-wider text-white rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Buy now
                </button>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-3 gap-2 pt-4 text-[11px] text-[#68756E]">
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
                  <span>Damage Guarantee</span>
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
