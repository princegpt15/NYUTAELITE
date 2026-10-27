import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Leaf,
  Sun,
  Award,
  Star,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Package,
} from 'lucide-react';
import { type MakhanaQuality, type PantryProduct } from '../types';
import { fetchProducts } from '../services/products';
import { PANTRY_PRODUCTS } from '../data/product';
import { ProductCard } from '../components/ProductCard';
import { FAQS } from '../data/faqs';
import { TESTIMONIALS } from '../data/testimonials';
import { trackViewItemList } from '../services/analytics';
import { Toast } from '../components/Toast';
import { BulkOrderChoiceModal } from '../components/BulkOrderChoiceModal';

import heroImage from '../assets/images/brand/makhana-hero.png';
import macroImage from '../assets/images/brand/makhana-macro.png';
import featuredImage from '../assets/images/product-featured.png';
import logoImage from '../assets/images/brand-emblem.png';
import CategoryCard from '../components/CategoryCard';

// ── Botanical SVG background decoration for the hero ──────────────
export const seo = {
  title: 'NYUTA ELITE Makhana – Premium Fox Nuts',
  description:
    'Shop NYUTA ELITE premium fox nuts (makhana) from Bihar. Hand‑sorted, air‑popped, 100 % natural snack for health & taste.',
};

function HeroBotanicalPattern() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 560"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Wide warm gold bloom behind left column / logo zone */}
        <radialGradient id="hbg-gold" cx="30%" cy="44%" r="52%">
          <stop offset="0%"   stopColor="#C6A15B" stopOpacity="0.12" />
          <stop offset="60%"  stopColor="#E8DECB" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#F7F1E5" stopOpacity="0"    />
        </radialGradient>
        {/* Smaller intense spot directly behind logo */}
        <radialGradient id="hbg-spot" cx="30%" cy="36%" r="22%">
          <stop offset="0%"   stopColor="#D4B06A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#C6A15B" stopOpacity="0"    />
        </radialGradient>
        {/* Subtle green tint in opposite corner */}
        <radialGradient id="hbg-green" cx="85%" cy="80%" r="40%">
          <stop offset="0%"   stopColor="#123B2A" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#F7F1E5" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Background colour layers */}
      <rect width="800" height="560" fill="url(#hbg-gold)"  />
      <rect width="800" height="560" fill="url(#hbg-spot)"  />
      <rect width="800" height="560" fill="url(#hbg-green)" />

      {/* ── Concentric elliptic arcs (page-level framing) ─────────── */}
      <ellipse cx="240" cy="200" rx="310" ry="210" fill="none"
               stroke="#C6A15B" strokeWidth="0.8" opacity="0.08" />
      <ellipse cx="240" cy="200" rx="255" ry="168" fill="none"
               stroke="#123B2A" strokeWidth="0.6" opacity="0.06" />
      <ellipse cx="240" cy="200" rx="196" ry="126" fill="none"
               stroke="#C6A15B" strokeWidth="0.5" opacity="0.05" />

      {/* ── Fine dot arc ring around the logo spot ─────────────────── */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 2 * Math.PI;
        const rx = 108, ry = 108;
        const cx = 240 + rx * Math.cos(angle);
        const cy = 200 + ry * Math.sin(angle);
        return <circle key={i} cx={cx} cy={cy} r="1.8" fill="#C6A15B" opacity="0.18" />;
      })}
      {/* Outer dot ring, sparser */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * 2 * Math.PI + Math.PI / 16;
        const rx = 148, ry = 148;
        const cx = 240 + rx * Math.cos(angle);
        const cy = 200 + ry * Math.sin(angle);
        return <circle key={`o${i}`} cx={cx} cy={cy} r="1.2" fill="#C6A15B" opacity="0.10" />;
      })}

      {/* ── Botanical leaf silhouettes ─────────────────────────────── */}

      {/* Top-right branch cluster */}
      <g opacity="0.13" stroke="#123B2A" strokeWidth="1.1" fill="none"
         className="hero-arc-drift" style={{ transformOrigin: '700px 68px' }}>
        {/* Leaf 1 */}
        <path d="M700 42 C724 62 740 84 700 114 C660 84 676 62 700 42Z" />
        <line x1="700" y1="42" x2="700" y2="114" strokeWidth="0.9" />
        <path d="M700 70 C712 73 722 79 726 92" strokeWidth="0.7" />
        <path d="M700 70 C688 73 678 79 674 92" strokeWidth="0.7" />
      </g>
      {/* Leaf 2 — offset, gold */}
      <g opacity="0.09" stroke="#C6A15B" strokeWidth="0.9" fill="none"
         style={{ transform: 'rotate(-28deg)', transformOrigin: '752px 36px' }}>
        <path d="M752 18 C771 36 784 56 752 82 C720 56 733 36 752 18Z" />
        <line x1="752" y1="18" x2="752" y2="82" strokeWidth="0.8" />
      </g>
      {/* Leaf 3 — top-right, smaller */}
      <g opacity="0.07" stroke="#123B2A" strokeWidth="0.8" fill="none">
        <path d="M762 108 C775 120 782 134 762 150 C742 134 749 120 762 108Z" />
        <line x1="762" y1="108" x2="762" y2="150" />
      </g>
      {/* Curving stem branch, top-right */}
      <path d="M680 30 Q720 60 740 110 Q750 145 738 175"
            stroke="#123B2A" strokeWidth="0.7" fill="none" opacity="0.08" />

      {/* Bottom-left leaf cluster */}
      <g opacity="0.12" stroke="#123B2A" strokeWidth="1.1" fill="none">
        <path d="M55 435 C78 455 95 478 55 512 C15 478 32 455 55 435Z" />
        <line x1="55" y1="435" x2="55" y2="512" strokeWidth="0.9" />
        <path d="M55 460 C66 463 75 469 80 481" strokeWidth="0.7" />
        <path d="M55 460 C44 463 35 469 30 481" strokeWidth="0.7" />
      </g>
      {/* Gold leaf, bottom-left offset */}
      <g opacity="0.08" stroke="#C6A15B" strokeWidth="0.9" fill="none"
         style={{ transform: 'rotate(22deg)', transformOrigin: '22px 498px' }}>
        <path d="M22 476 C40 492 54 510 22 534 C-10 510 4 492 22 476Z" />
        <line x1="22" y1="476" x2="22" y2="534" />
      </g>
      {/* Stem, bottom-left */}
      <path d="M28 540 Q50 510 55 468 Q58 440 50 415"
            stroke="#123B2A" strokeWidth="0.7" fill="none" opacity="0.07" />

      {/* ── Corner micro-ornaments ─────────────────────────────────── */}
      {/* Solid dots */}
      {[
        [20, 20], [780, 20], [20, 540], [780, 540],
        [64, 62], [736, 62], [64, 498], [736, 498],
      ].map(([x, y], i) => (
        <circle key={`d${i}`} cx={x} cy={y} r="2.4" fill="#C6A15B" opacity="0.16" />
      ))}
      {/* Diamond accents at 4 page corners */}
      {[
        [20, 20], [780, 20], [20, 540], [780, 540],
      ].map(([x, y], i) => (
        <rect key={`dm${i}`}
          x={x - 3} y={y - 3}
          width="6" height="6"
          transform={`rotate(45,${x},${y})`}
          fill="none" stroke="#C6A15B" strokeWidth="0.6" opacity="0.20"
        />
      ))}

      {/* ── Top & bottom hairline rules ────────────────────────────── */}
      <line x1="0" y1="3"   x2="800" y2="3"   stroke="#C6A15B" strokeWidth="0.6" opacity="0.12" />
      <line x1="0" y1="557" x2="800" y2="557" stroke="#C6A15B" strokeWidth="0.6" opacity="0.12" />

      {/* ── Fine cross-hatch texture patch (top-right quadrant) ─────── */}
      <g opacity="0.04" stroke="#123B2A" strokeWidth="0.5">
        {[620,640,660,680,700,720,740,760].map(x => (
          <line key={`h${x}`} x1={x} y1="0" x2={x} y2="180" />
        ))}
        {[20,40,60,80,100,120,140,160].map(y => (
          <line key={`v${y}`} x1="600" y1={y} x2="800" y2={y} />
        ))}
      </g>
    </svg>
  );
}

