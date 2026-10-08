import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { authService } from '../services/auth';
import { ApiError } from '../services/api';
import { trackLogin } from '../services/analytics';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email.trim() || !password.trim()) {
    setError('Please enter both your email and password.');
    return;
  }
  setLoading(true);
  try {
    await authService.login(email, password);
    trackLogin('email');
    navigate('/');
  } catch (err) {
    if (err instanceof ApiError) {
      setError(err.message || 'Login failed');
    } else {
      setError('Login failed');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-[440px] bg-white rounded-2xl p-6 sm:p-10 border border-[#E8DECB] shadow-sm">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F7F1E5] text-[#123B2A] mx-auto flex items-center justify-center mb-3 border border-[#E8DECB]">
            <Lock className="w-6 h-6 text-[#C6A15B]" />
          </div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
            NYUTA ELITE PANTRY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-1 mb-1">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-[#68756E]">
            Access your makhana order history &amp; track shipments
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
          />

          <FormInput
            label="Password"
            isPassword
            placeholder="••••••••"
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
            className="w-full py-3.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest transition-colors shadow-xs cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-6 mt-6 border-t border-[#E8DECB]">
          <p className="text-xs text-[#68756E]">
            Don't have a pantry account?{' '}
            <Link to="/register" className="text-[#123B2A] font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
