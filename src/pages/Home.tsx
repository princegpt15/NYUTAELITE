import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Truck,
  Leaf,
  Sun,
  Award,
  Star,
  SlidersHorizontal,
} from 'lucide-react';
import { type MakhanaQuality, type PantryProduct } from '../types';
import { fetchProducts } from '../services/products';
import { FAQS } from '../data/faqs';
import { TESTIMONIALS } from '../data/testimonials';
import { cartService } from '../services/cart';
import { Toast } from '../components/Toast';

import heroImage from '../assets/images/brand/makhana-hero.png';
import macroImage from '../assets/images/brand/makhana-macro.png';
import lotusImage from '../assets/images/lotus-source.png';
import featuredImage from '../assets/images/product-featured.png';

// Trust Ribbon items
const trustRibbonItems = [
  { icon: Leaf, label: '100% Authentic Bihar Origin' },
  { icon: Award, label: 'Jumbo Hand-Sorted Quality' },
  { icon: Sun, label: 'Naturally Air-Popped Crunch' },
  { icon: Truck, label: 'Free Express Shipping over ₹499' },
];

// Timeline steps
const sourceTimeline = [
  {
    step: '01',
    title: 'SELECT',
    description: 'Carefully harvested Euryale ferox seeds from traditional freshwater ponds in Bihar.',
    image: lotusImage,
  },
  {
    step: '02',
    title: 'GRADE',
    description: 'Machine-screened and hand-sorted by nut diameter, texture density, and purity.',
    image: macroImage,
  },
  {
    step: '03',
    title: 'PACK',
    description: 'Hygienically puffed and sealed in air-tight food-grade pouches for lasting crunch.',
    image: featuredImage,
  },
  {
    step: '04',
    title: 'DELIVER',
    description: 'Shipped direct to your home pantry with pan-India trackable express delivery.',
    image: heroImage,
  },
];

// Lifestyle moments
const lifestyleMoments = [
  {
    name: 'MORNING',
    tagline: 'Mindful Start',
    note: 'Lightly roasted with a drop of ghee & rock salt to power your morning routine.',
    image: heroImage,
    position: 'object-[75%_55%]',
  },
  {
    name: 'WORK BREAK',
    tagline: 'Clean Focus Snack',
    note: 'Zero-guilt desktop crunch that keeps you energized without afternoon slumps.',
    image: macroImage,
    position: 'object-[70%_45%]',
  },
  {
    name: 'EVENING',
    tagline: 'Tea Time Companion',
    note: 'The perfect authentic pairing for your evening chai or family conversation.',
    image: heroImage,
    position: 'object-[88%_45%]',
  },
];

