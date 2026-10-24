import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  X,
  AlertCircle,
  Package,
  Trash2,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { api, ApiError } from '../services/api';

export type QualityOption = 'Hand Picked' | 'Normal';

export interface MakhanaGrade {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface SelectedGradeState {
  gradeId: string;
  gradeName: string;
  quality: QualityOption;
  quantity: number;
}

export const GRADES: MakhanaGrade[] = [
  {
    id: '4-sutta',
    name: '4 Sutta Makhana',
    description: 'Classic texture, suitable for everyday use.',
    image: '/images/bulk/grade-4-sutta.webp',
  },
  {
    id: '5-sutta',
    name: '5 Sutta Makhana',
    description: 'Slightly larger kernels, premium texture.',
    image: '/images/bulk/grade-5-sutta.webp',
  },
  {
    id: '5.5-sutta',
    name: '5.5 Sutta Makhana',
    description: 'Enhanced size for premium snack mixes.',
    image: '/images/bulk/grade-5-5-sutta.webp',
  },
  {
    id: '6-sutta',
    name: '6 Sutta Makhana',
    description: 'Largest, jumbo quality for deluxe presentations.',
    image: '/images/bulk/grade-6-sutta.webp',
  },
];

const QUANTITY_PRESETS = [25, 50, 100, 250, 500, 1000];

export const BulkOrderQualities: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Multi-selection state: dictionary of gradeId -> SelectedGradeState
  const [selectedGrades, setSelectedGrades] = useState<Record<string, SelectedGradeState>>(() => {
    try {
      const stored = sessionStorage.getItem('nyuta_bulk_selections');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    // Fallback: check legacy single selection
    const navGrade = (location.state as { grade?: string })?.grade;
    const legacyGrade = navGrade || sessionStorage.getItem('nyuta_selected_grade');
    if (legacyGrade) {
      const matching = GRADES.find((g) => g.name.toLowerCase() === legacyGrade.toLowerCase());
      if (matching) {
        return {
          [matching.id]: {
            gradeId: matching.id,
            gradeName: matching.name,
            quality: 'Hand Picked',
            quantity: 50,
          },
        };
      }
    }

    return {};
  });

  // Active grade being configured in the Quality Selection Modal
  const [activeGradeModal, setActiveGradeModal] = useState<MakhanaGrade | null>(null);
  const [tempQualityChoice, setTempQualityChoice] = useState<QualityOption>('Hand Picked');

  // Customer Enquiry Form Modal state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  // Enquiry Form State
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    city: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<any | null>(null);

  // Sync selections to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('nyuta_bulk_selections', JSON.stringify(selectedGrades));
      const firstGrade = Object.values(selectedGrades)[0]?.gradeName || '';
      if (firstGrade) {
        sessionStorage.setItem('nyuta_selected_grade', firstGrade);
      }
    } catch {
      // ignore
    }
  }, [selectedGrades]);

  // When opening quality modal for a grade, initialize its quality choice
  const handleOpenQualityModal = (grade: MakhanaGrade) => {
    const existing = selectedGrades[grade.id];
    setTempQualityChoice(existing ? existing.quality : 'Hand Picked');
    setActiveGradeModal(grade);
  };

  const handleConfirmQualityModal = () => {
    if (!activeGradeModal) return;

    setSelectedGrades((prev) => ({
      ...prev,
      [activeGradeModal.id]: {
        gradeId: activeGradeModal.id,
        gradeName: activeGradeModal.name,
        quality: tempQualityChoice,
        quantity: prev[activeGradeModal.id]?.quantity || 50,
      },
    }));

    setActiveGradeModal(null);
  };

  const handleRemoveGrade = (gradeId: string) => {
    setSelectedGrades((prev) => {
      const updated = { ...prev };
      delete updated[gradeId];
      return updated;
    });

    if (activeGradeModal?.id === gradeId) {
      setActiveGradeModal(null);
    }
  };

  const handleQuickToggleGrade = (grade: MakhanaGrade) => {
    if (selectedGrades[grade.id]) {
      handleRemoveGrade(grade.id);
    } else {
      handleOpenQualityModal(grade);
    }
  };

  const handleUpdateQuantity = (gradeId: string, quantity: number) => {
    const validQty = Math.max(1, Math.min(100000, Number(quantity) || 1));
    setSelectedGrades((prev) => {
      if (!prev[gradeId]) return prev;
      return {
        ...prev,
        [gradeId]: {
          ...prev[gradeId],
          quantity: validQty,
        },
      };
    });
  };

  const handleUpdateQualityInForm = (gradeId: string, quality: QualityOption) => {
    setSelectedGrades((prev) => {
      if (!prev[gradeId]) return prev;
      return {
        ...prev,
        [gradeId]: {
          ...prev[gradeId],
          quality,
        },
      };
    });
  };

  const selectedList = Object.values(selectedGrades);
  const selectedCount = selectedList.length;
  const totalQuantityKg = selectedList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Please provide your full name (at least 2 characters).';
    }

    const cleanPhone = formData.phone.replace(/[\s\-+()]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Please provide a valid 10-digit phone number.';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please provide a valid email address.';
      }
    }

    if (!formData.city.trim()) {
      errors.city = 'Please provide your destination city and state.';
    }

    if (selectedList.length === 0) {
      errors.grades = 'Please select at least one makhana grade and quality option.';
    }

    selectedList.forEach((item) => {
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors[`qty_${item.gradeId}`] = `Please enter a valid quantity for ${item.gradeName}.`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Bulk Enquiry
  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payloadItems = selectedList.map((item) => ({
      grade: item.gradeName,
      quality: item.quality,
      quantity: Number(item.quantity),
    }));

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
        city: formData.city.trim(),
        message: formData.message.trim(),
      });

      if (response && response.success) {
        const refId = response.enquiryId || `NE-BULK-${Date.now().toString().slice(-6)}`;
        setSubmittedRef(refId);
        setLastSubmittedPayload({
          refId,
          name: formData.name.trim(),
          businessName: formData.businessName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          city: formData.city.trim(),
          message: formData.message.trim(),
          items: payloadItems,
          totalQuantityKg,
        });

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

  const handleResetForm = () => {
    setFormData({
      name: '',
      businessName: '',
      phone: '',
      email: '',
      city: '',
      message: '',
    });
    setFormErrors({});
    setSubmitError(null);
    setSubmittedRef(null);
    setLastSubmittedPayload(null);
  };

  // WhatsApp link generator for the submitted selection
  const getWhatsAppEnquiryUrl = () => {
    const payload = lastSubmittedPayload || {
      name: formData.name,
      businessName: formData.businessName,
      city: formData.city,
      message: formData.message,
      items: selectedList.map((i) => ({
        grade: i.gradeName,
        quality: i.quality,
        quantity: i.quantity,
      })),
      totalQuantityKg,
    };

    const lines = [
      'Hi NYUTA ELITE MAKHANA, I would like to enquire about a bulk order:',
      ...payload.items.map(
        (i: any) => `• ${i.grade} — ${i.quality}: ${i.quantity} kg`
      ),
      `Total Bulk Volume: ${payload.totalQuantityKg} kg`,
      payload.name ? `Customer Name: ${payload.name}` : null,
      payload.businessName ? `Business Name: ${payload.businessName}` : null,
      payload.city ? `Delivery Location: ${payload.city}` : null,
      payload.message ? `Requirements: ${payload.message}` : null,
      'Please share wholesale pricing slabs and delivery schedule.',
    ].filter(Boolean);

    return `https://wa.me/916201426357?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <div className="bg-[#F7F4E8] min-h-screen text-[#123D2D] py-6 sm:py-10 lg:py-14">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-[#123D2D] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/bulk-order/qualities" className="text-[#123D2D] font-extrabold">
                Bulk Order
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#C9A65B] font-extrabold" aria-current="page">
              Explore Qualities
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#123D2D] text-[#C9A65B] border border-[#C9A65B]/40 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A65B]" />
            <span>MITHILA ORIGIN • HAND-SORTED GRADES</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#123D2D]">
            EXPLORE OUR MAKHANA QUALITIES
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-[#4A5D53] font-semibold leading-relaxed max-w-2xl mx-auto">
            Discover our carefully selected makhana grades and choose the right quality for your bulk requirements.
          </p>
        </div>

        {/* 4 Quality Cards Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
          {GRADES.map((grade) => {
            const currentSelection = selectedGrades[grade.id];
            const isSelected = Boolean(currentSelection);

            return (
              <div
                key={grade.id}
                data-testid={`quality-card-${grade.id}`}
                onClick={() => handleOpenQualityModal(grade)}
                className={`relative flex flex-col justify-between rounded-2xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-[#123D2D] ring-2 ring-[#C9A65B] shadow-md -translate-y-0.5'
                    : 'border-[#E8DECB] hover:border-[#C9A65B]/70'
                }`}
              >
                {/* Visual Status Indicator / Checkbox Control */}
                <div
                  className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickToggleGrade(grade);
                  }}
                  title={isSelected ? 'Click to deselect' : 'Click to select quality'}
                >
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1.5 bg-[#123D2D] text-[#C9A65B] border border-[#C9A65B] px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                      <Check className="w-3.5 h-3.5 text-[#C9A65B] stroke-[3]" />
                      <span className="font-bold hidden sm:inline">SELECTED</span>
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 border-[#D5DED6] bg-white/95 hover:border-[#123D2D] flex items-center justify-center transition-colors shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-transparent" />
                    </span>
                  )}
                </div>

                {/* Card Top: Image & Grade Visual Badge */}
                <div className="relative aspect-[4/3] w-full bg-[#FCFAF5] overflow-hidden border-b border-[#E8DECB]/60">
                  <img
                    src={grade.image}
                    alt={grade.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#123D2D]/90 text-[#F7F4E8] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs tracking-wider border border-[#C9A65B]/30">
                    Grade Visual
                  </div>
                </div>

                {/* Card Middle: Content & Typography */}
                <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h2 className="font-serif text-sm sm:text-base lg:text-lg font-bold text-[#123D2D] leading-snug">
                      {grade.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#4A5D53] font-normal sm:font-medium leading-relaxed line-clamp-3">
                      {grade.description}
                    </p>

                    {/* Selected Quality Indicator on the Card */}
                    {isSelected && (
                      <div className="pt-1.5">
                        <div className="inline-flex items-center gap-1.5 bg-[#F7F4E8] border border-[#C9A65B] px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-[#123D2D] shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A65B]" />
                          <span className="font-bold">Quality:</span>
                          <strong className="text-[#123D2D] font-bold uppercase tracking-wide">
                            {currentSelection.quality}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      data-testid={`select-grade-${grade.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenQualityModal(grade);
                      }}
                      className={`w-full min-h-10 sm:min-h-11 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'bg-[#123D2D] hover:bg-[#092218] text-[#C9A65B] border border-[#C9A65B]'
                          : 'bg-[#123D2D] hover:bg-[#092218] text-[#F7F4E8] hover:border hover:border-[#C9A65B]/60'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#C9A65B] stroke-[3]" />
                          <span className="font-bold">CHANGE QUALITY</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">SELECT QUALITY</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#C9A65B]" />
                        </>
                      )}
                    </button>

                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGrade(grade.id);
                        }}
                        className="w-full py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 hover:text-rose-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span className="font-bold">REMOVE</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-Select Items Summary & Floating Continuation Banner */}
        <div className="bg-white rounded-3xl border border-[#E8DECB] p-4 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F7F4E8] text-[#123D2D] border border-[#C9A65B]/50 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#123D2D]" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-[#123D2D]">
                    {selectedCount > 0 ? (
                      <span>
                        Selected Grades: <strong className="text-[#123D2D] font-extrabold">{selectedCount}</strong>{' '}
                        <span className="text-[#68756E] font-medium">({selectedCount} grade-quality combination{selectedCount > 1 ? 's' : ''})</span>
                      </span>
                    ) : (
                      <span className="text-[#68756E]">
                        Please select one or more makhana grades above to configure qualities
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-[11px] text-[#4A5D53]">
                  Direct Bihar pond procurement • Wholesale tiered rates • Pan-India freight dispatch
                </p>
              </div>
            </div>

            {/* Prominent Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(true)}
                disabled={selectedCount === 0}
                className="w-full sm:w-auto min-h-12 px-8 bg-[#C9A65B] hover:bg-[#b89549] active:bg-[#a6843c] text-[#123D2D] font-extrabold rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>SUBMIT BULK ENQUIRY</span>
                <ChevronRight className="w-4 h-4 text-[#123D2D] stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/bulk-order/enquiry')}
                disabled={selectedCount === 0}
                className="w-full sm:w-auto min-h-12 px-6 border border-[#123D2D] text-[#123D2D] hover:bg-[#F7F4E8] font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>CONTINUE TO ENQUIRY</span>
              </button>
            </div>
          </div>

          {/* Selected Grade-Quality Combinations Chips List */}
          {selectedCount > 0 && (
            <div className="pt-3 border-t border-[#E8DECB]/70 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#68756E] mr-1">
                Active Selection:
              </span>
              {selectedList.map((item) => (
                <div
                  key={item.gradeId}
                  className="inline-flex items-center gap-2 bg-[#F7F4E8] border border-[#C9A65B] px-3 py-1.5 rounded-full text-xs font-bold text-[#123D2D] shadow-2xs"
                >
                  <span>{item.gradeName}</span>
                  <span className="w-1 h-1 rounded-full bg-[#C9A65B]" />
                  <span className="text-[#123D2D] font-extrabold">{item.quality}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGrade(item.gradeId)}
                    title={`Remove ${item.gradeName}`}
                    className="p-0.5 rounded-full hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSelectedGrades({})}
                className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] hover:text-rose-700 ml-auto transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: TWO QUALITY OPTIONS SELECTOR (Option A vs Option B) */}
      {/* ============================================================== */}
      {activeGradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveGradeModal(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-[#FCFAF5] rounded-3xl border border-[#C9A65B] shadow-2xl overflow-hidden space-y-0">
            {/* Top Brand Bar */}
            <div className="h-2 w-full bg-[#123D2D]" />

            <div className="p-5 sm:p-7 space-y-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#C9A65B]">
                    <Sparkles className="w-3 h-3 text-[#C9A65B]" />
                    <span>Select Grade Quality</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#123D2D]">
                    {activeGradeModal.name}
                  </h3>
                  <p className="text-xs text-[#4A5D53]">
                    Choose the processing quality for this grade. You can choose different qualities for each grade independently.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGradeModal(null)}
                  className="p-2 text-[#68756E] hover:text-[#123D2D] rounded-full hover:bg-[#F7F1E5] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two Distinct Quality Options */}
              <div className="space-y-3.5">
                {/* OPTION A: HAND PICKED */}
                <div
                  onClick={() => setTempQualityChoice('Hand Picked')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    tempQualityChoice === 'Hand Picked'
                      ? 'bg-[#123D2D] text-white border-[#C9A65B] shadow-md'
                      : 'bg-white text-[#123D2D] border-[#E8DECB] hover:border-[#123D2D]/60'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      tempQualityChoice === 'Hand Picked'
                        ? 'border-[#C9A65B] bg-[#C9A65B]'
                        : 'border-[#68756E] bg-white'
                    }`}
                  >
                    {tempQualityChoice === 'Hand Picked' && (
                      <Check className="w-3.5 h-3.5 text-[#123D2D] stroke-[3]" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-base sm:text-lg font-bold">
                        Option A — Hand Picked
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          tempQualityChoice === 'Hand Picked'
                            ? 'bg-[#C9A65B] text-[#123D2D] border-[#C9A65B]'
                            : 'bg-[#F7F4E8] text-[#123D2D] border-[#C9A65B]/40'
                        }`}
                      >
                        Premium
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        tempQualityChoice === 'Hand Picked' ? 'text-[#D5DED6]' : 'text-[#68756E]'
                      }`}
                    >
                      Manually inspected and sorted for uniform diameter, bright white kernel expansion, and zero defective seeds. Best for premium gifting and boutique snack lines.
                    </p>
                  </div>
                </div>

                {/* OPTION B: NORMAL */}
                <div
                  onClick={() => setTempQualityChoice('Normal')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    tempQualityChoice === 'Normal'
                      ? 'bg-[#123D2D] text-white border-[#C9A65B] shadow-md'
                      : 'bg-white text-[#123D2D] border-[#E8DECB] hover:border-[#123D2D]/60'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      tempQualityChoice === 'Normal'
                        ? 'border-[#C9A65B] bg-[#C9A65B]'
                        : 'border-[#68756E] bg-white'
                    }`}
                  >
                    {tempQualityChoice === 'Normal' && (
                      <Check className="w-3.5 h-3.5 text-[#123D2D] stroke-[3]" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-base sm:text-lg font-bold">
                        Option B — Normal
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          tempQualityChoice === 'Normal'
                            ? 'bg-[#C9A65B] text-[#123D2D] border-[#C9A65B]'
                            : 'bg-[#F7F4E8] text-[#123D2D] border-[#C9A65B]/40'
                        }`}
                      >
                        Standard
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        tempQualityChoice === 'Normal' ? 'text-[#D5DED6]' : 'text-[#68756E]'
                      }`}
                    >
                      Standard machine-graded commercial quality. Natural flavor and crispness, ideal for high-volume roasting, flavoring, and daily retail supply.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmQualityModal}
                  className="w-full sm:flex-1 min-h-11 bg-[#123D2D] hover:bg-[#092218] text-[#C9A65B] border border-[#C9A65B] font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#C9A65B] stroke-[3]" />
                  <span>CONFIRM SELECTION</span>
                </button>

                {selectedGrades[activeGradeModal.id] && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGrade(activeGradeModal.id)}
                    className="w-full sm:w-auto px-4 min-h-11 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Remove Grade
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveGradeModal(null)}
                  className="w-full sm:w-auto px-4 min-h-11 text-[#68756E] hover:text-[#123D2D] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CUSTOMER-FRIENDLY BULK ENQUIRY FORM */}
      {/* ============================================================== */}
      {isEnquiryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsEnquiryModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-[#FCFAF5] rounded-3xl border border-[#C9A65B] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Top Brand Bar */}
            <div className="h-2 w-full bg-[#123D2D] shrink-0" />

            <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#68756E] hover:text-[#123D2D] hover:bg-[#F7F1E5] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {submittedRef ? (
                /* SUCCESS STATE */
                <div className="py-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-[#123D2D] text-[#C9A65B] border-2 border-[#C9A65B] mx-auto flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-10 h-10 text-[#C9A65B]" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C9A65B]">
                      ENQUIRY CONFIRMED
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D2D]">
                      Thank you for your enquiry!
                    </h3>
                    <p className="text-sm font-semibold text-[#4A5D53]">
                      Our team will contact you with bulk pricing and availability.
                    </p>
                    <div className="inline-block bg-[#F7F4E8] border border-[#C9A65B] px-4 py-1.5 rounded-full text-xs font-mono font-bold text-[#123D2D] mt-2">
                      Ref ID: {submittedRef}
                    </div>
                  </div>

                  {/* Summary of submitted choices */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E8DECB] text-xs text-[#123D2D] space-y-2 max-w-md mx-auto text-left shadow-2xs">
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
                    <div className="pt-2 border-t border-[#E8DECB]/70 space-y-1">
                      <strong className="block text-[11px] uppercase tracking-wider text-[#68756E]">
                        Selected Grade Items:
                      </strong>
                      {selectedList.map((item) => (
                        <div key={item.gradeId} className="flex justify-between items-center text-xs">
                          <span>
                            {item.gradeName} <span className="font-extrabold text-[#C9A65B]">({item.quality})</span>
                          </span>
                          <span className="font-bold">{item.quantity} kg</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center font-bold text-sm pt-1 border-t border-[#E8DECB]/40">
                        <span>Total Quantity:</span>
                        <span className="text-[#123D2D]">{totalQuantityKg} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
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
                      onClick={() => {
                        handleResetForm();
                        setIsEnquiryModalOpen(false);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#123D2D] text-[#123D2D] hover:bg-[#F7F4E8] px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ENQUIRY FORM */
                <form onSubmit={handleSubmitEnquiry} noValidate className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#C9A65B] mb-1">
                      <Package className="w-3.5 h-3.5 text-[#C9A65B]" />
                      <span>WHOLESALE COMMERCE DESK</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D2D]">
                      Bulk Order Enquiry Form
                    </h2>
                    <p className="text-xs text-[#4A5D53] mt-1">
                      Verify your selected grades, enter required quantities and destination details for immediate freight and slab quotation.
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* SECTION 1: Selected Grades & Individual Quantities */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#123D2D]">
                        1. Selected Grades &amp; Quantities ({selectedCount} item{selectedCount > 1 ? 's' : ''})
                      </span>
                      <span className="text-xs font-bold text-[#123D2D]">
                        Total: <strong className="text-[#C9A65B]">{totalQuantityKg} kg</strong>
                      </span>
                    </div>

                    {selectedList.length === 0 ? (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
                        No grades selected. Please close this form and choose at least one makhana grade.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedList.map((item) => (
                          <div
                            key={item.gradeId}
                            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <h4 className="font-serif text-sm sm:text-base font-bold text-[#123D2D]">
                                  {item.gradeName}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#68756E] uppercase font-bold">Quality:</span>
                                  {/* Segmented Quality Switcher inside the form */}
                                  <div className="inline-flex rounded-lg border border-[#E8DECB] p-0.5 bg-[#FCFAF5]">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQualityInForm(item.gradeId, 'Hand Picked')}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                                        item.quality === 'Hand Picked'
                                          ? 'bg-[#123D2D] text-[#C9A65B]'
                                          : 'text-[#68756E] hover:text-[#123D2D]'
                                      }`}
                                    >
                                      Hand Picked
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQualityInForm(item.gradeId, 'Normal')}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                                        item.quality === 'Normal'
                                          ? 'bg-[#123D2D] text-[#C9A65B]'
                                          : 'text-[#68756E] hover:text-[#123D2D]'
                                      }`}
                                    >
                                      Normal
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveGrade(item.gradeId)}
                                className="self-start sm:self-auto text-rose-600 hover:text-rose-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>

                            {/* Quantity Input for this item */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100000"
                                    step="1"
                                    value={item.quantity || ''}
                                    onChange={(e) => handleUpdateQuantity(item.gradeId, Number(e.target.value))}
                                    placeholder="Quantity in kg"
                                    className="w-full min-h-10 px-3 pr-10 rounded-xl border border-[#E8DECB] text-xs text-[#123D2D] font-bold focus:outline-none focus:border-[#123D2D]"
                                  />
                                  <span className="absolute right-3 top-2.5 text-xs text-[#68756E] font-bold">
                                    kg
                                  </span>
                                </div>

                                {/* Preset chips */}
                                <div className="hidden sm:flex items-center gap-1">
                                  {QUANTITY_PRESETS.slice(0, 4).map((qty) => (
                                    <button
                                      key={qty}
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.gradeId, qty)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                        item.quantity === qty
                                          ? 'bg-[#123D2D] text-[#C9A65B] border-[#123D2D]'
                                          : 'bg-[#F7F4E8] text-[#123D2D] border-[#E8DECB] hover:border-[#123D2D]'
                                      }`}
                                    >
                                      {qty} kg
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {formErrors[`qty_${item.gradeId}`] && (
                                <p className="text-[11px] text-rose-600">
                                  {formErrors[`qty_${item.gradeId}`]}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: Customer Contact Details */}
                  <div className="space-y-4 pt-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#123D2D] block">
                      2. Contact &amp; Delivery Information
                    </span>

                    {/* Name & Business Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123D2D] mb-1">
                          Full Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Kumar"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                          }}
                          className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#123D2D] focus:outline-none transition-colors ${
                            formErrors.name ? 'border-rose-500 bg-rose-50/40' : 'border-[#E8DECB] focus:border-[#123D2D]'
                          }`}
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.name}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123D2D] mb-1">
                          Business / Company <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mithila Organic Stores"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full min-h-11 px-3.5 rounded-xl border border-[#E8DECB] text-xs text-[#123D2D] focus:outline-none focus:border-[#123D2D]"
                        />
                      </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123D2D] mb-1">
                          Mobile Number <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                          }}
                          className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#123D2D] focus:outline-none transition-colors ${
                            formErrors.phone ? 'border-rose-500 bg-rose-50/40' : 'border-[#E8DECB] focus:border-[#123D2D]'
                          }`}
                        />
                        {formErrors.phone && (
                          <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.phone}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123D2D] mb-1">
                          Email Address <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="name@business.com"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                          }}
                          className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#123D2D] focus:outline-none transition-colors ${
                            formErrors.email ? 'border-rose-500 bg-rose-50/40' : 'border-[#E8DECB] focus:border-[#123D2D]'
                          }`}
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delivery City */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#123D2D] mb-1">
                        Delivery City &amp; State <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai, Maharashtra (Pincode 400001)"
                        value={formData.city}
                        onChange={(e) => {
                          setFormData({ ...formData, city: e.target.value });
                          if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                        }}
                        className={`w-full min-h-11 px-3.5 rounded-xl border text-xs text-[#123D2D] focus:outline-none transition-colors ${
                          formErrors.city ? 'border-rose-500 bg-rose-50/40' : 'border-[#E8DECB] focus:border-[#123D2D]'
                        }`}
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.city}</span>
                        </p>
                      )}
                    </div>

                    {/* Additional Requirements */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#123D2D] mb-1">
                        Additional Requirements <span className="text-[#68756E] text-[10px] font-normal lowercase">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Mention any custom packaging preferences, expected delivery schedule, or sample requirements..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DECB] text-xs text-[#123D2D] focus:outline-none focus:border-[#123D2D]"
                      />
                    </div>
                  </div>

                  {/* Primary Submit Button */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedCount === 0}
                      className="w-full min-h-12 bg-[#123D2D] hover:bg-[#092218] active:bg-black text-[#C9A65B] border border-[#C9A65B] rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Submitting Bulk Enquiry...' : 'SUBMIT BULK ENQUIRY'}</span>
                      <ArrowRight className="w-4 h-4 text-[#C9A65B]" />
                    </button>

                    <p className="text-[11px] text-[#68756E] text-center">
                      🔒 Direct pond pricing without intermediate dealer markup. Tax invoice provided.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOrderQualities;
