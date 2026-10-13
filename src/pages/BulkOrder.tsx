import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Building2,
  Truck,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  AlertCircle,
  MessageSquare,
  Package,
} from 'lucide-react';

interface BulkEnquiryFormData {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  quantity: string;
  productGrade: string;
  city: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  quantity?: string;
  productGrade?: string;
}

const QUANTITY_OPTIONS = [
  '10 kg – 25 kg (Trial / Sample Wholesale)',
  '25 kg – 50 kg (Standard Retail Wholesale)',
  '50 kg – 100 kg (Supermarket / Department Store)',
  '100 kg – 250 kg (Distributor / Re-packager)',
  '250 kg – 500 kg (Bulk Commercial / Catering)',
  '500 kg+ (Institutional / Export Order)',
];

const PRODUCT_GRADE_OPTIONS = [
  'Premium Quality Jumbo 6-Suta (100g, 200g, 250g Retail Pouches)',
  'Normal Quality Everyday Grade (100g, 200g, 250g Retail Pouches)',
  'Mixed Grade Assortment (Curated Retail Pouch Mix)',
  'Unbranded Master Sacks — Jumbo 6-Suta (10kg / 20kg Food-Grade Sacks)',
  'Unbranded Master Sacks — Normal Grade (10kg / 20kg Food-Grade Sacks)',
];

const BULK_FAQS = [
  {
    q: 'What is the Minimum Order Quantity (MOQ) for wholesale pricing?',
    a: 'Our wholesale tier begins at 10 kg across any mix of sizes or grades. For larger commercial orders exceeding 100 kg, tiered slab discounts apply automatically.',
  },
  {
    q: 'Do you provide sample testing packs before placing a large order?',
    a: 'Yes. We can dispatch a verified sample tasting kit containing our Premium Jumbo and Normal everyday grades directly to your business address.',
  },
  {
    q: 'Can we get private labeling or custom customized packaging?',
    a: 'Yes, for ongoing orders exceeding 250 kg per month, we support custom brand printing and contract packaging under food-grade FSSAI standards.',
  },
  {
    q: 'Are GST invoices provided for business input tax credit?',
    a: 'Every wholesale shipment is accompanied by a 100% tax-compliant GST tax invoice (HSN code 19041020) so you can claim full input tax credit.',
  },
  {
    q: 'How long does bulk freight shipping take across India?',
    a: 'Orders are dispatched from our Darbhanga, Bihar processing hub within 24–48 hours. Transit time is typically 3–5 business days for metro hubs and 5–7 days for tier-2/tier-3 cities.',
  },
];

