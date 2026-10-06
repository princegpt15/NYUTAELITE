// src/components/admin/AdminHeader.tsx
import React from 'react';
import { Menu, LogOut, ExternalLink, Shield } from 'lucide-react';
import { authService } from '../../services/auth';
import type { User } from '../../types';

interface AdminHeaderProps {
  currentUser: User | null;
  onMenuToggle: () => void;
  title?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ currentUser, onMenuToggle, title }) => {
  return (
    <header className="bg-white border-b border-[#E8DECB] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open sidebar navigation"
          className="lg:hidden p-2 text-[#123B2A] hover:bg-[#F7F1E5] rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
              PANTRY DASHBOARD
            </span>
          </div>
          <h1 className="font-serif text-lg sm:text-xl font-bold text-[#092218]">
            {title || 'Overview & Metrics'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Storefront Link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#F7F1E5] text-xs font-bold text-[#123B2A] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Live Store</span>
        </a>

        {/* Admin Badge */}
        {currentUser && (
          <div className="flex items-center gap-2 bg-[#F7F1E5] border border-[#E8DECB] px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-[#123B2A] text-[#C6A15B] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-[#092218] block leading-none">
                {currentUser.fullName || currentUser.email.split('@')[0]}
              </span>
              <span className="text-[9px] font-extrabold text-[#C6A15B] uppercase tracking-wider block mt-0.5">
                ADMIN
              </span>
            </div>
          </div>
        )}

        {/* Quick Logout */}
        <button
          type="button"
          onClick={() => authService.logout()}
          title="Sign Out"
          aria-label="Sign out of admin"
          className="p-2 text-[#68756E] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
