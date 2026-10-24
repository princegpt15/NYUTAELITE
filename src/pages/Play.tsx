import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play as PlayIcon,
  Pause,
  Volume2,
  VolumeX,
  X,
  Share2,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react';
// High-resolution contextual images from /images catalog
import { cartService } from '../services/cart';
import { Toast } from '../components/Toast';

interface PlayItem {
  id: string;
  title: string;
  category: 'Nutrition' | 'Sourcing' | 'Roasting' | 'Comparison' | 'Pairings';
  duration: string;
  image: string;
  headline: string;
  description: string;
  keyTakeaways: string[];
  productSku: string;
  productName: string;
  productPrice: number;
}

const PLAY_STORIES: PlayItem[] = [
  {
    id: 'why-makhana-nutrition',
    title: 'Why Makhana? The Ancient Indian Superfood',
    category: 'Nutrition',
    duration: '0:45',
    image: '/images/why-makhana/superfood-roasted-bowl.webp',
    headline: 'High plant protein, zero cholesterol, low glycemic index.',
    description:
      'Makhana (Euryale ferox) is harvested from freshwater lotus seeds and puffed into airy crunch. Packed with magnesium, potassium, and antioxidants, it provides steady energy without sugar spikes.',
    keyTakeaways: [
      'Low glycemic index prevents sudden sugar crashes',
      'Rich in calcium and magnesium for bone health',
      'Naturally gluten-free and easily digestible',
    ],
    productSku: 'premium-250g',
    productName: 'NYUTA Elite Premium Makhana 250g',
    productPrice: 380,
  },
  {
    id: 'bihar-mithila-sourcing',
    title: 'From Mithila Ponds to Your Table',
    category: 'Sourcing',
    duration: '1:10',
    image: '/images/process/01-harvest-pond.webp',
    headline: 'Hand-harvested by generational farmers in Bihar.',
    description:
      'Over 85% of the world’s premium makhana originates in the wetlands of Mithila, Bihar. Our farmers wade into calm freshwater ponds at dawn to collect thorny lotus seed pods with centuries-old care.',
    keyTakeaways: [
      'Direct partnerships with indigenous farming communities',
      'Sustainably cultivated in natural freshwater wetlands',
      'Minimal post-harvest processing for maximum freshness',
    ],
    productSku: 'premium-200g',
    productName: 'NYUTA Elite Premium Makhana 200g',
    productPrice: 310,
  },
  {
    id: 'roasting-crunch-art',
    title: 'The Art of Natural Air-Popping',
    category: 'Roasting',
    duration: '0:38',
    image: '/images/process/02-hand-sorting.webp',
    headline: 'Popped with high heat, never deep-fried in palm oil.',
    description:
      'Traditional roasting involves carefully drying raw seeds under the sun, heating them in cast-iron pans, and striking them to release the pure white puffed core. Zero artificial puffing agents or preservatives.',
    keyTakeaways: [
      '100% air-popped using artisanal heat techniques',
      'Retains natural crispness and subtle nutty aroma',
      'No palm oil, no chemical preservatives',
    ],
    productSku: 'normal-200g',
    productName: 'NYUTA Elite Normal Makhana 200g',
    productPrice: 230,
  },
  {
    id: 'premium-vs-normal-grading',
    title: 'Premium vs Normal: The Grading Standard',
    category: 'Comparison',
    duration: '0:50',
    image: '/images/quality/premium-jumbo-makhana.webp',
    headline: 'How we sort by diameter, density, and shell residue.',
    description:
      'Premium makhana represents the top tier of the harvest: jumbo spherical kernels exceeding 6-suta diameter, hand-cleaned to minimize shell fragments. Normal makhana offers standard size, perfect for curries, kheer, and daily roasting.',
    keyTakeaways: [
      'Premium: Jumbo diameter, maximum crunch, uniform aesthetics',
      'Normal: Versatile standard size for home recipes and cooking',
      'Both grades share identical 100% natural pure fox nut nutrition',
    ],
    productSku: 'premium-100g',
    productName: 'NYUTA Elite Premium Makhana 100g',
    productPrice: 160,
  },
  {
    id: 'mindful-desk-snacking',
    title: '3-Minute Ghee & Rock Salt Roasting Secret',
    category: 'Pairings',
    duration: '0:42',
    image: '/images/bulk/wholesale-roasted-spiced.webp',
    headline: 'Transform plain makhana into your favorite evening crunch.',
    description:
      'Warm half a teaspoon of pure A2 desi cow ghee in a heavy pan. Add a pinch of pink Himalayan rock salt, freshly crushed black pepper, and toss NYUTA makhana on low flame for 3 minutes until shatteringly crisp.',
    keyTakeaways: [
      'Cook on gentle low heat to avoid scorching the puffs',
      'Add spices at the very end so they coat without burning',
      'Store in an airtight jar once cooled for long-lasting crispness',
    ],
    productSku: 'normal-250g',
    productName: 'NYUTA Elite Normal Makhana 250g',
    productPrice: 280,
  },
  {
    id: 'clean-workday-focus',
    title: 'Mindful Snacking for Focused Workdays',
    category: 'Nutrition',
    duration: '0:35',
    image: '/images/lifestyle/work-break-snack.webp',
    headline: 'Ditch ultra-processed chips for clean energy.',
    description:
      'Afternoon slumps are often caused by blood sugar spikes from greasy snacks. Makhana provides slow-burning complex nourishment and crunch satisfaction without calorie bloat or sluggishness.',
    keyTakeaways: [
      'Zero refined sugar and negligible sodium when unseasoned',
      'High satiety from plant fiber and protein',
      'Light on the stomach during demanding work hours',
    ],
    productSku: 'premium-250g',
    productName: 'NYUTA Elite Premium Makhana 250g',
    productPrice: 380,
  },
];

