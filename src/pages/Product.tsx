import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  PackageCheck,
  Truck,
  CreditCard,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { QuantitySelector } from '../components/QuantitySelector';
import { PricingTable } from '../components/PricingTable';
import { PRODUCT, getPricePerKg } from '../data/product';
import { cartService } from '../services/cart';

export const Product: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string>(PRODUCT.images.main);
  const [quantity, setQuantity] = useState<number>(25);
  const [activeTab, setActiveTab] = useState<
    'description' | 'specifications' | 'packaging' | 'shipping' | 'quality'
  >('specifications');
  const [addedNotification, setAddedNotification] = useState<boolean>(false);

  const pricePerKg = getPricePerKg(quantity);
  const subtotal = quantity * pricePerKg;

  const handleAddToCart = () => {
    cartService.addItem({
      productId: PRODUCT.id,
      productName: PRODUCT.name,
      quantity,
      image: selectedImage,
      grade: PRODUCT.grade,
    });
    setAddedNotification(true);
    setTimeout(() => {
      setAddedNotification(false);
    }, 2500);
  };

  const handleBuyNow = () => {
    cartService.addItem({
      productId: PRODUCT.id,
      productName: PRODUCT.name,
      quantity,
      image: selectedImage,
      grade: PRODUCT.grade,
    });
    navigate('/cart');
  };

  const benefits = [
    {
      title: 'Secure Payment',
      desc: '100% protected business transactions',
      icon: <CreditCard className="w-5 h-5 text-white" />,
    },
    {
      title: 'Quality Checked',
      desc: 'Dual-phase laboratory testing',
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
    },
    {
      title: 'Bulk Availability',
      desc: 'Immediate stock dispatch',
      icon: <PackageCheck className="w-5 h-5 text-white" />,
    },
    {
      title: 'Reliable Delivery',
      desc: 'Tracked pan-India commercial freight',
      icon: <Truck className="w-5 h-5 text-white" />,
    },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-16 lg:pb-24">
      {/* Toast Notification */}
      {addedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#173F35] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="w-6 h-6 rounded-full bg-[#00C950] flex items-center justify-center text-white shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold">Added to Cart!</p>
            <p className="text-xs text-[#A5BDB5]">
              {quantity} KG added at ₹{pricePerKg}/kg (₹{subtotal.toLocaleString('en-IN')})
            </p>
          </div>
          <Link
            to="/cart"
            className="ml-3 text-xs font-bold text-[#00C950] hover:underline shrink-0"
          >
            View Cart
          </Link>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Products', to: '/products/premium-makhana' },
            { label: 'Premium Makhana' },
          ]}
        />

        {/* MAIN PRODUCT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pt-2 pb-12">
          {/* LEFT COLUMN: Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Image Frame */}
            <div className="w-full aspect-[4/3] sm:aspect-square bg-white rounded-3xl p-4 sm:p-8 border border-[#E6DFD3] flex items-center justify-center shadow-xs overflow-hidden group">
              <img
                src={selectedImage}
                alt={PRODUCT.name}
                className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* 4 Thumbnails */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {PRODUCT.images.thumbnails.map((thumb, index) => {
                const isActive = selectedImage === thumb;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(thumb)}
                    className={`aspect-square rounded-xl sm:rounded-2xl p-2 bg-white border overflow-hidden transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#00C950] ring-2 ring-[#00C950]/30 shadow-xs scale-102'
                        : 'border-[#E6DFD3] hover:border-neutral-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Product view ${index + 1}`}
                      className="w-full h-full object-contain object-center"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Product Details & Buying Interface */}
          <div className="lg:col-span-6 flex flex-col justify-start space-y-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
                {PRODUCT.eyebrow}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C2520] tracking-tight mt-1.5 mb-2.5">
                {PRODUCT.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center text-[#D8A62A]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D8A62A] text-[#D8A62A]" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#1C2520]">
                  {PRODUCT.rating}
                </span>
                <span className="text-xs sm:text-sm text-[#5E6C65]">
                  ({PRODUCT.reviewCount} business reviews)
                </span>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#5E6C65] leading-relaxed">
                {PRODUCT.description}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2.5">
              {PRODUCT.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C950]/10 text-[#173F35] text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C950]" />
                  {badge}
                </span>
              ))}
            </div>

            {/* Dynamic Price Display */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6DFD3] shadow-2xs">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#173F35]">
                      ₹{pricePerKg}
                    </span>
                    <span className="text-sm font-semibold text-[#5E6C65]">/kg</span>
                  </div>
                  <span className="text-xs text-[#5E6C65]">for bulk orders</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#5E6C65] block">Order Subtotal:</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#1C2520]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-[#00C950] block font-medium">
                    (₹{pricePerKg} × {quantity} KG)
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <QuantitySelector
              quantity={quantity}
              onChange={(newQty) => setQuantity(newQty)}
              minOrder={PRODUCT.minOrder}
            />

            {/* Pricing Tiers Table */}
            <PricingTable tiers={PRODUCT.pricingTiers} selectedQuantity={quantity} />

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 rounded-xl bg-[#00C950] hover:bg-[#00b347] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Add To Cart</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded-xl bg-transparent hover:bg-[#00C950]/10 text-[#00C950] border-2 border-[#00C950] font-bold text-sm transition-all cursor-pointer text-center"
                >
                  Buy Now
                </button>
                <Link
                  to="/contact"
                  className="w-full py-3.5 rounded-xl bg-transparent hover:bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C] font-bold text-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <span>Request Bulk Quote</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            PRODUCT INFORMATION TABS & SPECIFICATIONS
            ================================================== */}
        <div className="bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-8 lg:p-10 mb-12 shadow-xs">
          {/* Tabs bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 border-b border-[#E6DFD3] pb-4 mb-6">
            {(
              [
                { id: 'specifications', label: 'Specifications' },
                { id: 'description', label: 'Description' },
                { id: 'packaging', label: 'Packaging' },
                { id: 'shipping', label: 'Shipping' },
                { id: 'quality', label: 'Quality' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#173F35] text-white'
                    : 'text-[#5E6C65] hover:text-[#1C2520] hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Specifications Table View */}
          {activeTab === 'specifications' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div className="flex justify-between py-2 border-b border-[#F0EBE1]">
                  <span className="text-[#5E6C65]">Grade</span>
                  <span className="font-semibold text-[#1C2520]">Grade A Premium (5+ Soot)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EBE1]">
                  <span className="text-[#5E6C65]">Weight</span>
                  <span className="font-semibold text-[#1C2520]">10 KG / 25 KG / 50 KG / 100 KG bulk packs</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EBE1]">
                  <span className="text-[#5E6C65]">Shelf Life</span>
                  <span className="font-semibold text-[#1C2520]">9 months from packaging date</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EBE1]">
                  <span className="text-[#5E6C65]">Packaging</span>
                  <span className="font-semibold text-[#1C2520]">Food-grade vacuum-sealed bulk bags</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EBE1]">
                  <span className="text-[#5E6C65]">Origin</span>
                  <span className="font-semibold text-[#1C2520]">Bihar, India</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EBE1]">
                  <span className="text-[#5E6C65]">Moisture Content</span>
                  <span className="font-semibold text-[#1C2520]">&lt; 10% (Maximum Crispness)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-3 text-sm text-[#5E6C65] leading-relaxed max-w-3xl">
              <p>
                Our Grade A Fox Nuts (Makhana) are procured straight from wetland growers in Darbhanga and Madhubani, Bihar. The seeds are roasted in earthen ovens, air-popped, and mechanically sieved to ensure uniform spherical dimensions.
              </p>
              <p>
                Ideal for commercial roasting, seasoning, chocolate coating, grinding into makhana flour, or direct premium retail distribution.
              </p>
            </div>
          )}

          {activeTab === 'packaging' && (
            <div className="space-y-3 text-sm text-[#5E6C65] leading-relaxed max-w-3xl">
              <p>
                Packaged in food-grade, multi-layer poly vacuum packs (10 KG or 25 KG units) enclosed within heavy-duty 7-ply corrugated cartons. This eliminates transit pulverization and keeps moisture below 10% for extended shelf freshness.
              </p>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-3 text-sm text-[#5E6C65] leading-relaxed max-w-3xl">
              <p>
                Consignments dispatch within 24 hours of payment verification. We partner with blue-chip logistics providers (VRL, Safexpress, Delhivery Freight) providing real-time tracking numbers and commercial delivery directly to your facility.
              </p>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-3 text-sm text-[#5E6C65] leading-relaxed max-w-3xl">
              <p>
                Each batch is lab-certified for pesticide residues, heavy metals, aflatoxins, and microbial safety in NABL-accredited facilities. Complete Certificate of Analysis (COA) is provided with each commercial shipment.
              </p>
            </div>
          )}
        </div>

        {/* ==================================================
            PRODUCT BENEFITS (4 CIRCULAR GREEN ICONS)
            ================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl p-5 border border-[#E6DFD3] flex flex-col items-center text-center shadow-2xs"
            >
              <div className="w-12 h-12 rounded-full bg-[#00C950] flex items-center justify-center mb-3 shadow-xs">
                {b.icon}
              </div>
              <h4 className="text-sm font-bold text-[#1C2520]">{b.title}</h4>
              <p className="text-xs text-[#5E6C65] mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* ==================================================
            NEED A LARGER QUANTITY? CTA CARD
            ================================================== */}
        <div className="bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1C2520]">
              Need a larger quantity?
            </h3>
            <p className="text-sm text-[#5E6C65]">
              Contact our sales team for custom bulk requirements, container loads, and scheduled contracts.
            </p>
          </div>
          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#00C950] hover:bg-[#00b347] text-white font-semibold text-sm transition-all shadow-sm shrink-0"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
};
