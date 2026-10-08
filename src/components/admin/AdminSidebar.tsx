// src/components/admin/AdminSidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Boxes,
  Users,
  CreditCard,
  TicketPercent,
  Bell,
  Activity,
  LogOut,
  ExternalLink,
  X,
  Star,
  Megaphone,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';
import { authService } from '../../services/auth';
import type { User } from '../../types';

interface AdminSidebarProps {
  currentUser: User | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentUser, isOpen = false, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, end: false },
    { label: 'Growth & Funnels', path: '/admin/growth-analytics', icon: TrendingUp, end: false },
    { label: 'Experiments', path: '/admin/experiments', icon: FlaskConical, end: false },
    { label: 'Campaigns & CRM', path: '/admin/campaigns', icon: Megaphone, end: false },
    { label: 'System Health', path: '/admin/system-health', icon: Activity, end: false },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag, end: false },
    { label: 'Products', path: '/admin/products', icon: Boxes, end: false },
    { label: 'Reviews', path: '/admin/reviews', icon: Star, end: false },
    { label: 'Coupons', path: '/admin/coupons', icon: TicketPercent, end: false },
    { label: 'Customers', path: '/admin/customers', icon: Users, end: false },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard, end: false },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell, end: false },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#092218] text-white border-r border-[#123B2A] select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#123B2A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#123B2A] border border-[#C6A15B]/40 flex items-center justify-center text-[#C6A15B] font-serif font-black text-lg">
            N
          </div>
          <div>
            <span className="text-[9px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase block">
              OPERATIONS
            </span>
            <span className="font-serif text-base font-bold text-[#FCFAF5] block tracking-wide">
              NYUTA ELITE
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 text-[#E8DECB] hover:text-white rounded-lg hover:bg-[#123B2A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#123B2A] text-[#C6A15B] shadow-xs border border-[#C6A15B]/30'
                    : 'text-[#E8DECB]/80 hover:text-white hover:bg-[#123B2A]/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-[#123B2A] bg-[#061912] space-y-3">
        {currentUser && (
          <div className="px-2 py-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
              ADMINISTRATOR
            </span>
            <span className="text-xs font-bold text-white block truncate">
              {currentUser.fullName || currentUser.email}
            </span>
            <span className="text-[11px] text-[#68756E] block truncate">
              {currentUser.email}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-[#123B2A]/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-red-100 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View Storefront"
            className="p-2 text-[#E8DECB]/80 hover:text-white hover:bg-[#123B2A] rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
