import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Package } from 'lucide-react';
import { type PantryProduct, type MakhanaQuality } from '../types';
import { fetchProducts } from '../services/products';
import { PANTRY_PRODUCTS } from '../data/product';
import { ProductCard } from '../components/ProductCard';
import { Toast } from '../components/Toast';
import { Breadcrumb } from '../components/Breadcrumb';

export const Categories: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type');

  const [products, setProducts] = useState<PantryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [selectedQuality, setSelectedQuality] = useState<'All' | MakhanaQuality>(
    initialType === 'Premium' ? 'Premium' : initialType === 'Normal' ? 'Normal' : 'All'
  );
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'newest'>('popular');

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then((data) => {
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(PANTRY_PRODUCTS);
        }
      })
      .catch(() => {
        // Safe fallback to PANTRY_PRODUCTS
        setProducts(PANTRY_PRODUCTS);
      })
      .finally(() => setLoading(false));
  }, []);

  // Sync quality filter when URL query param changes
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'Premium') {
      setSelectedQuality('Premium');
    } else if (typeParam === 'Normal') {
      setSelectedQuality('Normal');
    }
  }, [searchParams]);

  const handleSelectQuality = (q: 'All' | MakhanaQuality) => {
    setSelectedQuality(q);
    if (q === 'All') {
      searchParams.delete('type');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ type: q });
    }
  };

  const filteredProducts = products
    .filter((p) => {
      if (selectedQuality !== 'All' && p.quality !== selectedQuality) return false;
      if (selectedWeight !== 0 && p.weightGrams !== selectedWeight) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return (b.sku || '').localeCompare(a.sku || '');
      // Default: popular / standard order
      return a.price - b.price;
    });

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-8 lg:py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shop All Makhana' },
          ]}
        />

        {/* Header Section */}
        <div className="bg-[#123B2A] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-[#C6A15B]/30">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "url('/images/quality/premium-jumbo-makhana.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCFAF5]/10 backdrop-blur-md border border-[#C6A15B]/40 text-[#C6A15B] text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SHOP BY GRADE &amp; PACK SIZE</span>
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#FCFAF5]">
              Buy Fox Nuts Online — All Makhana Packs & Sizes
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#D5DED6] leading-relaxed">
              From hand-sorted Jumbo Premium grade to versatile everyday Normal harvest, choose the exact crunch and pouch size tailored to your pantry.
            </p>
          </div>

          <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-[#C6A15B]/15 blur-3xl pointer-events-none" />
        </div>

        {/* Category Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Premium */}
          <div
            onClick={() => handleSelectQuality('Premium')}
            className={`rounded-2xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              selectedQuality === 'Premium'
                ? 'bg-gradient-to-br from-[#123B2A] to-[#092218] text-white border-[#C6A15B] shadow-xl ring-2 ring-[#C6A15B]/50'
                : 'bg-white hover:border-[#123B2A] text-[#1C1C1C] border-[#E8DECB] shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        selectedQuality === 'Premium'
                          ? 'bg-[#C6A15B] text-[#092218]'
                          : 'bg-[#123B2A] text-white'
                      }`}
                    >
                      TOP TIER
                    </span>
                    <span className="text-xs font-bold opacity-80">3 Pouch Sizes</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold">Premium Jumbo Makhana</h2>
                </div>

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#FAF7EF] p-1.5 border border-[#E8DECB]/60 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img
                    src="/images/products/premium-makhana-250g.png"
                    alt="NYUTA ELITE Premium Makhana pouch packaging"
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    width={96}
                    height={96}
                  />
                </div>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  selectedQuality === 'Premium' ? 'text-[#D5DED6]' : 'text-[#68756E]'
                }`}
              >
                Handpicked 6-suta jumbo puffs with uniform sphere size, shatteringly crisp crunch, and meticulously sorted shells. Ideal for direct roasting and mindful gifting.
              </p>
              <div className="flex items-center gap-4 text-xs font-bold pt-1">
                <span>100g • 200g • 250g</span>
                <span>From ₹160</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-current/15 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">
                {selectedQuality === 'Premium' ? '✓ Currently Viewing' : 'Filter Premium →'}
              </span>
            </div>
          </div>

          {/* Card 2: Normal */}
          <div
            onClick={() => handleSelectQuality('Normal')}
            className={`rounded-2xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              selectedQuality === 'Normal'
                ? 'bg-gradient-to-br from-[#123B2A] to-[#092218] text-white border-[#C6A15B] shadow-xl ring-2 ring-[#C6A15B]/50'
                : 'bg-white hover:border-[#123B2A] text-[#1C1C1C] border-[#E8DECB] shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        selectedQuality === 'Normal'
                          ? 'bg-[#C6A15B] text-[#092218]'
                          : 'bg-[#E8DECB] text-[#123B2A]'
                      }`}
                    >
                      DAILY PANTRY
                    </span>
                    <span className="text-xs font-bold opacity-80">3 Pouch Sizes</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold">Normal Everyday Makhana</h2>
                </div>

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#FAF7EF] p-1.5 border border-[#E8DECB]/60 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img
                    src="/images/products/normal-makhana-250g.png"
                    alt="Regular Makhana silver pouch packaging"
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    width={96}
                    height={96}
                  />
                </div>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  selectedQuality === 'Normal' ? 'text-[#D5DED6]' : 'text-[#68756E]'
                }`}
              >
                Standard authentic Bihar harvest. Wholesome natural fox nuts perfect for home roasting, adding to traditional kheer, gravies, and everyday nutritious snacking.
              </p>
              <div className="flex items-center gap-4 text-xs font-bold pt-1">
                <span>100g • 200g • 250g</span>
                <span>From ₹120</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-current/15 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">
                {selectedQuality === 'Normal' ? '✓ Currently Viewing' : 'Filter Normal →'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Sorting Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DECB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Quality Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {(['All', 'Premium', 'Normal'] as const).map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => handleSelectQuality(grade)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                  selectedQuality === grade
                    ? 'bg-[#123B2A] text-white shadow-xs'
                    : 'bg-[#F7F1E5] text-[#1C1C1C] hover:bg-[#E8DECB]'
                }`}
              >
                {grade === 'All' ? 'All Grades' : `${grade} Makhana`}
              </button>
            ))}
          </div>

          {/* Weight Filters & Sorting */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Weight Pills */}
            <div className="flex items-center gap-1.5">
              {[
                { label: 'All Packs', val: 0 },
                { label: '100g', val: 100 },
                { label: '200g', val: 200 },
                { label: '250g', val: 250 },
              ].map((w) => (
                <button
                  key={w.val}
                  type="button"
                  onClick={() => setSelectedWeight(w.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                    selectedWeight === w.val
                      ? 'bg-[#C6A15B] text-[#092218] font-black'
                      : 'bg-[#FCFAF5] border border-[#E8DECB] text-[#68756E] hover:text-[#1C1C1C]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="cat-sort" className="text-xs font-bold text-[#68756E] hidden sm:inline">
                Sort:
              </label>
              <select
                id="cat-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FCFAF5] border border-[#E8DECB] text-xs font-bold text-[#1C1C1C] px-3 py-2 rounded-lg focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="popular">Popular</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-96 rounded-2xl bg-white border border-[#E8DECB]" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DECB] space-y-4">
            <Package className="w-12 h-12 text-[#C6A15B] mx-auto" />
            <h3 className="font-serif text-xl font-bold text-[#1C1C1C]">
              No Makhana packs found for this filter
            </h3>
            <p className="text-xs text-[#68756E]">
              Try clearing weight or grade selections to see all available pantry options.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedQuality('All');
                setSelectedWeight(0);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdded={(msg) => setToastMsg(msg)}
                listId="categories_collection"
                listName="Categories Makhana"
              />
            ))}
          </div>
        )}
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
};
