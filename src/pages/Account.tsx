// src/pages/Account.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Award,
  Share2,
  Package,
  ShoppingBag,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/auth';
import { retentionService, type AccountSummary, type LoyaltyTransactionItem } from '../services/retention';
import { trackLoyaltyView, trackReferralShare, trackBeginReorder } from '../services/analytics';
import { growthApi } from '../services/growth';

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Marketing Preferences
  const [marketingEmailOptIn, setMarketingEmailOptIn] = useState(true);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);
  const [preferenceMsg, setPreferenceMsg] = useState<string | null>(null);

  // Referral share copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Apply referral code
  const [referralInput, setReferralInput] = useState('');
  const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);

  // Loyalty ledger modal
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerItems, setLedgerItems] = useState<LoyaltyTransactionItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Reorder loading per order id
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderFeedback, setReorderFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/account');
      return;
    }

    loadSummary();
  }, [currentUser, navigate]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, pref] = await Promise.all([
        retentionService.getAccountSummary(),
        growthApi.getCustomerPreferences().catch(() => null),
      ]);
      setSummary(data);
      if (pref) {
        setMarketingEmailOptIn(pref.marketingEmailOptIn);
      }
      if (data?.retention?.loyaltyBalance !== undefined) {
        trackLoyaltyView(data.retention.loyaltyBalance);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMarketing = async (newVal: boolean) => {
    setUpdatingPreferences(true);
    setPreferenceMsg(null);
    try {
      const updated = await growthApi.updateCustomerPreferences({ marketingEmailOptIn: newVal });
      setMarketingEmailOptIn(updated.marketingEmailOptIn);
      setPreferenceMsg('Preferences saved successfully.');
      setTimeout(() => setPreferenceMsg(null), 3000);
    } catch (err: any) {
      setPreferenceMsg(err.message || 'Failed to update preferences');
    } finally {
      setUpdatingPreferences(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    trackReferralShare(code, 'clipboard_code');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    const link = `https://nutyaelite.com?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    trackReferralShare(code, 'clipboard_link');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralInput.trim()) return;

    setApplyingCode(true);
    setApplyMessage(null);
    try {
      const res = await retentionService.applyReferralCode(referralInput.trim());
      setApplyMessage({ type: 'success', text: res.message });
      setReferralInput('');
      await loadSummary();
    } catch (err: any) {
      setApplyMessage({ type: 'error', text: err?.message || 'Failed to apply referral code' });
    } finally {
      setApplyingCode(false);
    }
  };

  const handleOpenLedger = async () => {
    setShowLedger(true);
    setLoadingLedger(true);
    try {
      const res = await retentionService.getLoyaltyTransactions(1, 20);
      setLedgerItems(res.transactions);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleReorder = async (orderId: string, orderTotal: number) => {
    setReorderingId(orderId);
    setReorderFeedback(null);
    try {
      const res = await retentionService.reorder(orderId);
      trackBeginReorder(orderId, res.totalAdded, orderTotal);
      if (res.totalAdded > 0) {
        setReorderFeedback(`Added ${res.totalAdded} item(s) to your cart!`);
        setTimeout(() => {
          navigate('/cart');
        }, 800);
      } else {
        setReorderFeedback('None of the items from this order are currently available in stock.');
      }
    } catch (err: any) {
      setReorderFeedback(err?.message || 'Failed to reorder items');
    } finally {
      setReorderingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FCFAF5] min-h-screen py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C6A15B] animate-spin mx-auto" />
          <p className="text-sm text-[#68756E] font-medium">Loading your pantry account...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-[#FCFAF5] min-h-screen py-16">
        <div className="max-w-[700px] mx-auto px-5 text-center space-y-4">
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm">
            {error || 'Unable to load account information.'}
          </div>
          <button
            onClick={loadSummary}
            className="px-6 py-2.5 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { profile, retention, orders } = summary;

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-10 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DECB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/30 shrink-0">
              <User className="w-7 h-7 text-[#C6A15B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
                  MEMBER PROFILE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#123B2A] border border-emerald-200">
                  Elite Makhana Connoisseur
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-1">
                Welcome back, {profile.name}
              </h1>
              <p className="text-xs text-[#68756E] mt-0.5">
                {profile.email} {profile.phone ? `• ${profile.phone}` : ''} • Member since{' '}
                {new Date(profile.memberSince).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="px-4 py-2.5 rounded-lg border border-[#123B2A] text-[#123B2A] hover:bg-[#123B2A] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Order History
            </Link>
            <Link
              to="/#pantry"
              className="px-4 py-2.5 rounded-lg bg-[#123B2A] text-white hover:bg-[#092218] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              Shop Pantry
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {reorderFeedback && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
            <span>{reorderFeedback}</span>
            <button
              onClick={() => setReorderFeedback(null)}
              className="text-emerald-700 font-bold ml-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Retention Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Loyalty Points */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E]">
                  Elite Loyalty Balance
                </span>
                <Award className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#123B2A] font-serif">
                  {retention.loyaltyBalance}
                </span>
                <span className="text-xs font-bold text-[#C6A15B]">Points</span>
              </div>
              <p className="text-[11px] text-[#68756E]">
                Worth ₹{retention.loyaltyBalance} off your next order. (₹100 spent = 1 point)
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8DECB]/60 mt-3 flex items-center justify-between">
              <button
                onClick={handleOpenLedger}
                className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] inline-flex items-center gap-1 transition-colors"
              >
                <span>View Points History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Wishlist */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E]">
                  Saved Wishlist
                </span>
                <Heart className="w-5 h-5 text-rose-500 fill-rose-50" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#123B2A] font-serif">
                  {retention.wishlistCount}
                </span>
                <span className="text-xs font-bold text-[#68756E]">Items</span>
              </div>
              <p className="text-[11px] text-[#68756E]">
                Save packs for later and move to cart with real-time stock revalidation.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8DECB]/60 mt-3">
              <Link
                to="/wishlist"
                className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Wishlist</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Referral Program */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E]">
                  Your Referral Code
                </span>
                <Share2 className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-extrabold text-[#123B2A] tracking-wider bg-[#F7F1E5] px-2.5 py-1 rounded-md border border-[#E8DECB]">
                  {retention.referralCode}
                </span>
                <button
                  onClick={() => handleCopyCode(retention.referralCode)}
                  className="p-1.5 rounded-md hover:bg-[#F7F1E5] text-[#123B2A] transition-colors"
                  title="Copy Code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#68756E]">
                {retention.totalReferrals > 0
                  ? `${retention.totalReferrals} friends referred so far!`
                  : 'Share & earn 50 bonus points on their first completed order.'}
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8DECB]/60 mt-3">
              <button
                onClick={() => handleCopyLink(retention.referralCode)}
                className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] inline-flex items-center gap-1 transition-colors"
              >
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Orders Overview */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E]">
                  Pantry Orders
                </span>
                <Package className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#123B2A] font-serif">
                  {orders.total}
                </span>
                <span className="text-xs font-bold text-[#68756E]">Total</span>
                {orders.active > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ml-1">
                    {orders.active} in progress
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#68756E]">
                Bihar GI-tagged Fox Nut harvests freshly roasted and dispatched.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8DECB]/60 mt-3">
              <Link
                to="/orders"
                className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] inline-flex items-center gap-1 transition-colors"
              >
                <span>Track Shipments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Section: Recent Orders & Quick Buy Again */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DECB] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1C1C]">
                Recent Orders
              </h2>
              <p className="text-xs text-[#68756E]">
                Reorder your favorite Bihar makhana packs with one click.
              </p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.recent.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#68756E]/40 mx-auto" />
              <p className="text-xs text-[#68756E]">No orders placed yet.</p>
              <Link
                to="/#pantry"
                className="inline-block text-xs font-bold text-[#123B2A] underline hover:text-[#C6A15B]"
              >
                Explore fresh pantry offerings
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E8DECB]">
              {orders.recent.map((ord) => (
                <div
                  key={ord.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#1C1C1C]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB]">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#68756E]">
                      Placed on{' '}
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • Paid ₹{ord.totalAmount}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(ord.id, ord.totalAmount)}
                      disabled={reorderingId === ord.id}
                      className="px-4 py-2 rounded-lg bg-[#123B2A] text-white hover:bg-[#092218] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {reorderingId === ord.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Reordering...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Buy Again</span>
                        </>
                      )}
                    </button>
                    <Link
                      to="/orders"
                      className="px-3 py-2 rounded-lg border border-[#E8DECB] hover:bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Have a Friend's Referral Code? */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DECB] shadow-xs">
          <div className="max-w-md space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C6A15B] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Referral Invite
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1C1C1C]">
                Have a Friend's Referral Code?
              </h3>
              <p className="text-xs text-[#68756E]">
                Enter their code to link your account. Points will be awarded upon your first
                completed order.
              </p>
            </div>

            <form onSubmit={handleApplyReferral} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. NYUTA-ANIL8892"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 text-xs font-mono border border-[#E8DECB] rounded-lg focus:outline-none focus:border-[#123B2A]"
              />
              <button
                type="submit"
                disabled={applyingCode || !referralInput.trim()}
                className="px-4 py-2 bg-[#123B2A] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors disabled:opacity-50"
              >
                {applyingCode ? 'Applying...' : 'Apply'}
              </button>
            </form>

            {applyMessage && (
              <p
                className={`text-xs ${
                  applyMessage.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {applyMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Section: Communication & Marketing Preferences */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DECB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1C1C1C]">
                Communication & Privacy Preferences
              </h2>
              <p className="text-xs text-[#68756E]">
                Manage how NYUTA ELITE communicates special offers and seasonal harvest updates.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#FCFAF5] border border-[#E8DECB] rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#1C1C1C] block">
                Promotional & Harvest Update Emails
              </span>
              <p className="text-[11px] text-[#68756E]">
                Receive seasonal Mithila harvest alerts, exclusive discounts, and restock notifications.
                (Order receipts and shipping notifications are always sent).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={marketingEmailOptIn}
                disabled={updatingPreferences}
                onChange={(e) => handleToggleMarketing(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#123B2A]"></div>
            </label>
          </div>

          {preferenceMsg && (
            <p className="text-xs text-emerald-700 font-medium">{preferenceMsg}</p>
          )}
        </div>

        {/* Loyalty Ledger Modal */}
        {showLedger && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E8DECB] shadow-xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DECB]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1C1C1C]">
                    Loyalty Points Ledger
                  </h3>
                  <p className="text-xs text-[#68756E]">
                    Available Balance: {retention.loyaltyBalance} Points (₹{retention.loyaltyBalance})
                  </p>
                </div>
                <button
                  onClick={() => setShowLedger(false)}
                  className="text-[#68756E] hover:text-[#1C1C1C] text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loadingLedger ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 text-[#C6A15B] animate-spin mx-auto" />
                  </div>
                ) : ledgerItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#68756E]">
                    No loyalty points recorded yet. Points are awarded when orders are confirmed!
                  </div>
                ) : (
                  ledgerItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#1C1C1C] block">
                          {item.description}
                        </span>
                        <span className="text-[10px] text-[#68756E] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          item.points > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-[#E8DECB] text-right">
                <button
                  onClick={() => setShowLedger(false)}
                  className="px-4 py-2 bg-[#123B2A] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#092218]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
