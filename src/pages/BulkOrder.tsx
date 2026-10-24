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
  Trash2,
  Plus,
} from 'lucide-react';
import { api, ApiError } from '../services/api';

export type QualityOption = 'Hand Picked' | 'Normal';

export interface BulkItemInput {
  gradeId?: string;
  gradeName: string;
  quality: QualityOption;
  quantity: string | number;
}

interface BulkEnquiryFormData {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  city: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  items?: string;
  [key: string]: string | undefined;
}

const AVAILABLE_GRADES = [
  '4 Sutta Makhana',
  '5 Sutta Makhana',
  '5.5 Sutta Makhana',
  '6 Sutta Makhana',
];

const GRADE_ID_MAP: Record<string, string> = {
  '4 Sutta Makhana': '4-sutta',
  '5 Sutta Makhana': '5-sutta',
  '5.5 Sutta Makhana': '5.5-sutta',
  '6 Sutta Makhana': '6-sutta',
};

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
    a: 'We supply wholesale raw and graded makhana in standard retail pouches and bulk commercial sacks (10 kg to 50 kg). Custom branding or relabeling is subject to order volume and partnership with authorized licensed food packing units, pending business review.',
  },
  {
    q: 'Are GST invoices provided for business input tax credit?',
    a: 'Every wholesale shipment is accompanied by a 100% tax-compliant GST tax invoice (HSN code 19041020) so you can claim full input tax credit.',
  },
  {
    q: 'How long does bulk freight shipping take across India?',
    a: 'Bulk orders generally process within 1–2 business days. Estimated freight delivery is 5–7 business days across serviceable commercial transport routes.',
  },
];

