import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Globe, MessageSquare, ArrowRight, Sparkles, Check } from 'lucide-react';

interface BulkOrderChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkOrderChoiceModal: React.FC<BulkOrderChoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Business WhatsApp Number resolution:
  // Reads VITE_WHATSAPP_NUMBER if configured, otherwise falls back to the official number (+91 6201426357)
  const rawNumber = (
    (import.meta as any).env?.VITE_WHATSAPP_NUMBER || '6201426357'
  )
    .toString()
    .replace(/[^\d]/g, '');

  const businessPhone =
    rawNumber.length === 10 ? `91${rawNumber}` : rawNumber;

  const defaultMessage =
    'Hello NYUTA ELITE MAKHANA, I am interested in placing a bulk order. Please share your bulk pricing, minimum order quantity, available pack sizes, and delivery details.';

  const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on open
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleContinueOnWebsite = () => {
    onClose();
    navigate('/bulk-order');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-modal-title"
      aria-describedby="bulk-modal-desc"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-[#FCFAF5] rounded-3xl border border-[#E8DECB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Brand Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#123B2A] via-[#C6A15B] to-[#123B2A]" />

        {/* Modal Close Button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-[#68756E] hover:text-[#123B2A] hover:bg-[#F7F1E5] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 md:p-10 space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-[#F7F1E5] border border-[#C6A15B]/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#123B2A]">
              <Sparkles className="w-3 h-3 text-[#C6A15B]" />
              <span>WHOLESALE &amp; LARGE ORDERS</span>
            </div>
            <h2
              id="bulk-modal-title"
              className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A] leading-tight"
            >
              Bulk Order — Choose Your Preferred Method
            </h2>
            <p
              id="bulk-modal-desc"
              className="text-xs sm:text-sm text-[#68756E] leading-relaxed"
            >
              Choose how you would like to place your bulk order with NYUTA ELITE MAKHANA.
            </p>
          </div>

          {/* Two Clear Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
            {/* OPTION A: Continue Through Website */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DECB] shadow-xs hover:border-[#123B2A] transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/40 group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6 text-[#123B2A]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#123B2A]">
                    Continue on Website
                  </h3>
                  <p className="text-xs text-[#68756E] mt-1 leading-relaxed">
                    Browse all 6 makhana variants online, explore pack options, or submit a formal quantity-based bulk enquiry.
                  </p>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#1C1C1C] pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                    <span>Premium &amp; Regular grades (100g, 200g, 250g)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                    <span>Submit requirements &amp; track reference ID</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                    <span>Preserves cart &amp; standard checkout</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleContinueOnWebsite}
                className="w-full min-h-11 bg-[#123B2A] hover:bg-[#092218] active:bg-black text-[#FCFAF5] rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#C6A15B] cursor-pointer"
              >
                <span>Continue on Website</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A15B]" />
              </button>
            </div>

            {/* OPTION B: Order Through WhatsApp */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DECB] shadow-xs hover:border-[#25D366] transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/30 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#123B2A]">
                    Order via WhatsApp
                  </h3>
                  <p className="text-xs text-[#68756E] mt-1 leading-relaxed">
                    Chat directly with the official NYUTA ELITE trade desk for custom rates, dispatch timelines, and MOQ details.
                  </p>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#1C1C1C] pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>Direct chat with Mithila sales coordinator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>Instant slab quotes &amp; sample requests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>Pre-filled enquiry ready to send</span>
                  </li>
                </ul>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full min-h-11 bg-[#25D366] hover:bg-[#1EBE5D] active:bg-[#168E46] text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#25D366] cursor-pointer"
              >
                <span>Order via WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
          </div>

          {/* Footer Assistance Note */}
          <div className="pt-2 text-center text-[11px] text-[#68756E] border-t border-[#E8DECB]/60">
            <span>
              Helpline: <strong>+91 98765 43210</strong> (Mon – Sat, 9:00 AM – 7:00 PM IST) • Pan-India Freight
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
