import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShoppingBag, Check, Sparkles } from 'lucide-react';
import type { PantryProduct } from '../types';
import { cartService } from '../services/cart';
import { PANTRY_PRODUCTS } from '../data/product';

interface NormalMakhanaSectionProps {
  products?: PantryProduct[];
  onAdded?: (message: string) => void;
}

export const NormalMakhanaSection: React.FC<NormalMakhanaSectionProps> = ({
  products = [],
  onAdded,
}) => {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Filter normal products and order 250g, 200g, 100g
  const fallbackNormal = PANTRY_PRODUCTS.filter((p) => p.quality === 'Normal');
  const availableNormal = products.filter((p) => p.quality === 'Normal');
  const normalList = availableNormal.length >= 3 ? availableNormal : fallbackNormal;

  // Sort descending by weight: 250g, 200g, 100g
  const sortedProducts = [...normalList].sort((a, b) => b.weightGrams - a.weightGrams);

  const handleAddToCart = (product: PantryProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingId === product.id) return;

    setAddingId(product.id);
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

      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 1800);

      if (onAdded) {
        onAdded(`Added 1 × ${product.weightGrams}g ${product.name} to cart.`);
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section
      id="normal"
      aria-label="Normal Makhana"
      className="bg-[#F7F1E5] py-16 sm:py-20 lg:py-24 border-b border-[#E8DECB] relative overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-[#123B2A]/5 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#C6A15B]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#123B2A] text-[#C6A15B] text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>EVERYDAY MAKHANA</span>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#092218] tracking-tight">
            Normal Quality Makhana
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-[#68756E] font-medium leading-relaxed max-w-2xl mx-auto">
            Standard everyday harvest: natural crunch, rich in wholesome nutrients, perfect for home roasting, kheer, curries, and daily snacking.
          </p>
        </div>

        {/* 3 Product Cards Grid: 250g, 200g, 100g */}
        <div className="mt-10 sm:mt-12 lg:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-[1160px] mx-auto items-stretch">
          {sortedProducts.map((product) => {
            const skuParam = product.sku || product.id || `normal-${product.weightGrams}g`;
            const isJustAdded = justAddedId === product.id;
            const discountPercent =
              product.mrp && product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;

            const imageSrc =
              product.image || `/images/products/normal-makhana-${product.weightGrams}g.png`;

            return (
              <article
                key={product.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DECB] hover:border-[#123B2A] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden h-full"
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8DECB] text-[#123B2A] text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs">
                      <Leaf className="w-3 h-3 text-[#123B2A]" />
                      <span>Everyday Grade</span>
                    </span>
                    <span className="text-xs font-black text-[#123B2A] bg-[#FAF7EF] px-2.5 py-1 rounded-lg border border-[#E8DECB]">
                      {product.weightGrams}g Net Wt.
                    </span>
                  </div>

                  {/* Product Packshot Image Container with suggested CSS classes */}
                  <Link
                    to={`/products/makhana?sku=${skuParam}`}
                    className="normal-makhana-image-container flex h-[280px] sm:h-[320px] md:h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#FAF7EF] p-2.5 sm:p-3 border border-[#E8DECB]/80 group-hover:border-[#123B2A]/50 transition-all cursor-pointer shadow-inner"
                    title={`View details for ${product.name} ${product.weightGrams}g`}
                  >
                    <img
                      src={imageSrc}
                      alt={`${product.name} — ${product.weightGrams}g pouch`}
                      className="block h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-104"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/images/products/normal-makhana-${product.weightGrams}g.png`;
                      }}
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="pt-4 space-y-2">
                    <Link
                      to={`/products/makhana?sku=${skuParam}`}
                      className="block group-hover:text-[#123B2A] transition-colors"
                    >
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#092218] tracking-tight">
                        Normal Makhana — {product.weightGrams}g
                      </h3>
                    </Link>

                    <p className="text-xs sm:text-sm text-[#68756E] font-medium leading-relaxed line-clamp-2">
                      Standard everyday grade makhana. Natural crunch, rich in wholesome nutrients, perfect for cooking or snacking.
                    </p>

                    {/* Quality Spec Pill */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF7EF] text-[#123B2A] text-xs font-bold tracking-wide border border-[#E8DECB]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#123B2A]" />
                        <span>Quality:</span>
                        <strong className="font-extrabold uppercase text-[#123B2A]">NORMAL</strong>
                      </span>

                      {discountPercent > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Action Section */}
                <div className="mt-5 pt-4 border-t border-[#E8DECB]">
                  <div className="flex items-baseline justify-between mb-3 px-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#123B2A] font-serif">
                        ₹{product.price}
                      </span>
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-xs font-semibold text-[#8C9B90] line-through">
                          MRP ₹{product.mrp}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#68756E]">
                      ₹{(product.price / (product.weightGrams / 100)).toFixed(0)}/100g
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={addingId === product.id || product.stock <= 0}
                    className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isJustAdded
                        ? 'bg-[#123B2A] text-white ring-2 ring-[#C6A15B]'
                        : 'bg-[#123B2A] hover:bg-[#092218] text-white hover:shadow-lg'
                    }`}
                    aria-label={`Add ${product.weightGrams}g Normal Makhana to cart for ₹${product.price}`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-4 h-4 text-[#C6A15B]" />
                        <span>ADDED TO CART</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#C6A15B]" />
                        <span>ADD TO CART — ₹{product.price}</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NormalMakhanaSection;
