import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import regBgImg from '../assets/images/reg-panel-bg.png';
import regTabBanner from '../assets/images/reg-tab-banner.png';
import { FormInput } from '../components/FormInput';
import { authService } from '../services/auth';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gstNumber: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Please enter your full name';
    }

    if (!formData.email.trim()) {
      errs.email = 'Please enter a valid email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Please enter your contact phone number';
    } else if (!/^(?:\+91|0)?[6-9]\d{9}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit Indian phone number';
    }

    if (!formData.password) {
      errs.password = 'Password is required (min. 8 characters)';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms & Conditions and Privacy Policy';
    }

    return errs;
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (hasSubmitted) {
      const updated = { ...formData, [field]: value };
      const errs: Record<string, string> = {};
      if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
        errs.email = 'Please enter a valid email address';
      }
      if (
        (field === 'password' || field === 'confirmPassword') &&
        updated.password !== updated.confirmPassword
      ) {
        errs.confirmPassword = 'Passwords do not match';
      }
      setErrors((prev) => ({ ...prev, ...errs, [field]: errs[field] || '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      authService.register({
        fullName: formData.fullName,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        gstNumber: formData.gstNumber,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/products/premium-makhana');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] flex flex-col justify-start">
      {/* Mobile Back Header Bar */}
      <div className="lg:hidden bg-white border-b border-[#E6DFD3] px-4 py-2.5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C2520] hover:text-[#00C950]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs font-bold text-[#C89B3C]">B2B REGISTRATION</span>
      </div>

      {/* TABLET BANNER (visible only on md:block lg:hidden) */}
      <div className="hidden md:block lg:hidden relative bg-[#173F35] overflow-hidden">
        <img
          src={regTabBanner}
          alt="NYUTAELITE wholesale network banner"
          className="w-full h-44 object-cover object-center opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 p-8 flex flex-col justify-center text-white">
          <h2 className="text-xl sm:text-2xl font-bold max-w-xl leading-tight">
            Trusted by wholesalers, retailers and food businesses across India.
          </h2>
          <p className="text-xs text-[#A5BDB5] mt-1.5 max-w-lg">
            Join a growing network of businesses who source premium makhana directly from us.
          </p>
          <span className="text-[10px] text-white/50 mt-2">
            Photo by Mette van der Linden on Unsplash
          </span>
        </div>
      </div>

      {/* DESKTOP SPLIT CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-68px)]">
        {/* LEFT COLUMN: Visual Dark Green Panel (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#173F35] text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={regBgImg}
              alt="Makhana background texture"
              className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102B24] via-[#173F35]/90 to-[#173F35]/70" />
          </div>

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D8A62A] flex items-center justify-center p-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#173F35]">
                <path
                  d="M12 3C12 3 13.5 7.5 17.5 9C21.5 10.5 23 14 23 14C23 14 18.5 15.5 17 19.5C15.5 23.5 12 25 12 25C12 25 10.5 20.5 6.5 19C2.5 17.5 1 14 1 14C1 14 5.5 12.5 7 8.5C8.5 4.5 12 3 12 3Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">NYUTAELITE</span>
          </div>

          {/* Center Content */}
          <div className="relative z-10 space-y-4 my-auto py-12">
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-snug tracking-tight text-white">
              Trusted by wholesalers, retailers and food businesses across India.
            </h2>
            <p className="text-sm xl:text-base text-[#A5BDB5] leading-relaxed max-w-md">
              Join a growing network of businesses who source premium makhana directly from us.
            </p>
          </div>

          {/* Bottom Photo Credit */}
          <div className="relative z-10 text-xs text-white/50">
            Photo by Mette van der Linden on Unsplash
          </div>
        </div>

        {/* RIGHT COLUMN: Registration Form Card */}
        <div className="lg:col-span-7 flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16">
          <div className="w-full max-w-[540px] bg-white rounded-3xl p-6 sm:p-10 border border-[#E6DFD3] shadow-md my-4">
            {success ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-[#00C950]/15 text-[#00C950] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2520]">Account Created!</h3>
                <p className="text-sm text-[#5E6C65] max-w-sm mx-auto">
                  Welcome to NYUTAELITE Wholesale. Redirecting you to bulk product ordering...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
                    GET STARTED
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C2520] tracking-tight mt-1 mb-2">
                    Create Your Account
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5E6C65]">
                    Join our wholesale platform and start ordering premium makhana in bulk.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    error={errors.fullName}
                    required
                  />

                  <FormInput
                    label="Business Name"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    helperText="Optional for individual buyers"
                  />

                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="you@business.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                    required
                  />

                  <FormInput
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    required
                  />

                  <FormInput
                    label="Password"
                    isPassword
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    error={errors.password}
                    required
                  />

                  <FormInput
                    label="Confirm Password"
                    isPassword
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                    required
                  />

                  <FormInput
                    label="GST Number (optional)"
                    placeholder="Enter GST number (optional)"
                    value={formData.gstNumber}
                    onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                    helperText="Required only for businesses claiming input tax credit"
                  />

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-[#E6DFD3] text-[#00C950] focus:ring-[#00C950] cursor-pointer"
                      />
                      <span className="text-xs text-[#5E6C65] leading-snug">
                        I agree to the{' '}
                        <Link to="/about#terms" className="text-[#C89B3C] font-medium hover:underline">
                          Terms & Conditions
                        </Link>{' '}
                        and{' '}
                        <Link to="/about#privacy" className="text-[#C89B3C] font-medium hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">
                        {errors.agreeTerms}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 sm:py-4 rounded-xl bg-[#173F35] hover:bg-[#112F28] text-white font-bold text-sm sm:text-base transition-all shadow-sm cursor-pointer mt-2"
                  >
                    Create Account
                  </button>

                  {/* Already have an account */}
                  <div className="text-center pt-2">
                    <p className="text-xs sm:text-sm text-[#5E6C65]">
                      Already have an account?{' '}
                      <Link to="/login" className="text-[#C89B3C] font-bold hover:underline">
                        Log in
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
