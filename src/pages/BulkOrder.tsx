import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Clock,
  Sparkles,
  ChevronDown,
  AlertCircle,
  MessageSquare,
  Package,
} from 'lucide-react';
import { api, ApiError } from '../services/api';

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
  city?: string;
}

const AVAILABLE_GRADES = [
  '4 Sutta Makhana',
  '5 Sutta Makhana',
  '5.5 Sutta Makhana',
  '6 Sutta Makhana',
];

const QUANTITY_PRESETS = ['25', '50', '100', '250', '500', '1000'];

const BULK_FAQS = [
  {
    q: 'What is the Minimum Order Quantity (MOQ) for wholesale pricing?',
    a: 'Our wholesale tier begins at 10 kg across any grade. For larger commercial orders exceeding 100 kg, tiered slab discounts apply automatically.',
  },
  {
    q: 'Do you provide sample testing packs before placing a large order?',
    a: 'Yes. We can dispatch a verified sample tasting kit containing our grades directly to your business address.',
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
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize product grade from navigation state or sessionStorage
  const navGrade = (location.state as { grade?: string })?.grade;
  const initialGrade = navGrade || (() => {
    try {
      return sessionStorage.getItem('nyuta_selected_grade') || AVAILABLE_GRADES[0];
    } catch {
      return AVAILABLE_GRADES[0];
    }
  })();

  const [formData, setFormData] = useState<BulkEnquiryFormData>({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    quantity: '',
    productGrade: initialGrade,
    city: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Sync if location.state changes
  useEffect(() => {
    if (navGrade) {
      setFormData((prev) => ({ ...prev, productGrade: navGrade }));
      try {
        sessionStorage.setItem('nyuta_selected_grade', navGrade);
      } catch {
        // ignore
      }
    }
  }, [navGrade]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name (at least 2 characters).';
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

    const numQty = Number(formData.quantity);
    if (!formData.quantity.trim() || isNaN(numQty) || numQty <= 0) {
      newErrors.quantity = 'Please enter a valid positive quantity in kilograms (e.g. 25, 50, 100).';
    }

    if (!formData.productGrade.trim()) {
      newErrors.productGrade = 'Please select a makhana quality grade.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Please provide your destination city and state.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.post<{
        success: boolean;
        enquiryId: string;
        message: string;
      }>('/bulk-enquiry', {
        name: formData.name.trim(),
        businessName: formData.businessName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        quantity: Number(formData.quantity),
        productGrade: formData.productGrade.trim(),
        city: formData.city.trim(),
        message: formData.message.trim(),
      });

      if (response && response.success) {
        const refId = response.enquiryId || `NE-BULK-${Date.now().toString().slice(-6)}`;
        setSubmittedRef(refId);

        // Store client-side copy for user history
        try {
          const existing = JSON.parse(localStorage.getItem('nyuta_bulk_enquiries') || '[]');
          existing.unshift({
            id: refId,
            timestamp: new Date().toISOString(),
            ...formData,
            status: 'RECEIVED',
          });
          localStorage.setItem('nyuta_bulk_enquiries', JSON.stringify(existing));
        } catch {
          // ignore
        }
      } else {
        setSubmitError(response?.message || 'Unable to submit enquiry. Please try again.');
      }
    } catch (err: any) {
      const errMsg = err instanceof ApiError ? err.message : err?.message || 'Failed to submit enquiry. Please check your connection and try again.';
      setSubmitError(errMsg);
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
      productGrade: initialGrade,
      city: '',
      message: '',
    });
    setErrors({});
    setSubmitError(null);
    setSubmittedRef(null);
  };

  // WhatsApp Pre-filled message generator
  const getWhatsAppEnquiryUrl = () => {
    const lines = [
      'Hi NYUTA ELITE MAKHANA, I would like to enquire about a bulk order:',
      `- Selected Grade: ${formData.productGrade || 'Makhana'}`,
      formData.quantity ? `- Required Quantity: ${formData.quantity} kg` : null,
      formData.name ? `- Customer Name: ${formData.name}` : null,
      formData.businessName ? `- Business Name: ${formData.businessName}` : null,
      formData.city ? `- Delivery Location: ${formData.city}` : null,
      formData.message ? `- Requirements: ${formData.message}` : null,
      'Please share pricing and availability.',
    ].filter(Boolean);

    return `https://wa.me/916201426357?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen text-[#1C1C1C] py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-[#123B2A] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/bulk-order/qualities" className="hover:text-[#123B2A] transition-colors">
                Bulk Order
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#123B2A] font-extrabold" aria-current="page">
              Bulk Enquiry
            </li>
          </ol>
        </nav>

        {/* HERO BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-[#123B2A] text-white p-8 sm:p-12 lg:p-16 border border-[#092218] shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A65B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#092218]/80 border border-[#C9A65B]/60 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#C9A65B]">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A65B]" />
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
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C9A65B]/40">
              <Package className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">Direct Bihar Sourcing</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Harvested in traditional freshwater wetlands with zero intermediate dealer margins for unbeatable value.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C9A65B]/40">
              <ShieldCheck className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">Jumbo 6-Suta Quality</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Machine-screened and hand-sorted for uniform diameter, crisp pop expansion, and zero chemical bleaching.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C9A65B]/40">
              <FileText className="w-6 h-6 text-[#123B2A]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#123B2A]">GST Input Credit</h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              100% compliant business GST invoices provided with standard HSN classification for seamless tax deductions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C9A65B]/40">
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
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A65B]">
                    ENQUIRY CONFIRMED
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A]">
                    Thank you for your enquiry!
                  </h3>
                  <p className="text-sm sm:text-base font-semibold text-[#123B2A]">
                    Our team will contact you with bulk pricing and availability.
                  </p>
                  <div className="inline-block bg-[#F7F1E5] border border-[#C9A65B]/50 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-[#123B2A]">
                    Ref ID: {submittedRef}
                  </div>
                </div>

                <div className="bg-[#FCFAF5] p-4 rounded-xl border border-[#E8DECB] text-xs text-[#4A5D53] space-y-1 max-w-md mx-auto text-left">
                  <p><strong>Customer:</strong> {formData.name}</p>
                  {formData.businessName && <p><strong>Business:</strong> {formData.businessName}</p>}
                  <p><strong>Grade:</strong> {formData.productGrade}</p>
                  <p><strong>Quantity:</strong> {formData.quantity} kg</p>
                  <p><strong>Destination:</strong> {formData.city}</p>
                </div>

                {/* Instant Connect Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={getWhatsAppEnquiryUrl()}
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
              <div className="space-y-6">
                {/* Navigation Back & Grade Indicator Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#F7F4E8] rounded-2xl border border-[#C9A65B]/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#123D2D] text-[#C9A65B] flex items-center justify-center text-xs font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#68756E] block">
                        Selected Makhana Grade
                      </span>
                      <strong className="text-xs sm:text-sm font-serif font-bold text-[#123D2D]">
                        {formData.productGrade || 'No Grade Selected'}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/bulk-order/qualities', { state: { grade: formData.productGrade } })}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#123D2D] hover:text-[#092218] border border-[#123D2D] px-3 py-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>BACK TO QUALITIES</span>
                  </button>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A65B] block mb-1">
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
                        Mobile Number <span className="text-rose-600">*</span>
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

                  {/* Selected Makhana Grade & Required Quantity in kg */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="productGrade" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                        Selected Makhana Grade <span className="text-rose-600">*</span>
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
                        {AVAILABLE_GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
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

                    <div>
                      <label htmlFor="quantity" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                        Required Quantity (in Kilograms) <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="quantity"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="e.g. 50"
                          value={formData.quantity}
                          onChange={(e) => {
                            setFormData({ ...formData, quantity: e.target.value });
                            if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                          }}
                          className={`w-full min-h-11 px-3.5 pr-10 rounded-xl border text-xs text-[#1C1C1C] focus:outline-none transition-colors ${
                            errors.quantity ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                          }`}
                        />
                        <span className="absolute right-3.5 top-3 text-xs text-[#68756E] font-bold">
                          kg
                        </span>
                      </div>
                      {errors.quantity && (
                        <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.quantity}</span>
                        </p>
                      )}
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-[#68756E] font-semibold">Quick presets:</span>
                        {QUANTITY_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, quantity: preset });
                              if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              formData.quantity === preset
                                ? 'bg-[#123B2A] text-[#C9A65B] border-[#123B2A]'
                                : 'bg-[#F7F1E5] text-[#123B2A] border-[#E8DECB] hover:border-[#123B2A]'
                            }`}
                          >
                            {preset} kg
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Destination City & State */}
                  <div>
                    <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Delivery City &amp; State <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      placeholder="e.g. Mumbai, Maharashtra (Pincode 400001)"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value });
                        if (errors.city) setErrors({ ...errors, city: undefined });
                      }}
                      className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#1C1C1C] focus:outline-none transition-colors ${
                        errors.city ? 'border-rose-500 bg-rose-50/30' : 'border-[#E8DECB] focus:border-[#123B2A]'
                      }`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.city}</span>
                      </p>
                    )}
                  </div>

                  {/* Additional Requirements */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Additional Requirements or Custom Specifications <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      placeholder="Mention any custom packaging preferences, expected delivery schedule, or sample requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-12 bg-[#123B2A] hover:bg-[#092218] active:bg-black text-[#FCFAF5] rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Submitting Enquiry...' : 'SUBMIT ENQUIRY'}</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A65B]" />
                  </button>

                  {/* WhatsApp Secondary Enquiry Option */}
                  <div className="pt-2">
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-[#E8DECB]" />
                      <span className="flex-shrink mx-3 text-[11px] font-bold text-[#68756E] uppercase tracking-wider">
                        Or Enquire Directly
                      </span>
                      <div className="flex-grow border-t border-[#E8DECB]" />
                    </div>

                    <a
                      href={getWhatsAppEnquiryUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-11 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>ENQUIRE VIA WHATSAPP (+91 6201426357)</span>
                    </a>
                  </div>

                  <p className="text-[11px] text-[#68756E] text-center pt-2">
                    🔒 We protect your commercial data. Your requirements are kept confidential.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT: Contact Desk & Order Slabs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Wholesale Desk Box */}
            <div className="bg-[#123B2A] text-white p-6 sm:p-8 rounded-3xl border border-[#092218] shadow-md space-y-5">
              <div className="flex items-center gap-2.5 text-[#C9A65B]">
                <Building2 className="w-5 h-5" />
                <h3 className="font-serif text-xl font-bold text-white">Wholesale Trade Desk</h3>
              </div>
              <p className="text-xs text-[#D5DED6] leading-relaxed">
                Connect directly with our Mithila procurement and dispatch coordinators for instantaneous quotes or immediate dispatch.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#C9A65B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Official WhatsApp &amp; Support Line</span>
                    <a href="tel:+916201426357" className="text-[#D5DED6] hover:text-[#C9A65B] transition-colors">
                      +91 62014 26357 (Mon – Sat, 9 AM – 7 PM IST)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C9A65B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Commercial Enquiries</span>
                    <a href="mailto:wholesale@nyutaelite.com" className="text-[#D5DED6] hover:text-[#C9A65B] transition-colors">
                      wholesale@nyutaelite.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A65B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Processing &amp; Dispatch Facility</span>
                    <span className="text-[#D5DED6]">
                      Mithila Region, Darbhanga, Bihar 846004, India
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#C9A65B] shrink-0 mt-0.5" />
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
                  <span className="text-[11px] font-bold text-[#123B2A] bg-white px-2.5 py-1 rounded-lg border border-[#C9A65B]/40">
                    Tier 1 Rates
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-between">
                  <div>
                    <strong className="text-[#123B2A] block">50 kg – 200 kg</strong>
                    <span className="text-[#68756E] text-[11px]">Supermarkets &amp; Sweet Houses</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#123B2A] bg-white px-2.5 py-1 rounded-lg border border-[#C9A65B]/40">
                    Tier 2 Rates
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-between">
                  <div>
                    <strong className="text-[#123B2A] block">200 kg+</strong>
                    <span className="text-[#68756E] text-[11px]">Regional Distributors &amp; Exports</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#123B2A] bg-white px-2.5 py-1 rounded-lg border border-[#C9A65B]/40">
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
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A65B]">
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
                      className={`w-4 h-4 text-[#C9A65B] shrink-0 transition-transform duration-300 ${
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
