import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { authService } from '../services/auth';
import { ApiError } from '../services/api';
import { trackSignUp } from '../services/analytics';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      errs.agreeTerms = 'You must agree to the Terms of Service & Privacy Policy';
    }

    return errs;
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        await authService.register({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        trackSignUp('email');
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message || 'Registration failed');
        } else {
          setError('Registration failed');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-[480px] bg-white rounded-2xl p-6 sm:p-10 border border-[#E8DECB] shadow-sm">
        {success ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#123B2A] text-[#C6A15B] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#092218]">Account Created!</h3>
            <p className="text-xs sm:text-sm text-[#68756E]">
              Welcome to NYUTA ELITE MAKHANA. Redirecting to home...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
                JOIN NYUTA ELITE
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-1 mb-1">
                Create Your Account
              </h1>
              <p className="text-xs text-[#68756E]">
                Enjoy fast checkout and order tracking for your makhana purchases
              </p>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Full Name *"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={errors.fullName}
                required
              />

              <FormInput
                label="Email Address *"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                required
              />

              <FormInput
                label="Phone Number *"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={errors.phone}
                required
              />

              <FormInput
                label="Password *"
                isPassword
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                required
              />

              <FormInput
                label="Confirm Password *"
                isPassword
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                required
              />

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E8DECB] text-[#123B2A] focus:ring-[#123B2A] cursor-pointer"
                  />
                  <span className="text-xs text-[#68756E] leading-snug">
                    I agree to the{' '}
                    <Link to="/about#terms" className="text-[#123B2A] font-bold hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/about#privacy" className="text-[#123B2A] font-bold hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {errors.agreeTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-[#68756E]">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#123B2A] font-bold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