// Packaging Verified Benefit Icons
function BenefitLeafIcon() {
  return (
    <svg
      className="w-6 h-6 sm:w-7 sm:h-7 text-[#123B2A]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function BenefitNoPreservativesIcon() {
  return (
    <svg
      className="w-6 h-6 sm:w-7 sm:h-7 text-[#123B2A]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 2v6.5a4 4 0 0 1-.8 2.3L4.2 17.2A2.5 2.5 0 0 0 6.3 21h11.4a2.5 2.5 0 0 0 2.1-3.8L14.8 10.8A4 4 0 0 1 14 8.5V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="#C6A15B" strokeWidth="2.5" />
    </svg>
  );
}

function BenefitProteinIcon() {
  return (
    <svg
      className="w-6 h-6 sm:w-7 sm:h-7 text-[#123B2A]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5.5 14.5C5.5 11 8 9 11 9c1.6 0 3.2.9 4 2.3.8 1.4 2.1 2.2 3.6 2.2H20a2 2 0 0 1 2 2v.8a3.5 3.5 0 0 1-3.5 3.5h-7a5.5 5.5 0 0 1-6-5.3Z" />
      <path d="M9.5 9V7a2.5 2.5 0 0 1 5 0v2" />
      <circle cx="12" cy="7" r="1.2" fill="#C6A15B" stroke="none" />
    </svg>
  );
}

function BenefitFiberIcon() {
  return (
    <svg
      className="w-6 h-6 sm:w-7 sm:h-7 text-[#123B2A]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21V9" />
      <path d="M12 9C12 5 9.5 3 6 4c0 4 2.5 6 6 5Z" />
      <path d="M12 9C12 5 14.5 3 18 4c0 4-2.5 6-6 5Z" />
      <path d="M12 14.5c-2.5-1-4.5 0-5.5 1.8 2.2 1.2 4.5.3 5.5-1.8Z" />
      <path d="M12 14.5c2.5-1 4.5 0 5.5 1.8-2.2 1.2-4.5.3-5.5-1.8Z" />
    </svg>
  );
}

const benefitItems = [
  {
    id: 'premium-quality',
    label: 'Premium Quality Makhana',
    icon: BenefitLeafIcon,
  },
  {
    id: 'no-preservatives',
    label: 'No Added Preservatives',
    icon: BenefitNoPreservativesIcon,
  },
  {
    id: 'high-protein',
    label: 'High Protein',
    icon: BenefitProteinIcon,
  },
  {
    id: 'high-fiber',
    label: 'High Fiber',
    icon: BenefitFiberIcon,
  },
];

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
    image: '/images/process/01-harvest-pond.webp',
  },
  {
    step: '02',
    title: 'GRADE',
    description: 'Machine-screened and hand-sorted by nut diameter, texture density, and purity.',
    image: '/images/process/02-hand-sorting.webp',
  },
  {
    step: '03',
    title: 'PACK',
    description: 'Hygienically puffed and sealed in air-tight food-grade pouches for lasting crunch.',
    image: '/images/process/03-clean-packing.webp',
  },
  {
    step: '04',
    title: 'DELIVER',
    description: 'Shipped direct to your home pantry with pan-India trackable express delivery.',
    image: '/images/process/04-express-delivery.webp',
  },
];