// Single Product Card Component
function ProductCardItem({
  product,
  onAdded,
}: {
  product: PantryProduct;
  onAdded: (message: string) => void;
}) {
  const navigate = useNavigate();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const discountPercentage = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = (e: React.MouseEvent, goToCheckout = false) => {
    e.preventDefault();
    e.stopPropagation();
    cartService.addItem({
      productId: product.id,
      productName: product.name,
      quality: product.quality,
      weightGrams: product.weightGrams,
      price: product.price,
      mrp: product.mrp,
      quantity: selectedQuantity,
      image: product.image,
    });
    onAdded(`Added ${selectedQuantity} × ${product.weightGrams}g ${product.name} to cart.`);
    if (goToCheckout) {
      navigate('/cart');
    }
  };

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FCFAF5] p-4 shadow-sm border border-[#E8DECB] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#123B2A]">
      <div>
        {/* Product Image Container */}
        <Link to={`/products/makhana?sku=${product.id}`} className="block relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F7F1E5]">
          <img
            src={product.image}
            alt={`${product.weightGrams}g ${product.name}`}
            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Quality Badge */}
          <span
            className={`absolute left-3 top-3 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] rounded-md ${
              product.quality === 'Premium'
                ? 'bg-[#123B2A] text-[#FCFAF5] shadow-xs border border-[#C6A15B]/40'
                : 'bg-[#E8DECB] text-[#123B2A]'
            }`}
          >
            {product.quality}
          </span>
          {/* Save Badge */}
          <span className="absolute right-3 top-3 bg-[#C6A15B] text-[#092218] text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
            {discountPercentage}% OFF
          </span>
        </Link>

        {/* Product Details */}
        <div className="pt-4 px-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#68756E]">
              {product.quality} Grade
            </span>
            <span className="text-xs font-bold text-[#123B2A] bg-[#F7F1E5] px-2 py-0.5 rounded-md">
              {product.weightGrams}g Pouch
            </span>
          </div>

          <Link to={`/products/makhana?sku=${product.id}`}>
            <h3 className="font-serif mt-1 text-xl font-bold text-[#1C1C1C] group-hover:text-[#123B2A] transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-[#68756E] line-clamp-2 leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Pricing & Controls */}
      <div className="mt-5 pt-3 border-t border-[#E8DECB]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-extrabold text-[#123B2A]">₹{product.price}</span>
            <span className="text-xs text-[#68756E] line-through ml-2">₹{product.mrp}</span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor={`qty-${product.id}`} className="text-[11px] font-bold text-[#68756E]">
              Qty:
            </label>
            <select
              id={`qty-${product.id}`}
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(Number(e.target.value))}
              className="bg-white border border-[#E8DECB] text-xs font-bold text-[#1C1C1C] px-2 py-1 rounded-md focus:outline-none focus:border-[#123B2A] cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 10].map((qty) => (
                <option key={qty} value={qty}>
                  {qty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => handleAddToCart(e, false)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-[#123B2A] text-xs font-extrabold uppercase tracking-wider text-[#123B2A] bg-white rounded-lg transition-colors hover:bg-[#F7F1E5] cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> ADD TO CART
          </button>
          <button
            type="button"
            onClick={(e) => handleAddToCart(e, true)}
            className="min-h-11 bg-[#123B2A] hover:bg-[#092218] text-xs font-extrabold uppercase tracking-wider text-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            BUY NOW
          </button>
        </div>
      </div>
    </article>
  );
}