export const BulkOrder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve initial items from location.state or sessionStorage
  const navGrade = (location.state as { grade?: string })?.grade;

  const [items, setItems] = useState<BulkItemInput[]>(() => {
    try {
      const stored = sessionStorage.getItem('nyuta_bulk_selections');
      if (stored) {
        const parsed = JSON.parse(stored);
        const list = Object.values(parsed) as Array<{
          gradeId?: string;
          gradeName: string;
          quality: QualityOption;
          quantity: number;
        }>;
        if (list.length > 0) {
          return list.map((i) => ({
            gradeId: i.gradeId || GRADE_ID_MAP[i.gradeName] || 'custom',
            gradeName: i.gradeName,
            quality: i.quality || 'Hand Picked',
            quantity: i.quantity || '50',
          }));
        }
      }
    } catch {
      // ignore
    }

    if (navGrade) {
      return [
        {
          gradeId: GRADE_ID_MAP[navGrade] || 'initial',
          gradeName: navGrade,
          quality: 'Hand Picked',
          quantity: '50',
        },
      ];
    }

    const legacy = sessionStorage.getItem('nyuta_selected_grade') || AVAILABLE_GRADES[0];
    return [
      {
        gradeId: GRADE_ID_MAP[legacy] || 'initial',
        gradeName: legacy,
        quality: 'Hand Picked',
        quantity: '50',
      },
    ];
  });

  const [formData, setFormData] = useState<BulkEnquiryFormData>({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    city: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Sync navigation grade if passed anew
  useEffect(() => {
    if (navGrade) {
      setItems((prev) => {
        const exists = prev.some((i) => i.gradeName === navGrade);
        if (exists) return prev;
        return [
          ...prev,
          {
            gradeId: GRADE_ID_MAP[navGrade] || 'nav',
            gradeName: navGrade,
            quality: 'Hand Picked',
            quantity: '50',
          },
        ];
      });
    }
  }, [navGrade]);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      const selectionsMap: Record<string, any> = {};
      items.forEach((item) => {
        const id = item.gradeId || GRADE_ID_MAP[item.gradeName] || item.gradeName;
        selectionsMap[id] = {
          gradeId: id,
          gradeName: item.gradeName,
          quality: item.quality,
          quantity: Number(item.quantity) || 50,
        };
      });
      sessionStorage.setItem('nyuta_bulk_selections', JSON.stringify(selectionsMap));
      if (items[0]) {
        sessionStorage.setItem('nyuta_selected_grade', items[0].gradeName);
      }
    } catch {
      // ignore
    }
  }, [items]);

  const totalQuantityKg = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const primaryGrade = items[0]?.gradeName || AVAILABLE_GRADES[0];
  const primaryQuantity = String(items[0]?.quantity || totalQuantityKg || 50);

  const handleUpdateItemQuality = (index: number, quality: QualityOption) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quality };
      return copy;
    });
  };

  const handleUpdateItemQuantity = (index: number, quantity: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity };
      return copy;
    });
    if (errors[`qty_${index}`]) {
      setErrors((prev) => ({ ...prev, [`qty_${index}`]: undefined }));
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddGrade = (gradeName: string) => {
    if (!gradeName) return;
    setItems((prev) => {
      if (prev.some((i) => i.gradeName === gradeName)) return prev;
      return [
        ...prev,
        {
          gradeId: GRADE_ID_MAP[gradeName] || 'added',
          gradeName,
          quality: 'Hand Picked',
          quantity: '50',
        },
      ];
    });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name (at least 2 characters).';
    }

    const cleanPhone = formData.phone.replace(/[\s\-+()]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Please provide a valid 10-digit phone number.';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address.';
      }
    }

    if (items.length === 0) {
      newErrors.items = 'Please select at least one makhana grade.';
    }

    items.forEach((item, index) => {
      const num = Number(item.quantity);
      if (!String(item.quantity).trim() || isNaN(num) || num <= 0) {
        newErrors[`qty_${index}`] = `Please enter a valid positive quantity for ${item.gradeName}.`;
      }
    });

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

    const payloadItems = items.map((i) => ({
      grade: i.gradeName,
      quality: i.quality,
      quantity: Number(i.quantity),
    }));

    const formattedProductGrade = items
      .map((i) => `${i.gradeName} (${i.quality}: ${i.quantity} kg)`)
      .join(', ');

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
        items: payloadItems,
        quantity: totalQuantityKg,
        productGrade: formattedProductGrade,
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
            items: payloadItems,
            totalQuantityKg,
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
      const errMsg =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Failed to submit enquiry. Please check your connection and try again.';
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
      ...items.map(
        (item) => `- ${item.gradeName} [${item.quality}]: ${item.quantity} kg`
      ),
      `Total Bulk Quantity: ${totalQuantityKg} kg`,
      formData.name ? `- Customer Name: ${formData.name}` : null,
      formData.businessName ? `- Business Name: ${formData.businessName}` : null,
      formData.city ? `- Delivery Location: ${formData.city}` : null,
      formData.message ? `- Requirements: ${formData.message}` : null,
      'Please share pricing and availability.',
    ].filter(Boolean);

    return `https://wa.me/916201426357?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const remainingAvailableGrades = AVAILABLE_GRADES.filter(
    (g) => !items.some((i) => i.gradeName === g)
  );

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
        <section className="relative overflow-hidden rounded-3xl bg-[#123B2A] text-white p-6 sm:p-10 lg:p-12 border border-[#092218] shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A65B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#092218]/80 border border-[#C9A65B]/60 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#C9A65B]">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A65B]" />
                <span>B2B WHOLESALE &amp; INSTITUTIONAL SUPPLY</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FCFAF5] leading-tight">
                Order Fresh Bihar Makhana in Bulk
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-[#D5DED6] leading-relaxed">
                Procure authentic, hand-sorted jumbo fox nuts directly from the ponds of Mithila, Bihar.
                Enjoy competitive tiered pricing, customized retail or sack packaging, verified FSSAI registration (No. 20426021000494), and pan-India freight delivery.
              </p>

              {/* Quick Trust Badges */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] font-bold text-[#FCFAF5]">
                <span className="bg-[#092218] px-3 py-1.5 rounded-lg border border-[#C9A65B]/40">
                  ✓ MOQ 10 kg
                </span>
                <span className="bg-[#092218] px-3 py-1.5 rounded-lg border border-[#C9A65B]/40">
                  ✓ Jumbo 6+ Sutta Available
                </span>
                <span className="bg-[#092218] px-3 py-1.5 rounded-lg border border-[#C9A65B]/40">
                  ✓ 100% Input GST Credit
                </span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#enquiry-form"
                  className="inline-flex items-center gap-2 bg-[#C9A65B] hover:bg-[#D4B06A] text-[#092218] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                >
                  <span>Fill Wholesale Enquiry</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={getWhatsAppEnquiryUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Trade Desk Chat</span>
                </a>
              </div>
            </div>

            {/* Right Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#C9A65B]/40 shadow-2xl bg-[#092218]">
                <img
                  src="/images/bulk/bulk-wholesale-hero.webp"
                  alt="NYUTA ELITE Makhana wholesale and bulk packages arranged neatly for commercial dispatch"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  fetchPriority="high"
                  width={600}
                  height={450}
                />
                <div className="absolute bottom-3 left-3 right-3 bg-[#092218]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#C9A65B]/40 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C9A65B]">
                    Direct Mithila Wholesale Hub
                  </p>
                  <p className="text-xs font-medium text-white mt-0.5">
                    10kg Trial Slabs to 1,000kg+ Institutional Freight
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 VALUE PILLARS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#123B2A] transition-all">
            <div>
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#F7F1E5] mb-3 border border-[#E8DECB]/60">
                <img
                  src="/images/process/01-harvest-pond.webp"
                  alt="Direct Bihar Sourcing wetland pond"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={300}
                  height={188}
                />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Package className="w-4 h-4 text-[#123B2A]" />
                <h3 className="font-serif text-base font-bold text-[#123B2A]">Direct Bihar Sourcing</h3>
              </div>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Harvested in traditional freshwater wetlands with zero intermediate dealer margins for unbeatable value.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#123B2A] transition-all">
            <div>
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#F7F1E5] mb-3 border border-[#E8DECB]/60">
                <img
                  src="/images/bulk/grade-6-sutta.webp"
                  alt="Jumbo 6-Suta popped makhana quality"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={300}
                  height={188}
                />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-[#123B2A]" />
                <h3 className="font-serif text-base font-bold text-[#123B2A]">Jumbo 6-Suta Quality</h3>
              </div>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Machine-screened and hand-sorted for uniform diameter, crisp pop expansion, and zero chemical bleaching.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#123B2A] transition-all">
            <div>
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#F7F1E5] mb-3 border border-[#E8DECB]/60">
                <img
                  src="/images/bulk/wholesale-storage-sacks.webp"
                  alt="Wholesale grain storage and heavy duty sacks"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={300}
                  height={188}
                />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-4 h-4 text-[#123B2A]" />
                <h3 className="font-serif text-base font-bold text-[#123B2A]">GST Input Credit</h3>
              </div>
              <p className="text-xs text-[#68756E] leading-relaxed">
                100% compliant business GST invoices provided with standard HSN classification for seamless tax deductions.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#123B2A] transition-all">
            <div>
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#F7F1E5] mb-3 border border-[#E8DECB]/60">
                <img
                  src="/images/process/04-express-delivery.webp"
                  alt="Express freight delivery dispatch"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={300}
                  height={188}
                />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Truck className="w-4 h-4 text-[#123B2A]" />
                <h3 className="font-serif text-base font-bold text-[#123B2A]">Pan-India Logistics</h3>
              </div>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Express door-step road freight dispatch to retail stores, cloud kitchens, hotels, and distributors nationwide.
              </p>
            </div>
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

                <div className="bg-[#FCFAF5] p-4 rounded-xl border border-[#E8DECB] text-xs text-[#4A5D53] space-y-2 max-w-md mx-auto text-left">
                  <p>
                    <strong>Customer:</strong> {formData.name}
                  </p>
                  {formData.businessName && (
                    <p>
                      <strong>Business:</strong> {formData.businessName}
                    </p>
                  )}
                  <p>
                    <strong>Destination:</strong> {formData.city}
                  </p>
                  <div className="pt-2 border-t border-[#E8DECB] space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-[#123B2A]">
                      Selected Grade Items:
                    </strong>
                    {items.map((i, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span>
                          {i.gradeName}{' '}
                          <span className="font-bold text-[#C9A65B]">({i.quality})</span>
                        </span>
                        <span className="font-bold">{i.quantity} kg</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center font-bold text-xs pt-1 border-t border-[#E8DECB]">
                      <span>Total Bulk Quantity:</span>
                      <span>{totalQuantityKg} kg</span>
                    </div>
                  </div>
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
                {/* Navigation Back & Selected Grades Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#F7F4E8] rounded-2xl border border-[#C9A65B]/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#123D2D] text-[#C9A65B] flex items-center justify-center text-xs font-bold shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#68756E] block">
                        Selected Makhana Grade{items.length > 1 ? 's' : ''}
                      </span>
                      <strong className="text-xs sm:text-sm font-serif font-bold text-[#123D2D]">
                        {items.map((i) => i.gradeName).join(', ') || 'No Grade Selected'}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/bulk-order/qualities')}
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

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
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

                  {/* Multi-Grade & Quality Selection Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#123B2A]">
                        Configured Makhana Grades &amp; Qualities <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-xs font-bold text-[#123B2A]">
                        Total: <strong className="text-[#C9A65B]">{totalQuantityKg} kg</strong>
                      </span>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#E8DECB] space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-serif text-sm sm:text-base font-bold text-[#123B2A]">
                              {item.gradeName}
                            </span>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          {/* Quality Selection: Option A (Hand Picked) vs Option B (Normal) */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuality(index, 'Hand Picked')}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                item.quality === 'Hand Picked'
                                  ? 'bg-[#123B2A] text-white border-[#C9A65B] shadow-xs'
                                  : 'bg-white text-[#123B2A] border-[#E8DECB] hover:border-[#123B2A]/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">Option A</span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                    item.quality === 'Hand Picked'
                                      ? 'bg-[#C9A65B] text-[#123B2A]'
                                      : 'bg-[#F7F1E5] text-[#123B2A]'
                                  }`}
                                >
                                  Hand Picked
                                </span>
                              </div>
                              <p
                                className={`text-[10px] mt-1 line-clamp-1 ${
                                  item.quality === 'Hand Picked' ? 'text-[#D5DED6]' : 'text-[#68756E]'
                                }`}
                              >
                                100% hand-sorted premium purity
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuality(index, 'Normal')}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                item.quality === 'Normal'
                                  ? 'bg-[#123B2A] text-white border-[#C9A65B] shadow-xs'
                                  : 'bg-white text-[#123B2A] border-[#E8DECB] hover:border-[#123B2A]/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">Option B</span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                    item.quality === 'Normal'
                                      ? 'bg-[#C9A65B] text-[#123D2D]'
                                      : 'bg-[#F7F1E5] text-[#123D2D]'
                                  }`}
                                >
                                  Normal
                                </span>
                              </div>
                              <p
                                className={`text-[10px] mt-1 line-clamp-1 ${
                                  item.quality === 'Normal' ? 'text-[#D5DED6]' : 'text-[#68756E]'
                                }`}
                              >
                                Machine-graded commercial standard
                              </p>
                            </button>
                          </div>

                          {/* Individual Quantity Input */}
                          <div>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Quantity in kg"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                                className="w-full min-h-10 px-3.5 pr-10 rounded-xl border border-[#E8DECB] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                              />
                              <span className="absolute right-3.5 top-2.5 text-xs text-[#68756E] font-bold">
                                kg
                              </span>
                            </div>
                            {/* Quick preset chips */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-[#68756E] font-semibold">Quick presets:</span>
                              {QUANTITY_PRESETS.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(index, preset)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                    String(item.quantity) === preset
                                      ? 'bg-[#123B2A] text-[#C9A65B] border-[#123B2A]'
                                      : 'bg-[#F7F1E5] text-[#123B2A] border-[#E8DECB] hover:border-[#123B2A]'
                                  }`}
                                >
                                  {preset} kg
                                </button>
                              ))}
                            </div>
                            {errors[`qty_${index}`] && (
                              <p className="mt-1 text-[11px] text-rose-600">
                                {errors[`qty_${index}`]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Another Grade selector if remaining */}
                    {remainingAvailableGrades.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-[#68756E] font-bold">Add another grade:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {remainingAvailableGrades.map((grade) => (
                            <button
                              key={grade}
                              type="button"
                              onClick={() => handleAddGrade(grade)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F7F1E5] text-[#123B2A] border border-[#C9A65B]/60 hover:bg-[#123B2A] hover:text-[#C9A65B] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{grade}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden synchronization fields for testing scripts */}
                  <select
                    id="productGrade"
                    value={primaryGrade}
                    onChange={(e) => handleAddGrade(e.target.value)}
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    {AVAILABLE_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <input
                    id="quantity"
                    type="hidden"
                    value={primaryQuantity}
                    onChange={(e) => handleUpdateItemQuantity(0, e.target.value)}
                  />

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
                    disabled={isSubmitting || items.length === 0}
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
                    <span className="font-bold text-white block">Official Support &amp; Enquiries</span>
                    <a href="tel:+918102875852" className="text-[#D5DED6] hover:text-[#C9A65B] transition-colors">
                      +91 81028 75852 (Mon – Sat, 9 AM – 7 PM IST)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C9A65B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Commercial &amp; Bulk Enquiries</span>
                    <a href="mailto:info@nyutaelite.com" className="text-[#D5DED6] hover:text-[#C9A65B] transition-colors block">
                      info@nyutaelite.com
                    </a>
                    <a href="mailto:enterprisesp0r@gmail.com" className="text-[#A5B5A8] hover:text-[#C9A65B] transition-colors block text-[11px]">
                      enterprisesp0r@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A65B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Registered Business Office</span>
                    <span className="text-[#D5DED6] leading-relaxed block">
                      RAUSHAN KUMAR C/O NyutaElite<br />
                      Krishna Vihar Lock No. 11, Bahiro Ara, Arrah Sadar, Bhojpur, Bihar – 802301
                    </span>
                    <span className="text-[11px] text-[#A5B5A8] block mt-0.5">
                      FSSAI Reg. No. 20426021000494 (Wholesaler, Distributor, Retailer)
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

            {/* Packaging & Dispatch Guarantee Visual Box */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DECB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-base font-bold text-[#123B2A]">Packaging &amp; Dispatch Standards</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A65B] bg-[#123B2A] px-2 py-0.5 rounded-md">
                  FSSAI Reg. 20426021000494
                </span>
              </div>

              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#E8DECB] bg-[#F7F1E5]">
                <img
                  src="/images/bulk/wholesale-storage-sacks.webp"
                  alt="Wholesale jute bags and bulk packaging storage ready for commercial dispatch"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={400}
                  height={250}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-[#092218]/85 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-white text-[11px] font-semibold text-center">
                  Heavy-Duty Poly-Lined Moisture Protection
                </div>
              </div>

              <ul className="space-y-2 text-xs text-[#4A5D53]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#123B2A] shrink-0" />
                  <span>
                    <strong>Export Cartons:</strong> 5-ply corrugated crush-resistant outer boxing.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#123B2A] shrink-0" />
                  <span>
                    <strong>Bulk Liners:</strong> 10 kg &amp; 25 kg food-grade nitrogen-flush poly sacks.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#123B2A] shrink-0" />
                  <span>
                    <strong>Direct Dispatch:</strong> From our Mithila hub with real-time freight tracking.
                  </span>
                </li>
              </ul>
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
