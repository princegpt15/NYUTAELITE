// src/pages/admin/AdminLogin.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { FormInput } from '../../components/FormInput';
import { authService } from '../../services/auth';
import { ApiError } from '../../services/api';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fromPath = (location.state as any)?.from || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await authService.login(email, password);
      if (user.role === 'ADMIN') {
        navigate(fromPath, { replace: true });
      } else {
        setError('Admin access required. This account does not have administrator privileges.');
        await authService.logout();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid email or password.');
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#092218] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-white rounded-2xl p-7 sm:p-10 border border-[#C6A15B]/30 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#092218] text-[#C6A15B] mx-auto flex items-center justify-center border border-[#C6A15B]/40 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase block">
              NYUTA ELITE OPERATIONS
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-1">
              Admin Portal
            </h1>
          </div>
          <p className="text-xs text-[#68756E]">
            Secure authentication for authorized staff &amp; pantry administrators
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2.5"
          >
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <FormInput
            label="Admin Email Address"
            type="email"
            placeholder="admin@nutyaelite.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
            autoFocus
          />

          <FormInput
            label="Master Password"
            isPassword
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="pt-4 border-t border-[#E8DECB] text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123B2A] hover:text-[#092218] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