// Lifestyle moments
const lifestyleMoments = [
  {
    name: 'MORNING',
    tagline: 'Mindful Start',
    note: 'Lightly roasted with a drop of ghee & rock salt to power your morning routine.',
    image: '/images/lifestyle/morning-mindful-snack.webp',
    position: 'object-center',
  },
  {
    name: 'WORK BREAK',
    tagline: 'Clean Focus Snack',
    note: 'Zero-guilt desktop crunch that keeps you energized without afternoon slumps.',
    image: '/images/lifestyle/work-break-snack.webp',
    position: 'object-center',
  },
  {
    name: 'EVENING',
    tagline: 'Tea Time Companion',
    note: 'The perfect authentic pairing for your evening chai or family conversation.',
    image: '/images/lifestyle/evening-chai-snack.webp',
    position: 'object-center',
  },
];

// Product Skeleton Loader
function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#F1F0D9] p-3 border border-[#D8D9C2] shadow-xs animate-pulse space-y-3">
      <div className="aspect-square rounded-xl bg-[#D8D9C2]/60" />
      <div className="space-y-2 pt-1">
        <div className="h-3 bg-[#D8D9C2]/60 rounded w-1/3" />
        <div className="h-4 bg-[#D8D9C2]/60 rounded w-3/4" />
        <div className="h-3 bg-[#D8D9C2]/60 rounded w-1/2" />
      </div>
      <div className="pt-2 border-t border-[#D8D9C2] flex items-center justify-between">
        <div className="h-4 bg-[#D8D9C2]/60 rounded w-1/4" />
        <div className="h-8 bg-[#123D2D]/30 rounded-xl w-full" />
      </div>
    </div>
  );
}

