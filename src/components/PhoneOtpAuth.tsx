import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authService } from '../services/auth';
import { ApiError } from '../services/api';
import { trackLogin, trackSignUp } from '../services/analytics';
import type { User } from '../types';

interface PhoneOtpAuthProps {
  mode?: 'login' | 'register';
  onSuccess?: (user: User, isNewUser: boolean) => void;
  className?: string;
}

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)', flag: '🇮🇳', placeholder: '98765 43210' },
  { code: '+1', label: 'USA / Canada (+1)', flag: '🇺🇸', placeholder: '555 123 4567' },
  { code: '+44', label: 'UK (+44)', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: '+971', label: 'UAE (+971)', flag: '🇦🇪', placeholder: '50 123 4567' },
  { code: '+65', label: 'Singapore (+65)', flag: '🇸🇬', placeholder: '8123 4567' },
];

export const PhoneOtpAuth: React.FC<PhoneOtpAuthProps> = ({
  mode = 'login',
  onSuccess,
  className = '',
}) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  // 6 separate digits for the OTP input
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const validatePhone = (num: string): string | null => {
    const clean = num.replace(/\D/g, '');
    if (!clean) return 'Please enter your mobile phone number.';
    if (countryCode === '+91') {
      if (clean.length !== 10) {
        return 'Please enter a 10-digit Indian mobile number.';
      }
      if (!/^[6-9]/.test(clean)) {
        return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
      }
    } else {
      if (clean.length < 7 || clean.length > 15) {
        return 'Please enter a valid mobile number.';
      }
    }
    return null;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const validationError = validatePhone(phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      const res = await authService.requestOtp(cleanDigits, countryCode);
      setMaskedPhone(res.phone);
      setFormattedPhone(res.formatted || `${countryCode} ${cleanDigits}`);
      setCooldown(res.cooldownSeconds || 60);
      setStep('OTP');
      setOtpDigits(['', '', '', '', '', '']);
      // Focus first OTP input after switching step
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to request OTP');
        if (err.status === 429 && (err as any).data?.retryAfter) {
          setCooldown((err as any).data.retryAfter);
        }
      } else {
        setError(err?.message || 'Failed to send OTP. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    setError('');
    // Handle pasting full 6-digit OTP
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || '';
        }
        setOtpDigits(nextDigits);
        const focusIdx = Math.min(pasted.length, 5);
        otpInputsRef.current[focusIdx]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, '').slice(0, 1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    // Auto advance focus to next input
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      const res = await authService.verifyOtp(cleanDigits, fullOtp, countryCode);

      if (res.isNewUser) {
        trackSignUp('otp');
        setSuccessMsg('Account created successfully! Welcome to NYUTA ELITE.');
      } else {
        trackLogin('otp');
        setSuccessMsg('Verified successfully! Logging you in...');
      }

      setTimeout(() => {
        onSuccess?.(res.user, res.isNewUser);
      }, 700);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Incorrect verification code');
      } else {
        setError(err?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200 leading-snug">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#092218] mb-1.5 uppercase tracking-wide">
              Mobile Number
            </label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <div className="relative w-[110px] shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setError('');
                  }}
                  className="w-full h-11 px-2.5 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#123B2A] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] cursor-pointer appearance-none text-center"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#68756E] text-[10px]">
                  ▼
                </div>
              </div>

              {/* Phone Input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError('');
                  }}
                  placeholder={
                    COUNTRY_CODES.find((c) => c.code === countryCode)?.placeholder || 'Enter mobile'
                  }
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E8DECB] bg-white text-xs font-medium text-[#092218] placeholder-[#A2ADA7] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B]"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-[#68756E] mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>We will send a 6-digit verification code via SMS</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>{mode === 'register' ? 'Register with OTP' : 'Send OTP'}</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* OTP Verification Step */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-[#FCFAF5] p-3.5 rounded-xl border border-[#E8DECB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F7F1E5] flex items-center justify-center text-[#123B2A]">
                <Smartphone className="w-4 h-4 text-[#C6A15B]" />
              </div>
              <div>
                <p className="text-[11px] text-[#68756E]">Code sent to</p>
                <p className="text-xs font-bold text-[#092218]">{formattedPhone || maskedPhone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('PHONE');
                setError('');
              }}
              className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#092218] mb-2 uppercase tracking-wide text-center">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[#E8DECB] bg-white text-[#092218] focus:outline-none focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/20"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6}
            className="w-full py-3.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>
                {mode === 'register' ? 'Verify & Create Account' : 'Verify & Continue'}
              </span>
            )}
          </button>

          {/* Resend OTP Action */}
          <div className="text-center pt-2">
            {cooldown > 0 ? (
              <p className="text-xs text-[#68756E] font-medium">
                Resend code in <span className="font-bold text-[#123B2A]">{cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
