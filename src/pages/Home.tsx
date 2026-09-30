import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Leaf, ShieldCheck, ShoppingBasket, Star, Truck } from 'lucide-react';
import heroImage from '../assets/images/dry-fruits-hero.png';
import makhanaImage from '../assets/images/product-main.png';
import almondsImage from '../assets/images/thumb-1.png';
import cashewsImage from '../assets/images/thumb-2.png';
import pistachiosImage from '../assets/images/thumb-3.png';

const categories = [
  { name: 'Makhana', note: 'Light, crunchy, wholesome', image: makhanaImage },
  { name: 'Almonds', note: 'Daily goodness, naturally', image: almondsImage },
  { name: 'Cashews', note: 'Creamy and satisfying', image: cashewsImage },
  { name: 'Pistachios', note: 'Naturally vibrant', image: pistachiosImage },
];

const reasons = [
  { icon: <Leaf className="h-5 w-5" />, title: 'Naturally good', text: 'Thoughtfully sourced ingredients with no unnecessary fuss.' },
  { icon: <ShieldCheck className="h-5 w-5" />, title: 'Quality checked', text: 'Clean, fresh and carefully packed for your pantry.' },
  { icon: <Truck className="h-5 w-5" />, title: 'Pan-India delivery', text: 'Reliable doorstep delivery, wherever your snack break happens.' },
];

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFCF6] text-[#1C2520]">
      <section className="relative min-h-[620px] overflow-hidden border-b border-[#E8DFC8]">
        <img
          src={heroImage}
          alt="Makhana, almonds, cashews, pistachios, raisins and walnuts arranged on a serving platter"
          className="absolute inset-0 h-full w-full object-cover object-[65%_center]"
        />
        <div className="absolute inset-0 bg-white/35" />
        <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#58703A]">Wholesome snacking, simply</p>
            <h1 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Better snacking starts with ingredients you can see.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#425149] sm:text-lg">
              Premium makhana and dry fruits selected for fresh flavour, everyday nourishment, and your favourite little rituals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products/premium-makhana" className="inline-flex items-center gap-2 rounded-lg bg-[#1F4A3D] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#15372D]">
                Shop Makhana <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/#collections" className="inline-flex items-center gap-2 rounded-lg border border-[#1F4A3D] bg-white/80 px-6 py-3.5 text-sm font-bold text-[#1F4A3D] transition-colors hover:bg-white">
                Browse collections
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#36453D] sm:text-sm">
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 fill-[#D29D37] text-[#D29D37]" /> Freshly packed</span>
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 fill-[#C15B42] text-[#C15B42]" /> Made for everyday joy</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E8DFC8] bg-[#F3E8CF] py-4">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-3 px-4 text-center text-xs font-bold text-[#425149] sm:grid-cols-3 sm:px-6 sm:text-sm lg:px-8">
          <span>Clean ingredients, clear choices</span><span>Secure checkout with Razorpay</span><span>Freshness sealed for delivery</span>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A86F1A]">Shop by craving</p><h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Good things for your pantry</h2></div>
          <Link to="/products/premium-makhana" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F4A3D] hover:text-[#58703A]">See all products <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {categories.map((category) => (
            <Link key={category.name} to="/products/premium-makhana" className="group overflow-hidden rounded-lg bg-white ring-1 ring-[#E8DFC8] transition-shadow hover:shadow-lg">
              <div className="aspect-square overflow-hidden bg-[#F8F1E3]"><img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="p-4"><h3 className="font-bold text-[#1C2520]">{category.name}</h3><p className="mt-1 text-xs leading-relaxed text-[#68756E]">{category.note}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E8DFC8] bg-[#F7F0E2] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="overflow-hidden rounded-lg bg-white shadow-sm"><img src={makhanaImage} alt="Premium makhana in a bowl" className="aspect-[4/3] h-full w-full object-cover" /></div>
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A86F1A]">The everyday favourite</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Crunchy makhana for every kind of pause.</h2>
            <p className="mt-5 text-base leading-relaxed text-[#536158]">From a mid-morning handful to a movie-night bowl, our premium makhana brings an easy, satisfying crunch to the moments you make for yourself.</p>
            <ul className="mt-7 space-y-3 text-sm font-semibold text-[#425149]">
              <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DCE8CC] text-[#58703A]">1</span> Light, airy and naturally satisfying</li>
              <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DCE8CC] text-[#58703A]">2</span> Sourced from Bihar and carefully graded</li>
              <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DCE8CC] text-[#58703A]">3</span> Packed to keep every bite crisp</li>
            </ul>
            <Link to="/products/premium-makhana" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#1F4A3D] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#15372D]">Explore Makhana <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A86F1A]">Why NYUTAELITE</p><h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">A better kind of pantry staple</h2></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reasons.map((reason) => (<div key={reason.title} className="border-t-2 border-[#D29D37] bg-white px-1 pt-5"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF1DE] text-[#58703A]">{reason.icon}</div><h3 className="text-lg font-bold">{reason.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#68756E]">{reason.text}</p></div>))}
        </div>
      </section>

      <section className="bg-[#1F4A3D] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6"><ShoppingBasket className="mx-auto h-8 w-8 text-[#F2C45F]" /><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Build a pantry you look forward to opening.</h2><p className="mt-4 text-base leading-relaxed text-[#D7E5D8]">Start with fresh makhana today and keep an eye on our expanding dry-fruit collection.</p><Link to="/products/premium-makhana" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#F2C45F] px-6 py-3.5 text-sm font-bold text-[#1F4A3D] transition-colors hover:bg-[#FFE08A]">Start shopping <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </div>
  );
};