// Single Product Card Component
function FlavouredMakhanaGrid({ products, onAdded }: { products: PantryProduct[]; onAdded: (msg: string) => void }) {
  const flavours = [
    {
      name: 'Peri Peri Makhana',
      image: '/images/flavoured-makhana/peri-peri.png',
      sku: 'peri-peri-100g',
      description: 'Roasted makhana lightly dusted with fiery peri-peri and paprika spice.',
      tag: 'Spicy & Tangy',
    },
    {
      name: 'Pudina (Mint) Makhana',
      image: '/images/flavoured-makhana/pudina.png',
      sku: 'pudina-100g',
      description: 'Crispy popped makhana coated in fragrant garden mint and delicate spices.',
      tag: 'Fresh & Herbal',
    },
    {
      name: 'Cream & Onion Makhana',
      image: '/images/flavoured-makhana/cream-onion.png',
      sku: 'cream-onion-100g',
      description: 'Savory roasted crunch infused with rich sour cream and spring onion herbs.',
      tag: 'Savory Crunch',
    },
    {
      name: 'Himalayan Pink Salt Makhana',
      image: '/images/flavoured-makhana/pink-salt.png',
      sku: 'pink-salt-100g',
      description: 'Pure roasted crunch seasoned with natural coarse pink rock salt crystals.',
      tag: 'Classic Mineral',
    },
    {
      name: 'Cheese Makhana',
      image: '/images/flavoured-makhana/cheese.png',
      sku: 'cheese-100g',
      description: 'Golden roasted makhana coated in delectable yellow cheddar cheese seasoning.',
      tag: 'Rich & Cheesy',
    },
    {
      name: 'Achari Masala Makhana',
      image: '/images/flavoured-makhana/achari.png',
      sku: 'achari-100g',
      description: 'Tangy Indian pickle spices, fragrant mustard seeds, and punchy aromatics.',
      tag: 'Pickle Spiced',
    },
  ];

  return (
    <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#617653] scrollbar-track-transparent xl:grid xl:grid-cols-6 xl:overflow-visible">
      {flavours.map((flavour) => {
        const product = products.find(
          (p) => p.name.toLowerCase().includes(flavour.name.toLowerCase()) || p.sku === flavour.sku
        );
        if (product && product.active) {
          return (
            <div key={flavour.sku} className="w-[220px] sm:w-[240px] xl:w-auto shrink-0 snap-start">
              <ProductCard product={product} onAdded={onAdded} />
            </div>
          );
        }
        // Placeholder for coming soon
        return (
          <article
            key={flavour.sku}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#F1F0D9] p-3.5 sm:p-4 shadow-xs border border-[#D8D9C2] w-[220px] sm:w-[240px] xl:w-auto shrink-0 snap-start transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#123D2D]"
          >
            <div>
              {/* Product Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white border border-[#D8D9C2]">
                <img
                  src={flavour.image}
                  alt={flavour.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width={260}
                  height={195}
                  onError={(e) => {
                    // Fallback to jpg if png fails, or default pack
                    const target = e.target as HTMLImageElement;
                    if (target.src.endsWith('.png')) {
                      target.src = target.src.replace('.png', '.jpg');
                    }
                  }}
                />
                {/* Coming Soon Badge */}
                <span className="absolute right-2.5 top-2.5 bg-[#C9A65B] text-[#183B2D] text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                  Coming Soon
                </span>
              </div>

              {/* Product Details */}
              <div className="pt-3 px-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A65B]">
                    {flavour.tag}
                  </span>
                  <span className="text-[11px] sm:text-xs font-extrabold text-[#183B2D] bg-[#D8D9C2] px-2 py-0.5 rounded-md border border-[#C6C7B0]">
                    100g
                  </span>
                </div>
                <h3 className="font-serif mt-1.5 text-base sm:text-lg font-bold text-[#183B2D] leading-snug">
                  {flavour.name}
                </h3>
                <p className="mt-1.5 text-xs font-medium text-[#617653] line-clamp-2 leading-relaxed">
                  {flavour.description}
                </p>
              </div>
            </div>

            {/* Availability State */}
            <div className="mt-4 pt-3 border-t border-[#D8D9C2] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#617653] italic">Crafting batch</span>
              <span className="bg-[#123D2D] text-white text-xs font-extrabold px-2.5 py-1 rounded-md">
                Coming Soon
              </span>
            </div>
          </article>
        );
      })}
    </div>
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
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const amount = carouselRef.current.clientWidth * 0.75;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const loadCatalog = () => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((data) => {
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(PANTRY_PRODUCTS);
        }
      })
      .catch(() => {
        setProducts(PANTRY_PRODUCTS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((product) => {
      if (qualityFilter !== 'All' && product.quality !== qualityFilter) return false;
      if (weightFilter !== 0 && product.weightGrams !== weightFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

  useEffect(() => {
    if (!loading && !error && filteredProducts.length > 0) {
      const listId =
        qualityFilter !== 'All' || weightFilter !== 0
          ? `home_filtered_${qualityFilter.toLowerCase()}_${weightFilter || 'all'}`
          : 'home_pantry_collection';
      const listName =
        qualityFilter !== 'All' || weightFilter !== 0
          ? `Filtered Pantry (${qualityFilter}${weightFilter ? ` ${weightFilter}g` : ''})`
          : 'Home Pantry Collection';
      trackViewItemList({
        listId,
        listName,
        products: filteredProducts,
      });
    }
  }, [loading, error, filteredProducts, qualityFilter, weightFilter]);

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [filteredProducts]);

  return (
    <div className="bg-[#FCFAF5] text-[#1C1C1C] overflow-x-hidden">
      {/* 1. HERO SECTION — Enhanced with botanical pattern + logo halo */}
      <section className="relative overflow-hidden bg-[#F7F1E5] py-12 sm:py-20 lg:py-24 border-b border-[#E8DECB]">
        {/* Botanical SVG background pattern */}
        <HeroBotanicalPattern />

        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Editorial Copy Column */}
            <div className="lg:col-span-6 space-y-5">

              {/* ── Premium Logo Medallion ──────────────────────────────── */}
              <div className="flex justify-center lg:justify-start mb-1">

                {/* Outermost wrapper: entrance animation + float */}
                <div className="hero-logo-animate hero-medallion-float relative inline-flex items-center justify-center">

                  {/* Layer 1 — Diffused gold bloom (pure CSS blur, no layout impact) */}
                  <span
                    aria-hidden="true"
                    className="hero-halo-bloom absolute rounded-full pointer-events-none"
                    style={{
                      width: '180%',
                      height: '180%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'radial-gradient(circle, rgba(198,161,91,0.22) 0%, rgba(198,161,91,0.08) 45%, transparent 72%)',
                      filter: 'blur(14px)',
                    }}
                  />

                  {/* Layer 2 — Decorative SVG arc ring (slow rotation) */}
                  <svg
                    aria-hidden="true"
                    className="hero-arc-drift absolute pointer-events-none"
                    style={{
                      width: '150%',
                      height: '150%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    viewBox="0 0 200 200"
                  >
                    {/* Dashed outer ring */}
                    <circle cx="100" cy="100" r="92"
                      fill="none"
                      stroke="#C6A15B"
                      strokeWidth="0.8"
                      strokeDasharray="4 6"
                      opacity="0.45"
                    />
                    {/* Solid fine ring */}
                    <circle cx="100" cy="100" r="86"
                      fill="none"
                      stroke="#C6A15B"
                      strokeWidth="0.5"
                      opacity="0.25"
                    />
                    {/* Cardinal leaf tips */}
                    {[0, 90, 180, 270].map((deg, i) => (
                      <g key={i} style={{ transform: `rotate(${deg}deg)`, transformOrigin: '100px 100px' }}>
                        <path
                          d="M100 8 C104 14 108 20 100 28 C92 20 96 14 100 8Z"
                          fill="#C6A15B"
                          opacity="0.38"
                        />
                      </g>
                    ))}
                    {/* Intercardinal dots */}
                    {[45, 135, 225, 315].map((deg, i) => {
                      const rad = (deg * Math.PI) / 180;
                      const x = 100 + 92 * Math.sin(rad);
                      const y = 100 - 92 * Math.cos(rad);
                      return <circle key={`id${i}`} cx={x} cy={y} r="2.2" fill="#C6A15B" opacity="0.30" />;
                    })}
                  </svg>

                  {/* Layer 3 — Emblem proper: warm gradient shell + border + shadow */}
                  <div
                    className="relative z-10 rounded-full"
                    style={{
                      padding: '5px',
                      background: 'linear-gradient(145deg, rgba(212,176,106,0.30) 0%, rgba(247,241,229,0.85) 50%, rgba(212,176,106,0.20) 100%)',
                      boxShadow: '0 0 0 1.5px rgba(198,161,91,0.50), 0 4px 24px rgba(18,59,42,0.14), 0 1px 4px rgba(18,59,42,0.10)',
                    }}
                  >
                    {/* Inner white mount */}
                    <div
                      className="rounded-full overflow-hidden bg-white"
                      style={{
                        padding: '3px',
                        boxShadow: 'inset 0 0 0 1px rgba(198,161,91,0.22)',
                      }}
                    >
                      <img
                        src={logoImage}
                        alt="NYUTA ELITE MAKHANA logo"
                        className="block rounded-full object-contain w-[108px] sm:w-[124px] md:w-[136px] lg:w-[152px]"
                        fetchPriority="high"
                        decoding="async"
                        width={152}
                        height={152}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Eyebrow label */}
              <div className="flex items-center text-[#123D2D] uppercase tracking-[0.15em] font-extrabold text-sm hero-eyebrow-animate">
                <div className="flex-1 h-px bg-[#C9A65B] mr-2" />
                PRESTIGE INDIAN MAKHANA
                <div className="flex-1 h-px bg-[#C9A65B] ml-2" />
              </div>

              {/* Headline */}
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.04] text-[#092218] tracking-tight hero-headline-animate">
                NYUTA ELITE MAKHANA – Premium Fox Nuts from Bihar
              </h1>

              {/* Description */}
              <p className="text-base sm:text-xl leading-relaxed text-[#68756E] max-w-lg font-medium hero-desc-animate">
                Discover NYUTA ELITE MAKHANA, crafted for mindful everyday snacking. Hand-sorted jumbo Bihar fox nuts from pristine freshwater ponds.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2 hero-cta-animate">
                <a
                  href="#pantry"
                  className="inline-flex min-h-12 items-center gap-2.5 bg-[#123B2A] hover:bg-[#092218] active:bg-black px-7 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white rounded-xl transition-all shadow-md cursor-pointer"
                >
                  SHOP MAKHANA <ArrowRight className="h-4 w-4 text-[#C6A15B]" />
                </a>
                <a
                  href="#quality"
                  className="inline-flex min-h-12 items-center gap-2 border border-[#123B2A] bg-white hover:bg-[#FCFAF5] active:bg-[#E8DECB] px-6 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#123B2A] rounded-xl transition-all cursor-pointer"
                >
                  EXPLORE OUR QUALITY <ArrowUpRight className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(true)}
                  className="inline-flex min-h-12 items-center gap-2.5 bg-[#123B2A] hover:bg-[#092218] active:bg-black px-7 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white rounded-xl transition-all shadow-md cursor-pointer"
                >
                  ORDER IN BULK <ArrowRight className="h-4 w-4 text-[#C6A15B]" />
                </button>
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
                  decoding="async"
                  width={800}
                  height={600}
                />
                {/* Floating Purity Badge */}
                <div className="absolute bottom-4 left-4 bg-[#123B2A]/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-[#C6A15B]/40 shadow-lg max-w-xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                    Purity Guarantee
                  </p>
                  <p className="text-xs font-semibold mt-0.5">
                    100% Unbleached, Air-Popped Lotus Seeds
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
{isBulkModalOpen && <BulkOrderChoiceModal isOpen={isBulkModalOpen} onClose={() => setBulkModalOpen(false)} />}

      {/* 4 HOMEPAGE BENEFIT ICONS & TRUST RIBBON */}
      <section className="bg-[#123B2A] text-white py-8 sm:py-10 border-b border-[#092218]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12 space-y-8 sm:space-y-10">
          {/* Four Packaging Benefit Items */}
          <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center">
            {benefitItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-start text-center group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-[#123B2A] ring-2 ring-[#C6A15B]/70 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                    <Icon />
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-white text-center leading-snug max-w-[140px]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-[#C6A15B]/20" />

          {/* Trust Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {trustRibbonItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D5DED6]"
                >
                  <Icon className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORY GRID — 6 cards, 2-col × 3-row on mobile ────────── */}
      <section className="bg-[#123B2A] py-10 sm:py-14 border-b border-[#092218]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-7 sm:mb-9">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A65B]">
              SHOP BY CATEGORY
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Select Your Grade &amp; Pack
            </h2>
          </div>

          {/*
            2-col × 3-row on mobile/sm, 3-col × 2-row on md, 6-col on lg+
            All six cards share the same CategoryCard component — same styles,
            same image proportions, same rounded corners as the existing five.
          */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1 — Premium Makhana */}
            <CategoryCard
              imageSrc="/images/products/premium-makhana-250g.png"
              title="Premium Makhana"
              subtitle="Jumbo 6-suta grade"
              href="/categories?type=Premium"
            />
            {/* Card 2 — Normal Makhana */}
            <CategoryCard
              imageSrc="/images/products/normal-makhana-250g.png"
              title="Normal Makhana"
              subtitle="Everyday snack"
              href="/categories?type=Normal"
            />
            {/* Card 3 — 100g Pouches */}
            <CategoryCard
              imageSrc="/images/products/premium-makhana-100g.png"
              title="100g Pouches"
              subtitle="Desk &amp; travel pack"
              href="/products/makhana?sku=premium-100g"
            />
            {/* Card 4 — 200g Pouches */}
            <CategoryCard
              imageSrc="/images/products/premium-makhana-200g.png"
              title="200g Pouches"
              subtitle="Family pantry pack"
              href="/products/makhana?sku=premium-200g"
            />
            {/* Card 5 — 250g Pouches */}
            <CategoryCard
              imageSrc="/images/products/premium-makhana-250g.png"
              title="250g Pouches"
              subtitle="Best-value bulk pack"
              href="/products/makhana?sku=premium-250g"
            />
            {/* Card 6 — Why NYUTA ELITE? (informational, no invented product) */}
            <CategoryCard
              imageSrc="/images/process/01-harvest-pond.webp"
              title="Why NYUTA ELITE?"
              subtitle="Hand-sorted Bihar origin"
              href="#quality"
              fit="cover"
            />
          </div>
        </div>
      </section>

      {/* 2. THE PANTRY COLLECTION CATALOG */}
      <section id="pantry" className="py-12 sm:py-16 md:py-20 bg-[#879778] border-b border-[#617653]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F4F1DE]">
                THE PANTRY COLLECTION
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-1">
                GOOD THINGS FOR YOUR PANTRY
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#F4F1DE]/90">
                Choose the makhana that fits your everyday snacking.
              </p>
            </div>

            {/* Quality Summary Tag & Carousel Navigation */}
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
              <div className="inline-flex items-center gap-2 bg-[#617653] border border-[#617653] px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#F4F1DE]">
                <ShieldCheck className="w-4 h-4 text-[#C9A65B]" /> Exactly 6 Verified Packs (100g, 200g, 250g)
              </div>

              {/* Navigation Scroll Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  disabled={!canScrollLeft}
                  aria-label="Scroll left to view previous products"
                  className="w-8 h-8 rounded-xl border border-[#D8D9C2] bg-[#F4F1DE] text-[#183B2D] flex items-center justify-center hover:bg-white active:scale-95 transition-all shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A65B]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  disabled={!canScrollRight}
                  aria-label="Scroll right to view more products"
                  className="w-8 h-8 rounded-xl border border-[#D8D9C2] bg-[#F4F1DE] text-[#183B2D] flex items-center justify-center hover:bg-white active:scale-95 transition-all shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A65B]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* INSTANT FILTER BAR */}
          <div className="bg-[#617653] p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm mb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#F4F1DE] mr-1 sm:mr-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C9A65B]" /> Filter Packs:
              </div>

              {/* Quality Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Premium', 'Normal'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setQualityFilter(quality)}
                    className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      qualityFilter === quality
                        ? 'bg-[#123D2D] text-white shadow-xs'
                        : 'bg-[#F4F1DE] text-[#183B2D] hover:bg-white'
                    }`}
                  >
                    {quality === 'All' ? 'All Qualities' : quality === 'Normal' ? 'Regular' : quality}
                  </button>
                ))}
              </div>

              {/* Vertical divider */}
              <div className="hidden lg:block h-6 w-px bg-white/20 mx-1" />

              {/* Weight Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {([0, 100, 200, 250] as const).map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setWeightFilter(weight)}
                    className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      weightFilter === weight
                        ? 'bg-[#123D2D] text-white shadow-xs'
                        : 'bg-[#F4F1DE] text-[#183B2D] hover:bg-white'
                    }`}
                  >
                    {weight === 0 ? 'All Weights' : `${weight}g`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="hidden lg:block h-6 w-px bg-white/20 mr-2" />
              <label htmlFor="sort-by" className="text-xs sm:text-sm font-bold text-white">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#F4F1DE] text-[#183B2D] text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A65B] cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {/* INNER PRODUCT GRID CONTAINER */}
          <div className="bg-[#617653] p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
            {loading ? (
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-[185px] sm:w-[210px] lg:w-auto shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 bg-[#F1F0D9] border border-red-200 rounded-2xl text-center space-y-3 max-w-md mx-auto shadow-xs">
                <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
                <h3 className="font-bold text-[#183B2D] text-base">Unable to Load Products</h3>
                <p className="text-xs text-[#617653]">{error}</p>
                <button
                  type="button"
                  onClick={loadCatalog}
                  className="inline-flex items-center gap-1.5 bg-[#123D2D] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0a231a] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 bg-[#F1F0D9] border border-[#D8D9C2] rounded-2xl text-center space-y-3 shadow-xs">
                <Package className="w-10 h-10 text-[#617653]/40 mx-auto" />
                <h3 className="font-bold text-[#183B2D] text-base">No Matching Packs Found</h3>
                <p className="text-xs text-[#617653]">Try changing your quality or weight filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQualityFilter('All');
                    setWeightFilter(0);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#123D2D] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0a231a] transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div
                ref={carouselRef}
                onScroll={checkScrollState}
                className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#879778] scrollbar-track-transparent lg:grid lg:grid-cols-6 lg:gap-2.5 xl:gap-3 lg:overflow-visible lg:pb-0"
              >
                {filteredProducts.map((product) => (
                  <div key={product.id} className="w-[185px] sm:w-[210px] lg:w-auto shrink-0 snap-start flex flex-col h-full">
                    <ProductCard
                      product={product}
                      onAdded={setToastMsg}
                      listId="home_pantry_collection"
                      listName="Home Pantry Collection"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FLAVOURED MAKHANA SECTION (Directly below Regular Makhana) */}
          <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-[#617653]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F4F1DE]">
                  EXPLORE FLAVOURS
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-1">
                  Explore Flavoured Makhana
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#F4F1DE]/90">
                  Discover exciting flavours for your everyday snacking.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#617653] border border-[#617653] px-4 py-2 rounded-xl text-xs font-bold text-[#F4F1DE] shrink-0 self-start md:self-auto">
                <Sparkles className="w-4 h-4 text-[#C9A65B]" /> 6 Handcrafted Flavours
              </div>
            </div>

            <FlavouredMakhanaGrid products={products} onAdded={setToastMsg} />
          </div>
        </div>
      </section>

      {/* 3. PREMIUM VS NORMAL COMPARISON SECTION */}
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
                <p className="mt-2 text-xs sm:text-sm font-medium text-[#68756E] leading-relaxed">
                  Handpicked jumbo-grade fox nuts selected for consistent large size, round shape, and crisp expansion with minimal hard shell residue.
                </p>

                <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[#F7F1E5] border border-[#E8DECB]">
                  <img
                    src="/images/quality/premium-jumbo-makhana.webp"
                    alt="NYUTA ELITE Premium Makhana jumbo hand-sorted fox nuts"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={338}
                  />
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#1C1C1C]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span>
                      <strong>Jumbo Size:</strong> Uniformly sized large pop density
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span>
                      <strong>Clean Surface:</strong> Minimal hard shell pieces or black residue
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#123B2A] shrink-0" />
                    <span>
                      <strong>Purity:</strong> Ideal for dry roasting, gifting, or direct bowl serving
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8DECB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#68756E]">Packs starting at</span>
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
                <p className="mt-2 text-xs sm:text-sm font-medium text-[#68756E] leading-relaxed">
                  Standard everyday grade makhana. Slightly varied nut sizes with the exact same natural taste, crunch, and wholesome nutrients.
                </p>

                <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[#F7F1E5] border border-[#E8DECB]">
                  <img
                    src="/images/quality/normal-everyday-makhana.webp"
                    alt="NYUTA ELITE Normal Makhana everyday natural fox nuts"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={338}
                  />
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#1C1C1C]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span>
                      <strong>Everyday Size:</strong> Standard medium pop size mix
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span>
                      <strong>Culinary Use:</strong> Excellent for cooking kheer, curries, or spiced roasts
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#C6A15B] shrink-0" />
                    <span>
                      <strong>Pantry Value:</strong> Economical option for daily household snacking
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8DECB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#68756E]">Packs starting at</span>
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

      {/* 4. INGREDIENT TRANSPARENCY SECTION */}
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
                <img
                  src={macroImage}
                  alt="NYUTA ELITE Makhana macro texture showing crisp air-popped structure"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={500}
                />
              </div>
              <div className="overflow-hidden rounded-2xl bg-[#F7F1E5] aspect-[4/5] mt-6 border border-[#E8DECB]">
                <img
                  src={featuredImage}
                  alt="Pantry bowl of roasted NYUTA ELITE fox nuts"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={500}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FROM SOURCE TO PANTRY TIMELINE */}
      <section className="bg-[#092218] text-white py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 md:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
              OUR PROCESS
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-white mt-1">
              FROM SOURCE TO PANTRY
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-[#D5DED6]">
              Four deliberate steps ensuring uncompromising quality from Mithila ponds to your home.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {sourceTimeline.map((item) => (
              <div
                key={item.step}
                className="bg-[#123B2A] p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-[#C6A15B]/20 flex flex-col justify-between group hover:border-[#C6A15B] transition-colors min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3 md:mb-4">
                    <span className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold text-[#C6A15B]">{item.step}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#D5DED6]">{item.title}</span>
                  </div>
                  <div className="aspect-[4/3] overflow-hidden rounded-lg sm:rounded-xl bg-[#092218] mb-2.5 sm:mb-3 md:mb-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={300}
                    />
                  </div>
                  <p className="text-[11px] sm:text-xs font-medium text-[#D5DED6] leading-snug sm:leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. LIFESTYLE SECTION */}
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
              <div
                key={moment.name}
                className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#123B2A] border border-[#E8DECB]"
              >
                <img
                  src={moment.image}
                  alt={`${moment.name} makhana moment`}
                  className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${moment.position}`}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={500}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#092218]/90 via-[#092218]/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                    {moment.tagline}
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-0.5">{moment.name}</h3>
                  <p className="mt-2 text-xs font-medium text-[#D5DED6] line-clamp-2 leading-relaxed">{moment.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHY MAKHANA EDUCATIONAL SECTION */}
      <section id="why-makhana" className="bg-[#F7F1E5] py-16 sm:py-24 border-b border-[#E8DECB]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5 aspect-[4/3] overflow-hidden rounded-3xl bg-white border border-[#E8DECB] shadow-sm">
              <img
                src="/images/why-makhana/superfood-roasted-bowl.webp"
                alt="Artisanal clay bowl of roasted superfood makhana"
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
                width={600}
                height={450}
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
                THE ANCIENT SUPERFOOD
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">
                WHY MAKE MAKHANA YOUR DAILY SNACK?
              </h2>
              <p className="text-sm font-medium text-[#68756E] leading-relaxed">
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

      {/* 8. CUSTOMER REVIEWS SECTION */}
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
              <div
                key={review.id}
                className="bg-[#FCFAF5] p-6 rounded-2xl border border-[#E8DECB] shadow-xs flex flex-col justify-between"
              >
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
                    <p className="text-[10px] font-medium text-[#68756E]">
                      {review.location} • {review.role}
                    </p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#123B2A]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION (ACCORDION) */}
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
                    <ChevronDown
                      className={`w-5 h-5 text-[#C6A15B] shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm font-medium text-[#68756E] leading-relaxed border-t border-[#E8DECB]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL BANNER CTA */}
      <section className="relative bg-[#123B2A] text-white py-20 sm:py-28 overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: `url('/images/why-makhana/superfood-roasted-bowl.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative mx-auto max-w-3xl px-5 text-center space-y-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
            NYUTA ELITE MAKHANA
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-bold text-white leading-tight">
            MAKE MAKHANA PART OF YOUR PANTRY
          </h2>
          <p className="text-base sm:text-lg font-medium text-[#D5DED6]">
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
