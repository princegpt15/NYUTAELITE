// src/components/admin/AdminProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { authService } from '../../services/auth';
import type { User } from '../../types';

interface AdminProtectedRouteProps {
  children?: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        let activeUser = authService.getCurrentUser();
        if (!activeUser) {
          activeUser = await authService.restoreSession();
        }
        if (isMounted) {
          setUser(activeUser);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const unsubscribe = authService.subscribe((updatedUser) => {
      if (isMounted) {
        setUser(updatedUser);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#092218] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#C6A15B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8DECB]">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> redirect to /admin/login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  // Authenticated CUSTOMER -> Show clean Access Denied UX
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl border border-[#E8DECB] shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
              RESTRICTED ACCESS
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
              Admin Access Required
            </h1>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Your account (<span className="font-semibold text-[#1C1C1C]">{user.email}</span>) does not have administrative privileges for the NYUTA ELITE pantry operations dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              to="/admin/login"
              onClick={() => authService.logout()}
              className="inline-flex items-center justify-center gap-2 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#C6A15B]" />
              Sign in with Admin Account
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 border border-[#E8DECB] hover:bg-[#F7F1E5] text-[#1C1C1C] text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#123B2A]" />
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated ADMIN -> Render outlet/children
  return children ? <>{children}</> : <Outlet />;
};