// Main Home Page
export const Home: React.FC = () => {
  const [qualityFilter, setQualityFilter] = useState<'All' | MakhanaQuality>('All');
  const [weightFilter, setWeightFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');
  const [activeFaqId, setActiveFaqId] = useState<string | null>('faq-1');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [products, setProducts] = useState<PantryProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from backend on component mount
  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch((err) => setError(err?.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  // Filter & Sort Logic
  const filteredProducts = products.filter((product) => {
    if (qualityFilter !== 'All' && product.quality !== qualityFilter) return false;
    if (weightFilter !== 0 && product.weightGrams !== weightFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  return (
    <div className="bg-[#FCFAF5] text-[#1C1C1C]">
        {loading && (
          <div className="p-4 text-center text-sm text-[#68756E]">Loading products...</div>
        )}
        {error && (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        )}
      {/* 3. HERO SECTION (EDITORIAL 2-COLUMN SPLIT) */}
      <section className="relative overflow-hidden bg-[#F7F1E5] py-12 sm:py-20 lg:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Editorial Copy Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#123B2A]/10 border border-[#123B2A]/20 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#123B2A]">
                <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" /> PRESTIGE INDIAN MAKHANA
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.04] text-[#092218] tracking-tight">
                Better snacking starts with ingredients you can see.
              </h1>

              <p className="text-base sm:text-xl leading-relaxed text-[#68756E] max-w-lg">
                Discover carefully selected makhana, made for better everyday snacking. Hand-sorted jumbo fox nuts from freshwater ponds.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#pantry"
                  className="inline-flex min-h-12 items-center gap-2.5 bg-[#123B2A] hover:bg-[#092218] px-7 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white rounded-xl transition-all shadow-md cursor-pointer"
                >
                  SHOP MAKHANA <ArrowRight className="h-4 w-4 text-[#C6A15B]" />
                </a>
                <a
                  href="#quality"
                  className="inline-flex min-h-12 items-center gap-2 border border-[#123B2A] bg-white hover:bg-[#FCFAF5] px-6 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#123B2A] rounded-xl transition-all cursor-pointer"
                >
                  EXPLORE OUR QUALITY <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right Editorial Photography Column */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-[#FCFAF5]">
                <img
                  src={heroImage}
                  alt="NYUTA ELITE makhana served in a warm ceramic bowl"
                  className="h-full w-full object-cover object-[75%_center] transition-transform duration-700 hover:scale-105"
                  fetchPriority="high"
                />
                {/* Floating Badge */}
                <div className="absolute bottom-4 left-4 bg-[#123B2A]/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-[#C6A15B]/40 shadow-lg max-w-xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">Purity Guarantee</p>
                  <p className="text-xs font-semibold mt-0.5">100% Unbleached, Air-Popped Lotus Seeds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST RIBBON */}
      <section className="bg-[#123B2A] text-white py-4 border-b border-[#092218]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {trustRibbonItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D5DED6]">
                  <Icon className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 & 7. "GOOD THINGS FOR YOUR PANTRY" & CATALOG */}
      <section id="pantry" className="py-16 sm:py-24 bg-[#FCFAF5] border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
                THE PANTRY COLLECTION
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] mt-1">
                GOOD THINGS FOR YOUR PANTRY
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#68756E]">
                Choose the makhana that fits your everyday snacking.
              </p>
            </div>

            {/* Quality Summary Tag */}
            <div className="inline-flex items-center gap-2 bg-[#F7F1E5] border border-[#E8DECB] px-4 py-2 rounded-xl text-xs font-bold text-[#123B2A] shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#C6A15B]" /> Exactly 6 Verified Packs (100g, 200g, 250g)
            </div>
          </div>

          {/* 8. INSTANT FILTER BAR */}
          <div className="bg-white border border-[#E8DECB] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B2A] mr-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C6A15B]" /> Filter Packs:
              </div>

              {/* Quality Filter Buttons */}
              <div className="flex items-center bg-[#F7F1E5] p-1 rounded-xl border border-[#E8DECB]">
                {(['All', 'Premium', 'Normal'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setQualityFilter(quality)}
                    className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      qualityFilter === quality
                        ? 'bg-[#123B2A] text-white shadow-xs'
                        : 'text-[#68756E] hover:text-[#123B2A]'
                    }`}
                  >
                    {quality === 'All' ? 'All Qualities' : quality}
                  </button>
                ))}
              </div>

              {/* Weight Filter Buttons */}
              <div className="flex items-center bg-[#F7F1E5] p-1 rounded-xl border border-[#E8DECB]">
                {([0, 100, 200, 250] as const).map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setWeightFilter(weight)}
                    className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      weightFilter === weight
                        ? 'bg-[#123B2A] text-white shadow-xs'
                        : 'text-[#68756E] hover:text-[#123B2A]'
                    }`}
                  >
                    {weight === 0 ? 'All Weights' : `${weight}g`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-xs font-bold text-[#68756E]">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#F7F1E5] border border-[#E8DECB] text-xs font-bold text-[#123B2A] px-3.5 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCardItem key={product.id} product={product} onAdded={setToastMsg} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. PREMIUM VS NORMAL COMPARISON SECTION */}
      <section id="quality" className="bg-[#F7F1E5] py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              COMPARISON GUIDE
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] mt-1">
              FIND YOUR PERFECT MAKHANA
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#68756E]">
              We offer two distinct quality grades to fit your everyday kitchen needs.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Premium Quality Column */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#123B2A] shadow-md relative flex flex-col justify-between">
              <div>
                <span className="bg-[#123B2A] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4">
                  PREMIUM QUALITY GRADE
                </span>
                <h3 className="font-serif text-3xl font-bold text-[#123B2A]">PREMIUM QUALITY</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#68756E] leading-relaxed">
                  Handpicked jumbo-grade fox nuts selected for consistent large size, round shape, and crisp expansion with minimal hard shell residue.
                </p>

                <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[#F7F1E5] border border-[#E8DECB]">
                  <img src={heroImage} alt="Premium Makhana jumbo nuts" className="w-full h-full object-cover object-[70%_center]" />
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#1C1C1C]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span><strong>Jumbo Size:</strong> Uniformly sized large pop density</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span><strong>Clean Surface:</strong> Minimal hard shell pieces or black residue</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span><strong>Purity:</strong> Ideal for dry roasting, gifting, or direct bowl serving</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8DECB] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#68756E]">Packs starting at</span>
                  <p className="text-xl font-extrabold text-[#123B2A]">₹160 / 100g</p>
                </div>
                <Link
                  to="/products/makhana?sku=premium-100g"
                  className="bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-colors"
                >
                  Shop Premium
                </Link>
              </div>
            </div>

            {/* Normal Quality Column */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs relative flex flex-col justify-between">
              <div>
                <span className="bg-[#E8DECB] text-[#123B2A] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4">
                  EVERYDAY QUALITY GRADE
                </span>
                <h3 className="font-serif text-3xl font-bold text-[#1C1C1C]">NORMAL QUALITY</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#68756E] leading-relaxed">
                  Standard everyday grade makhana. Slightly varied nut sizes with the exact same natural taste, crunch, and wholesome nutrients.
                </p>

                <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[#F7F1E5] border border-[#E8DECB]">
                  <img src={macroImage} alt="Normal Makhana everyday nuts" className="w-full h-full object-cover object-[70%_center]" />
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#1C1C1C]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span><strong>Everyday Size:</strong> Standard medium pop size mix</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span><strong>Culinary Use:</strong> Excellent for cooking kheer, curries, or spiced roasts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span><strong>Pantry Value:</strong> Economical option for daily household snacking</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8DECB] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#68756E]">Packs starting at</span>
                  <p className="text-xl font-extrabold text-[#123B2A]">₹120 / 100g</p>
                </div>
                <Link
                  to="/products/makhana?sku=normal-100g"
                  className="border border-[#123B2A] text-[#123B2A] hover:bg-[#F7F1E5] text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-colors"
                >
                  Shop Normal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. INGREDIENT STORY SECTION */}
      <section className="bg-white py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
                INGREDIENT TRANSPARENCY
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] leading-tight">
                BETTER SNACKING STARTS WITH WHAT YOU CAN SEE
              </h2>
              <p className="text-sm sm:text-base text-[#68756E] leading-relaxed">
                Unlike heavily processed packaged snacks disguised with artificial powders and oils, NYUTA ELITE makhana is completely unadulterated. What you see in your bowl is 100% real fox nut popped from water lily lotus seeds.
              </p>
              <p className="text-sm sm:text-base text-[#68756E] leading-relaxed">
                Lightly roasted or eaten fresh, it provides an authentic, satisfying crunch rich in plant protein and dietary fiber.
              </p>
              <div>
                <a
                  href="#pantry"
                  className="inline-flex items-center gap-2 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors"
                >
                  Taste the Difference <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl bg-[#F7F1E5] aspect-[4/5] border border-[#E8DECB]">
                <img src={macroImage} alt="Macro texture of makhana" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="overflow-hidden rounded-2xl bg-[#F7F1E5] aspect-[4/5] mt-6 border border-[#E8DECB]">
                <img src={featuredImage} alt="Pantry bowl of makhana" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FROM SOURCE TO PANTRY TIMELINE */}
      <section className="bg-[#092218] text-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              OUR PROCESS
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-1">
              FROM SOURCE TO PANTRY
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#D5DED6]">
              Four deliberate steps ensuring uncompromising quality from Mithila ponds to your home.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sourceTimeline.map((item) => (
              <div key={item.step} className="bg-[#123B2A] p-6 rounded-2xl border border-[#C6A15B]/20 flex flex-col justify-between group hover:border-[#C6A15B] transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl font-extrabold text-[#C6A15B]">{item.step}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#D5DED6]">{item.title}</span>
                  </div>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#092218] mb-4">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-xs text-[#D5DED6] leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. LIFESTYLE SECTION */}
      <section className="bg-white py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-xl mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              DAILY SNACKING
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] mt-1">
              MAKHANA FOR EVERYDAY MOMENTS
            </h2>
            <p className="mt-2 text-sm text-[#68756E]">
              Versatile, light, and delicious at any hour of the day.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {lifestyleMoments.map((moment) => (
              <div key={moment.name} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#123B2A] border border-[#E8DECB]">
                <img
                  src={moment.image}
                  alt={`${moment.name} makhana moment`}
                  className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${moment.position}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#092218]/90 via-[#092218]/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                    {moment.tagline}
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-0.5">{moment.name}</h3>
                  <p className="mt-2 text-xs text-[#D5DED6] line-clamp-2 leading-relaxed">{moment.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. WHY MAKHANA EDUCATIONAL SECTION */}
      <section id="why-makhana" className="bg-[#F7F1E5] py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5 aspect-[4/3] overflow-hidden rounded-3xl bg-white border border-[#E8DECB] shadow-sm">
              <img src={heroImage} alt="Bowl of healthy makhana" className="w-full h-full object-cover" />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
                THE ANCIENT SUPERFOOD
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">
                WHY MAKE MAKHANA YOUR DAILY SNACK?
              </h2>
              <p className="text-sm text-[#68756E] leading-relaxed">
                Makhana has been revered in traditional Indian diets for centuries. Naturally puffed from lotus water lily seeds, it offers a clean, crunchy alternative to deep-fried or artificial potato chips.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-[#E8DECB]">
                  <h4 className="font-bold text-sm text-[#123B2A]">Naturally Gluten-Free</h4>
                  <p className="text-xs text-[#68756E] mt-1">Easily digestible for sensitive stomachs and modern diets.</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E8DECB]">
                  <h4 className="font-bold text-sm text-[#123B2A]">Plant Protein &amp; Fiber</h4>
                  <p className="text-xs text-[#68756E] mt-1">Keeps you satisfied longer between meals.</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E8DECB]">
                  <h4 className="font-bold text-sm text-[#123B2A]">Low Calorie Density</h4>
                  <p className="text-xs text-[#68756E] mt-1">Enjoy a generous bowl without excessive calorie intake.</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E8DECB]">
                  <h4 className="font-bold text-sm text-[#123B2A]">Versatile Flavor Profile</h4>
                  <p className="text-xs text-[#68756E] mt-1">Takes on your favorite herbs, spices, or sweet seasonings perfectly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 15. CUSTOMER REVIEWS SECTION */}
      <section className="bg-white py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              VERIFIED FEEDBACK
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#092218] mt-1">
              WHAT OUR CUSTOMERS SAY
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((review) => (
              <div key={review.id} className="bg-[#FCFAF5] p-6 rounded-2xl border border-[#E8DECB] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#C6A15B] mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#1C1C1C] italic leading-relaxed">
                    "{review.quote}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E8DECB] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#123B2A]">{review.name}</h4>
                    <p className="text-[10px] text-[#68756E]">{review.location} • {review.role}</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#123B2A]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 16. FAQ SECTION (ACCORDION) */}
      <section id="faq" className="bg-[#FCFAF5] py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[960px] px-5 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] mt-1">
              EVERYTHING YOU NEED TO KNOW
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => {
              const isOpen = activeFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-[#E8DECB] overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#1C1C1C] hover:text-[#123B2A] cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-[#C6A15B] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#68756E] leading-relaxed border-t border-[#E8DECB]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 17. FINAL BANNER CTA */}
      <section className="relative bg-[#123B2A] text-white py-20 sm:py-28 overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative mx-auto max-w-3xl px-5 text-center space-y-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
            NYUTA ELITE MAKHANA
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-bold text-white leading-tight">
            MAKE MAKHANA PART OF YOUR PANTRY
          </h2>
          <p className="text-base sm:text-lg text-[#D5DED6]">
            Explore our carefully selected makhana.
          </p>
          <div>
            <a
              href="#pantry"
              className="inline-flex min-h-12 items-center gap-2 bg-[#C6A15B] hover:bg-[#D8B168] text-[#092218] text-xs sm:text-sm font-extrabold uppercase tracking-widest px-8 rounded-xl transition-colors shadow-lg cursor-pointer"
            >
              SHOP MAKHANA <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Toast Feedback */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
};
