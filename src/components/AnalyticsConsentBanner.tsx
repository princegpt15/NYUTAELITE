// src/components/AnalyticsConsentBanner.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import {
  getAnalyticsConsent,
  grantAnalyticsConsent,
  denyAnalyticsConsent,
  subscribeAnalyticsConsent,
  type AnalyticsConsentState,
} from '../services/analytics';

/**
 * Privacy-conscious, non-deceptive analytics consent banner.
 * Analytics remains disabled until the visitor explicitly chooses "Allow Analytics".
 */
export const AnalyticsConsentBanner: React.FC = () => {
  const [consentState, setConsentState] = useState<AnalyticsConsentState>(() =>
    getAnalyticsConsent()
  );

  useEffect(() => {
    return subscribeAnalyticsConsent(setConsentState);
  }, []);

  if (consentState !== 'unset') {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Analytics privacy preference"
      className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none"
    >
      <div className="max-w-[1120px] mx-auto bg-[#FCFAF5] border-2 border-[#123B2A] rounded-2xl shadow-xl p-4 sm:p-5 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#123B2A] text-[#C6A15B] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs text-[#1C1C1C]">
            <p className="font-bold text-[#092218] text-xs sm:text-sm">
              Privacy-Conscious Storefront Analytics
            </p>
            <p className="text-[#68756E] leading-relaxed max-w-2xl">
              We use optional Google Analytics 4 measurement to understand which Bihar makhana packs visitors explore and to improve our storefront. We never share personal delivery addresses, phone numbers, or payment credentials with analytics. Read our{' '}
              <Link
                to="/about#privacy"
                className="font-bold text-[#123B2A] underline hover:text-[#092218]"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={denyAnalyticsConsent}
            className="flex-1 md:flex-initial min-h-10 px-4 py-2 rounded-xl border border-[#123B2A] bg-white hover:bg-[#F7F1E5] text-[#123B2A] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Decline Analytics
          </button>
          <button
            type="button"
            onClick={grantAnalyticsConsent}
            className="flex-1 md:flex-initial min-h-10 px-4 py-2 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Allow Analytics
          </button>
        </div>
      </div>
    </aside>
  );
};
