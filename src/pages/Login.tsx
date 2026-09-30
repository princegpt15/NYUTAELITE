import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { authService } from '../services/auth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      authService.login(email);
      setLoading(false);
      navigate('/products/premium-makhana');
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#F7F2E8] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-10 border border-[#E6DFD3] shadow-md">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#00C950]/10 text-[#00C950] mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
            WHOLESALE PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C2520] tracking-tight mt-1 mb-1">
            Sign In to Your Account
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6C65]">
            Access your B2B wholesale pricing and orders
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="you@business.com"
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

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[#5E6C65]">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-[#E6DFD3] text-[#00C950] focus:ring-[#00C950]"
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="text-[#C89B3C] font-semibold hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#173F35] hover:bg-[#112F28] text-white font-bold text-sm sm:text-base transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="text-center pt-6 mt-6 border-t border-[#E6DFD3]/60">
          <p className="text-xs sm:text-sm text-[#5E6C65]">
            Don't have a wholesale account?{' '}
            <Link to="/register" className="text-[#C89B3C] font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
