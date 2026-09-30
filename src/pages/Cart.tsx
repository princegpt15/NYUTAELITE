import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowLeft, ShieldCheck, CheckCircle2, ShoppingBag } from 'lucide-react';
import { cartService } from '../services/cart';
import type { CartItem } from '../types';
export const Cart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(cartService.getItems());
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    const update = () => setItems(cartService.getItems());
    const unsub = cartService.subscribe(update);
    return () => unsub();
  }, []);

  const totals = cartService.getTotals();

  const handleQtyChange = (productId: string, newQty: number) => {
    cartService.updateQuantity(productId, Math.max(10, newQty));
    setItems(cartService.getItems());
  };

  const handleRemove = (productId: string) => {
    cartService.removeItem(productId);
    setItems(cartService.getItems());
  };

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleCheckout = async () => {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      setPaymentError('Payments are not configured yet. Please contact NYUTAELITE support.');
      return;
    }

    setIsPaying(true);
    setPaymentError('');

    try {
      const [razorpayLoaded, orderResponse] = await Promise.all([
        loadRazorpay(),
        fetch('/.netlify/functions/create-razorpay-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          }),
        }),
      ]);
      const order = await orderResponse.json();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Unable to load the secure payment window.');
      }
      if (!orderResponse.ok) {
        throw new Error(order.error || 'Unable to start payment.');
      }

      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'NYUTAELITE Foods',
        description: 'Bulk Makhana Order',
        order_id: order.orderId,
        handler: async (payment) => {
          try {
            const verificationResponse = await fetch('/.netlify/functions/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payment),
            });
            const verification = await verificationResponse.json();
            if (!verificationResponse.ok || !verification.verified) {
              throw new Error(verification.error || 'Payment verification failed.');
            }

            setCheckoutComplete(true);
            cartService.clearCart();
          } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Payment verification failed.');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
        theme: { color: '#00C950' },
      });
      checkout.open();
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to start payment.');
      setIsPaying(false);
    }
  };

  if (checkoutComplete) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#F7F2E8] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-[#E6DFD3] shadow-md space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#00C950]/15 text-[#00C950] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1C2520]">Wholesale Order Placed!</h2>
          <p className="text-sm text-[#5E6C65] leading-relaxed">
            Thank you for ordering with NYUTAELITE Foods. Your B2B proforma invoice and freight dispatch tracking have been generated.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/orders"
              className="w-full py-3 rounded-xl bg-[#173F35] text-white font-semibold text-sm hover:bg-[#112F28] transition-colors"
            >
              View Order History
            </Link>
            <Link
              to="/"
              className="w-full py-3 rounded-xl bg-[#F7F2E8] text-[#1C2520] font-semibold text-sm hover:bg-[#EBE4D5] border border-[#E6DFD3] transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#F7F2E8] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 text-center border border-[#E6DFD3] shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F7F2E8] text-[#5E6C65] mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1C2520]">Your Wholesale Cart is Empty</h2>
          <p className="text-sm text-[#5E6C65]">
            You have not added any bulk makhana packs to your cart yet.
          </p>
          <div className="pt-3">
            <Link
              to="/products/premium-makhana"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#00C950] hover:bg-[#00b347] text-white font-bold text-sm shadow-sm transition-all"
            >
              Browse Premium Makhana
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#F7F2E8] py-10 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
              PROCUREMENT SUMMARY
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C2520] tracking-tight mt-1">
              Wholesale Shopping Cart
            </h1>
          </div>
          <Link
            to="/products/premium-makhana"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#173F35] hover:text-[#00C950]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item: CartItem) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DFD3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F7F2E8] border border-[#E6DFD3] p-2 shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#00C950] uppercase tracking-wider">
                      {item.grade}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#1C2520]">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-[#5E6C65] mt-0.5">
                      Tier rate: <span className="font-bold text-[#173F35]">₹{item.pricePerKg}</span> / kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-[#F0EBE1]">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#E6DFD3] rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.productId, item.quantity - 5)}
                      disabled={item.quantity <= 10}
                      className="px-2.5 py-1.5 text-sm font-bold text-[#1C2520] hover:bg-neutral-100 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-[#1C2520] border-x border-[#E6DFD3] min-w-14 text-center">
                      {item.quantity} KG
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.productId, item.quantity + 5)}
                      className="px-2.5 py-1.5 text-sm font-bold text-[#1C2520] hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#173F35] block">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#5E6C65]">excl. GST</span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                    className="text-[#85948E] hover:text-red-500 p-1.5 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="sm:hidden pt-2">
              <Link
                to="/products/premium-makhana"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173F35]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* RIGHT: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD3] shadow-md space-y-5">
              <h2 className="text-lg font-bold text-[#1C2520] pb-3 border-b border-[#E6DFD3]">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#5E6C65]">
                  <span>Total Volume</span>
                  <span className="font-semibold text-[#1C2520]">{totals.totalKg} KG</span>
                </div>
                <div className="flex justify-between text-[#5E6C65]">
                  <span>Taxable Subtotal</span>
                  <span className="font-semibold text-[#1C2520]">
                    ₹{totals.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#5E6C65]">
                  <span>GST (5% HSN 1904)</span>
                  <span className="font-semibold text-[#1C2520]">
                    ₹{totals.gst.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#5E6C65]">
                  <span>Freight Delivery</span>
                  <span className="font-semibold text-[#1C2520]">
                    {totals.shipping === 0 ? (
                      <span className="text-[#00C950] font-bold">FREE (50 KG+)</span>
                    ) : (
                      `₹${totals.shipping}`
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DFD3] flex items-baseline justify-between">
                <div>
                  <span className="text-base font-extrabold text-[#1C2520] block">
                    Estimated Total
                  </span>
                  <span className="text-[11px] text-[#5E6C65]">Includes taxes & freight</span>
                </div>
                <span className="text-2xl font-black text-[#173F35]">
                  ₹{totals.total.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isPaying}
                className="w-full py-4 rounded-xl bg-[#00C950] hover:bg-[#00b347] disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-sm transition-all cursor-pointer"
              >
                {isPaying ? 'Opening Secure Payment...' : 'Pay Securely with Razorpay'}
              </button>

              {paymentError && <p className="text-center text-xs text-red-600">{paymentError}</p>}

              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#5E6C65]">
                <ShieldCheck className="w-4 h-4 text-[#00C950]" />
                <span>100% Tax Deductible B2B GST Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