export const Play: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const categories = ['All', 'Nutrition', 'Sourcing', 'Roasting', 'Comparison', 'Pairings'];

  const filteredStories = selectedCategory === 'All'
    ? PLAY_STORIES
    : PLAY_STORIES.filter((s) => s.category === selectedCategory);

  // Reel progress animation simulation
  useEffect(() => {
    if (activeStoryIndex === null || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Auto advance to next story or loop
          const nextIdx = (activeStoryIndex + 1) % PLAY_STORIES.length;
          setActiveStoryIndex(nextIdx);
          return 0;
        }
        return prev + 1.5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPlaying]);

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeStoryIndex === null) return;
      if (e.key === 'Escape') {
        setActiveStoryIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveStoryIndex((prev) => (prev! + 1) % PLAY_STORIES.length);
        setProgress(0);
      } else if (e.key === 'ArrowLeft') {
        setActiveStoryIndex((prev) => (prev! - 1 + PLAY_STORIES.length) % PLAY_STORIES.length);
        setProgress(0);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIndex]);

  const activeStory = activeStoryIndex !== null ? PLAY_STORIES[activeStoryIndex] : null;

  const handleQuickAdd = (story: PlayItem) => {
    cartService.addItem({
      productId: story.productSku,
      productName: story.productName,
      quality: story.productSku.includes('premium') ? 'Premium' : 'Normal',
      weightGrams: Number(story.productSku.replace(/[^0-9]/g, '')) as any,
      price: story.productPrice,
      mrp: story.productPrice + 60,
      quantity: 1,
      image: story.image,
    });
    setToastMsg(`Added 1 × ${story.productName} to your cart!`);
  };

  const handleShare = (story: PlayItem) => {
    const url = `${window.location.origin}/play?story=${story.id}`;
    navigator.clipboard.writeText(url);
    setToastMsg('Link copied to clipboard!');
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-8 lg:py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-br from-[#123B2A] to-[#092218] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-[#C6A15B]/30">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFAF5]/10 backdrop-blur-md border border-[#C6A15B]/40 text-[#C6A15B] text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NYUTA PLAY • SNACK STORIES</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#FCFAF5] leading-tight">
              Short-Form Stories &amp; Snack Wisdom
            </h1>
            <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed">
              Explore the heritage of Bihar’s freshwater ponds, the art of air-popping, and smart nutrition tips for mindful everyday snacking.
            </p>
          </div>

          {/* Botanical background decoration */}
          <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#C6A15B]/10 blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-25 hidden md:block">
            <img src="/images/quality/premium-jumbo-makhana.webp" alt="Purity popped makhana" className="w-52 h-52 object-cover rounded-full border-2 border-[#C6A15B]/40" />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border min-h-[38px] ${
                selectedCategory === cat
                  ? 'bg-[#123B2A] text-white border-[#123B2A] shadow-xs'
                  : 'bg-white text-[#68756E] border-[#E8DECB] hover:border-[#123B2A] hover:text-[#123B2A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Reels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const originalIndex = PLAY_STORIES.findIndex((s) => s.id === story.id);
            return (
              <article
                key={story.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#E8DECB] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#123B2A] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-16/10 overflow-hidden bg-[#092218]">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Play Button Overlay */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStoryIndex(originalIndex);
                      setProgress(0);
                      setIsPlaying(true);
                    }}
                    aria-label={`Watch story: ${story.title}`}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#FCFAF5]/90 text-[#123B2A] backdrop-blur-md flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-[#C6A15B] group-hover:text-[#092218] transition-all cursor-pointer"
                  >
                    <PlayIcon className="w-6 h-6 ml-0.5" />
                  </button>

                  {/* Duration Tag */}
                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded font-bold">
                    {story.duration}
                  </span>

                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 bg-[#123B2A]/90 backdrop-blur-xs text-[#C6A15B] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-[#C6A15B]/30">
                    {story.category}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="font-serif text-xl font-bold text-[#1C1C1C] group-hover:text-[#123B2A] transition-colors leading-snug">
                      {story.title}
                    </h2>
                    <p className="text-xs text-[#68756E] line-clamp-2 leading-relaxed">
                      {story.headline}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-[#E8DECB] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStoryIndex(originalIndex);
                        setProgress(0);
                        setIsPlaying(true);
                      }}
                      className="text-xs font-black uppercase tracking-wider text-[#123B2A] hover:text-[#C6A15B] flex items-center gap-1 cursor-pointer"
                    >
                      <span>WATCH REEL</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(story)}
                      aria-label={`Add ${story.productName} to cart`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F1E5] hover:bg-[#123B2A] text-[#123B2A] hover:text-white transition-colors text-xs font-bold cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C6A15B]" />
                      <span>₹{story.productPrice}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Brand Education Callout */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
              MINDFUL DAILY RITUAL
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#092218]">
              Ready to taste authentic Bihar harvest?
            </h3>
            <p className="text-xs sm:text-sm text-[#68756E] leading-relaxed">
              Every pack of NYUTA Elite is prepared with care — hand-sorted, air-popped, and vacuum-sealed for superior crunch and purity.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/categories"
              className="px-6 py-3.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
            >
              BROWSE ALL MAKHANA
            </Link>
          </div>
        </section>
      </div>

      {/* REEL PLAYER MODAL */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={activeStory.title}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActiveStoryIndex(null)}
            aria-label="Close Story"
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-[#092218] rounded-3xl overflow-hidden shadow-2xl border border-[#C6A15B]/40 flex flex-col max-h-[92vh]">
            {/* Story Progress Bar */}
            <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/80 to-transparent">
              <div className="w-full bg-white/25 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#C6A15B] h-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between mt-2.5 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#123B2A] px-2 py-0.5 rounded text-[#C6A15B] border border-[#C6A15B]/40">
                    {activeStory.category}
                  </span>
                  <span className="text-xs font-bold truncate max-w-[200px]">
                    {activeStory.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                    aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Video Canvas Simulation */}
            <div className="relative aspect-9/12 w-full bg-black overflow-hidden flex items-center justify-center">
              <img
                src={activeStory.image}
                alt={activeStory.title}
                className="w-full h-full object-cover opacity-90 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#092218] via-transparent to-black/40" />

              {/* Central Play/Pause indicator */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-16 h-16 rounded-full bg-[#FCFAF5]/90 text-[#123B2A] flex items-center justify-center shadow-2xl">
                    <PlayIcon className="w-8 h-8 ml-1" />
                  </div>
                </div>
              )}

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={() => {
                  setActiveStoryIndex((prev) => (prev! - 1 + PLAY_STORIES.length) % PLAY_STORIES.length);
                  setProgress(0);
                }}
                aria-label="Previous story"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStoryIndex((prev) => (prev! + 1) % PLAY_STORIES.length);
                  setProgress(0);
                }}
                aria-label="Next story"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Reel Information & Interactive CTA */}
            <div className="p-5 sm:p-6 bg-[#092218] text-white space-y-4 border-t border-[#C6A15B]/30 overflow-y-auto">
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FCFAF5]">
                  {activeStory.title}
                </h3>
                <p className="text-xs text-[#D5DED6] leading-relaxed">
                  {activeStory.description}
                </p>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/10 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                  KEY TAKEAWAYS
                </span>
                {activeStory.keyTakeaways.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-[#E8DECB]">
                    <Check className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Direct Product Quick Action */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="flex-1 bg-white/10 p-2.5 rounded-xl border border-white/15 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#C6A15B] font-bold block">
                      FEATURED MAKHANA
                    </span>
                    <span className="text-xs font-bold truncate block max-w-[150px] sm:max-w-[200px]">
                      {activeStory.productName}
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#FCFAF5]">
                    ₹{activeStory.productPrice}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAdd(activeStory)}
                  className="px-4 py-3 rounded-xl bg-[#C6A15B] hover:bg-[#D8B168] text-[#092218] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO CART</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(activeStory)}
                  aria-label="Share this story"
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast feedback */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
};