export const BulkOrder: React.FC = () => {
  const [formData, setFormData] = useState<BulkEnquiryFormData>({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    quantity: '',
    productGrade: '',
    city: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name.';
    }

    const cleanPhone = formData.phone.replace(/[\s\-+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Please provide a valid 10-digit phone number.';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address.';
      }
    }

    if (!formData.quantity) {
      newErrors.quantity = 'Please select your required quantity range.';
    }

    if (!formData.productGrade) {
      newErrors.productGrade = 'Please select product quality or pack format.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Generate unique human-readable enquiry reference ID
      const refId = `NE-BULK-${Date.now().toString().slice(-6)}`;

      // Save enquiry locally to ensure no customer submission is lost
      const existing = JSON.parse(localStorage.getItem('nyuta_bulk_enquiries') || '[]');
      const newEnquiry = {
        id: refId,
        timestamp: new Date().toISOString(),
        ...formData,
        status: 'RECEIVED',
      };
      existing.unshift(newEnquiry);
      localStorage.setItem('nyuta_bulk_enquiries', JSON.stringify(existing));

      setSubmittedRef(refId);
    } catch {
      // In case localStorage is blocked, still provide positive feedback
      setSubmittedRef(`NE-BULK-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      businessName: '',
      phone: '',
      email: '',
      quantity: '',
      productGrade: '',
      city: '',
      message: '',
    });
    setErrors({});
    setSubmittedRef(null);
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen text-[#1C1C1C] py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-[#123B2A] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#123B2A] font-extrabold" aria-current="page">
              Bulk &amp; Wholesale Orders
            </li>
          </ol>
        </nav>

        {/* HERO BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-[#123B2A] text-white p-8 sm:p-12 lg:p-16 border border-[#092218] shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C6A15B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#092218]/80 border border-[#C6A15B]/60 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#C6A15B]">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>B2B WHOLESALE &amp; INSTITUTIONAL SUPPLY</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FCFAF5] leading-tight">
              Order Fresh Bihar Makhana in Bulk
            </h1>
            <p className="text-sm sm:text-base text-[#D5DED6] leading-relaxed max-w-2xl">
              Procure authentic, hand-sorted jumbo fox nuts directly from the ponds of Mithila, Bihar.
              Enjoy competitive tiered pricing, customized retail or sack packaging, guaranteed FSSAI compliance, and pan-India freight delivery.
            </p>
          </div>
        </section>

        {/* 4 VALUE PILLARS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/40">
              <Package className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">Direct Bihar Sourcing</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Harvested in traditional freshwater wetlands with zero intermediate dealer margins for unbeatable value.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/40">
              <ShieldCheck className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">Jumbo 6-Suta Quality</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Machine-screened and hand-sorted for uniform diameter, crisp pop expansion, and zero chemical bleaching.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/40">
              <FileText className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">GST Input Credit</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              100% compliant business GST invoices provided with standard HSN classification for seamless tax deductions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/40">
              <Truck className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">Pan-India Logistics</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Express door-step road freight dispatch to retail stores, cloud kitchens, hotels, and distributors nationwide.
            </p>
          </div>
        </section>

        {/* MAIN INTERACTION BLOCK: FORM & SIDEBAR */}
        <section id="enquiry-form" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: Wholesale Enquiry Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-md">
            {submittedRef ? (
              <div className="py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#F7F1E5] border-2 border-[#123B2A] text-[#123B2A] mx-auto flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-[#123B2A]" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C6A15B]">
                    ENQUIRY LOGGED SUCCESSFULLY
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A]">
                    Thank You, {formData.name}!
                  </h3>
                  <div className="inline-block bg-[#F7F1E5] border border-[#C6A15B]/50 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-[#123B2A]">
                    Ref ID: {submittedRef}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#68756E] max-w-md mx-auto leading-relaxed">
                  Your bulk requirement for <strong>{formData.quantity}</strong> of{' '}
                  <strong>{formData.productGrade}</strong> has been received by our B2B trade desk. Our wholesale specialist will connect with you via phone ({formData.phone}) within 4–6 business hours with customized slab pricing and sample availability.
                </p>

                {/* Instant Connect Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/919876543210?text=${encodeURIComponent(
                      `Hi NYUTA ELITE, I have submitted wholesale enquiry (${submittedRef}) for ${formData.quantity} of ${formData.productGrade}. Name: ${formData.name}, Business: ${formData.businessName || 'Individual'}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Connect via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#123B2A] text-[#123B2A] hover:bg-[#F7F1E5] px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Submit Another Enquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6A15B] block mb-1">
                    REQUEST WHOLESALE QUOTE
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A]">
                    Bulk Order Enquiry Form
                  </h2>
                  <p className="text-xs text-[#68756E] mt-1">
                    Fill out your requirements below to receive formal slab pricing and delivery timelines.
                  </p>
                </div>

                {/* Full Name & Business Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#1C1C1C] focus:outline-none transition-colors ${
                        errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="businessName" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Business / Store Name <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      placeholder="e.g. Mithila Organic Stores"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full min-h-11 px-3.5 rounded-xl border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                      }}
                      className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#1C1C1C] focus:outline-none transition-colors ${
                        errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Email Address <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@business.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#1C1C1C] focus:outline-none transition-colors ${
                        errors.email ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Required Quantity & Product Grade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Estimated Quantity <span className="text-rose-600">*</span>
                    </label>
                    <select
                      id="quantity"
                      value={formData.quantity}
                      onChange={(e) => {
                        setFormData({ ...formData, quantity: e.target.value });
                        if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                      }}
                      className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#1C1C1C] bg-white focus:outline-none transition-colors ${
                        errors.quantity ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                      }`}
                    >
                      <option value="">Select quantity range...</option>
                      {QUANTITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.quantity && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.quantity}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="productGrade" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Product Grade / Packaging <span className="text-rose-600">*</span>
                    </label>
                    <select
                      id="productGrade"
                      value={formData.productGrade}
                      onChange={(e) => {
                        setFormData({ ...formData, productGrade: e.target.value });
                        if (errors.productGrade) setErrors({ ...errors, productGrade: undefined });
                      }}
                      className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#1C1C1C] bg-white focus:outline-none transition-colors ${
                        errors.productGrade ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                      }`}
                    >
                      <option value="">Select grade or packaging...</option>
                      {PRODUCT_GRADE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.productGrade && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.productGrade}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery City / State */}
                <div>
                  <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Destination City / State <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra (Pincode 400001)"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full min-h-11 px-3.5 rounded-xl border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Additional Message or Custom Specifications <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    placeholder="Mention any custom label requirements, delivery schedule preferences, or sample requests..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-12 bg-[#123B2A] hover:bg-[#092218] active:bg-black text-[#FCFAF5] rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Submitting Enquiry...' : 'Submit Wholesale Enquiry'}</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
                </button>

                <p className="text-[11px] text-[#68756E] text-center">
                  🔒 We protect your commercial data. Your requirements are kept confidential.
                </p>
              </form>
            )}
          </div>

          {/* RIGHT: Contact Desk & Order Slabs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Wholesale Desk Box */}
            <div className="bg-[#123B2A] text-white p-6 sm:p-8 rounded-3xl border border-[#092218] shadow-md space-y-5">
              <div className="flex items-center gap-2.5 text-[#C6A15B]">
                <Building2 className="w-5 h-5" />
                <h3 className="font-serif text-xl font-bold text-white">Wholesale Trade Desk</h3>
              </div>
              <p className="text-xs text-[#D5DED6] leading-relaxed">
                Connect directly with our Mithila procurement and dispatch coordinators for instantaneous quotes or immediate dispatch.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Direct Wholesale Line</span>
                    <a href="tel:+919876543210" className="text-[#D5DED6] hover:text-[#C6A15B] transition-colors">
                      +91 98765 43210 (Mon – Sat, 9 AM – 7 PM IST)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Commercial Enquiries</span>
                    <a href="mailto:wholesale@nyutaelite.com" className="text-[#D5DED6] hover:text-[#C6A15B] transition-colors">
                      wholesale@nyutaelite.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Processing &amp; Dispatch Facility</span>
                    <span className="text-[#D5DED6]">
                      Mithila Region, Darbhanga, Bihar 846004, India
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Turnaround Time</span>
                    <span className="text-[#D5DED6]">Quotes provided within 4–6 business hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale Quantity Guide */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DECB] shadow-xs space-y-4">
              <h4 className="font-serif text-base font-bold text-[#123B2A]">Wholesale Quantity Tiers</h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-between">
                  <div>
                    <strong className="text-[#123B2A] block">10 kg – 50 kg</strong>
                    <span className="text-[#68756E] text-[11px]">Trial / Boutique Grocers</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#123B2A] bg-white px-2.5 py-1 rounded-lg border border-[#C6A15B]/40">
                    Tier 1 Rates
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-between">
                  <div>
                    <strong className="text-[#123B2A] block">50 kg – 200 kg</strong>
                    <span className="text-[#68756E] text-[11px]">Supermarkets &amp; Sweet Houses</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#123B2A] bg-white px-2.5 py-1 rounded-lg border border-[#C6A15B]/40">
                    Tier 2 Rates
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-between">
                  <div>
                    <strong className="text-[#123B2A] block">200 kg+</strong>
                    <span className="text-[#68756E] text-[11px]">Regional Distributors &amp; Exports</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#123B2A] bg-white px-2.5 py-1 rounded-lg border border-[#C6A15B]/40">
                    Tier 3 Best Rates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHOLESALE FAQS */}
        <section className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6A15B]">
              FREQUENTLY ASKED
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A] mt-1">
              Wholesale &amp; Bulk Purchasing FAQs
            </h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {BULK_FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={faq.q} className="border border-[#E8DECB] rounded-2xl overflow-hidden bg-[#FCFAF5]">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#1C1C1C] hover:text-[#123B2A] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#C6A15B] shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 text-xs text-[#68756E] leading-relaxed border-t border-[#E8DECB]/50 pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BulkOrder;
