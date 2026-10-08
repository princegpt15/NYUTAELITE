// src/pages/Checkout.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Tag,
  X,
} from 'lucide-react';
import { cartService } from '../services/cart';
import { authService } from '../services/auth';
import { orderService } from '../services/orders';
import { paymentService } from '../services/payment';
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  trackAuthoritativePurchase,
} from '../services/analytics';
import type { CartItem, Address, Order, User, CouponValidationResult } from '../types';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  const [items, setItems] = useState<CartItem[]>(cartService.getItems());
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  const [formData, setFormData] = useState<Omit<Address, 'id' | 'userId' | 'createdAt'>>({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    landmark: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);

  // Coupon state (display-only preview; backend recalculates authoritatively on order creation)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Subscribe to auth state updates
  useEffect(() => {
    const handleAuth = (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || user.fullName || '',
          phone: prev.phone || user.phone || '',
        }));
      }
    };
    const unsubscribe = authService.subscribe(handleAuth);
    if (!currentUser && authService.getCurrentUser()) {
      handleAuth(authService.getCurrentUser());
    }
    return unsubscribe;
  }, [currentUser]);

  // Subscribe to cart updates
  useEffect(() => {
    return cartService.subscribe((cartItems) => {
      setItems(cartItems);
      setLoadingCart(false);
    });
  }, []);

  // Fetch saved addresses if authenticated
  const fetchedRef = React.useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    if (currentUser) {
      fetchedRef.current = true;
      orderService
        .getAddresses()
        .then((addrs) => {
          setAddresses(addrs);
          if (addrs.length > 0) {
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(def.id || 'new');
          }
        })
        .catch(() => {
          // Non-critical if addresses fail to load
        });
    }
  }, [currentUser]);

  const localSubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 499;
  const localShippingFee = localSubtotal >= freeShippingThreshold || localSubtotal === 0 ? 0 : 40;

  // Re-validate applied coupon if cart subtotal changes
  useEffect(() => {
    if (!appliedCoupon || !currentUser || items.length === 0) return;
    if (appliedCoupon.subtotal !== localSubtotal) {
      orderService
        .validateCoupon(appliedCoupon.couponCode)
        .then((res) => {
          setAppliedCoupon(res);
          setCouponError(null);
        })
        .catch((err: any) => {
          setAppliedCoupon(null);
          setCouponError(err?.message || 'Coupon is no longer valid for updated cart.');
        });
    }
  }, [localSubtotal, appliedCoupon, currentUser, items.length]);

  const subtotal = appliedCoupon ? appliedCoupon.subtotal : localSubtotal;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee = appliedCoupon ? appliedCoupon.shippingAmount : localShippingFee;
  const grandTotal = appliedCoupon
    ? appliedCoupon.totalAmount
    : Math.max(0, Number((subtotal - discountAmount + shippingFee).toFixed(2)));

  // Emit GA4 begin_checkout when entering checkout with items
  useEffect(() => {
    if (!loadingCart && items.length > 0 && !createdOrder) {
      trackBeginCheckout({
        items,
        value: grandTotal,
        couponCode: appliedCoupon?.couponCode ?? null,
      });
    }
  }, [loadingCart, items, grandTotal, appliedCoupon?.couponCode, createdOrder]);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setCouponError(null);

    const trimmed = couponInput.trim();
    if (!trimmed) {
      setCouponError('Coupon code is required.');
      return;
    }

    if (appliedCoupon) {
      setCouponError('Only one coupon can be applied per order.');
      return;
    }

    let activeUser = currentUser || authService.getCurrentUser();
    if (!activeUser) {
      activeUser = await authService.restoreSession();
      if (activeUser) setCurrentUser(activeUser);
    }

    if (!activeUser) {
      setCouponError('Please sign in to apply a coupon code.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const validated = await orderService.validateCoupon(trimmed);
      setAppliedCoupon(validated);
      setCouponInput(validated.couponCode);
      setCouponError(null);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.message || 'Unable to validate coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  const triggerRazorpayPayment = async (order: Order) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const cartSnapshot = [...items];
    try {
      const razorpayData = await paymentService.createPaymentOrder(order.id);

      // Track safe add_payment_info after payment gateway order is created on backend
      trackAddPaymentInfo({
        items: order.items && order.items.length > 0 ? order.items : cartSnapshot,
        value: order.totalAmount,
        paymentType: 'Razorpay',
        couponCode: order.couponCode || appliedCoupon?.couponCode || null,
      });

      await paymentService.openRazorpayModal({
        order,
        razorpayData,
        user: {
          fullName: formData.fullName || currentUser?.fullName,
          email: currentUser?.email,
          phone: formData.phone || currentUser?.phone,
        },
        onSuccess: async (verifyPayload) => {
          try {
            await paymentService.verifyPayment(verifyPayload);
            const confirmedOrder: Order = {
              ...order,
              status: 'CONFIRMED',
              paymentStatus: 'CAPTURED',
            };
            cartService.clearCart();
            setCreatedOrder(confirmedOrder);
            setPendingOrder(null);
            // Fire-and-forget authoritative backend-deduplicated GA4 purchase event
            void trackAuthoritativePurchase(confirmedOrder, cartSnapshot);
          } catch (err: any) {
            setErrorMessage(err?.message || 'Payment signature verification failed.');
            setPendingOrder(order);
          } finally {
            setIsSubmitting(false);
          }
        },
        onError: (err: any) => {
          setErrorMessage(err?.description || err?.message || 'Payment failed or was cancelled.');
          setPendingOrder(order);
          setIsSubmitting(false);
        },
        onDismiss: () => {
          setErrorMessage(
            'Payment window closed before completing. You can retry payment below or visit Order History.'
          );
          setPendingOrder(order);
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initialize payment gateway.');
      setPendingOrder(order);
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage(null);

    let activeUser = currentUser || authService.getCurrentUser();
    if (!activeUser) {
      activeUser = await authService.restoreSession();
      if (activeUser) {
        setCurrentUser(activeUser);
      }
    }

    if (!activeUser) {
      setErrorMessage('Please log in or register to place your order.');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      let payload: any;
      if (selectedAddressId !== 'new' && selectedAddressId) {
        payload = { addressId: selectedAddressId };
      } else {
        if (
          !formData.fullName ||
          !formData.phone ||
          !formData.addressLine1 ||
          !formData.city ||
          !formData.state ||
          !formData.postalCode
        ) {
          throw new Error('Please fill in all required address fields.');
        }
        payload = { address: formData };
      }

      if (appliedCoupon?.couponCode) {
        payload.couponCode = appliedCoupon.couponCode;
      }

      // 1. Create Internal Order in DB (PENDING)
      const order = await orderService.createOrder(payload);

      // Emit GA4 add_shipping_info only after shipping details are validated and accepted by backend
      trackAddShippingInfo({
        items: order.items && order.items.length > 0 ? order.items : items,
        value: order.totalAmount,
        shippingTier:
          (order.shippingAmount ?? 0) === 0 ? 'FREE Express Pan-India' : 'Express Pan-India',
        couponCode: order.couponCode || appliedCoupon?.couponCode || null,
      });

      // 2. Launch Razorpay payment flow
      await triggerRazorpayPayment(order);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  // SUCCESS / CONFIRMATION VIEW
  if (createdOrder) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] px-4 py-16">
        <div className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-[#E8DECB] shadow-md space-y-6">
          <div className="w-16 h-16 bg-[#123B2A] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-[#C6A15B]" />
          </div>

          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6A15B]">
              ORDER CONFIRMED
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#092218]">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-[#68756E]">
              Order Number:{' '}
              <span className="font-mono font-bold text-[#123B2A]">
                {createdOrder.orderNumber}
              </span>
            </p>
          </div>

          <div className="p-4 bg-[#F7F1E5] rounded-xl border border-[#E8DECB] space-y-2.5 text-xs">
            <div className="flex justify-between font-bold text-[#1C1C1C]">
              <span>Order Status:</span>
              <span className="bg-[#123B2A] text-white px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                {createdOrder.status}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[#1C1C1C]">
              <span>Payment Status:</span>
              <span className="text-[#123B2A]">{createdOrder.paymentStatus}</span>
            </div>
            <div className="flex justify-between text-[#68756E] border-t border-[#E8DECB] pt-2">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#1C1C1C]">₹{createdOrder.subtotal}</span>
            </div>
            {(createdOrder.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>
                  Coupon Discount{createdOrder.couponCode ? ` (${createdOrder.couponCode})` : ''}:
                </span>
                <span>-₹{createdOrder.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#68756E]">
              <span>Shipping:</span>
              <span className="font-semibold text-[#1C1C1C]">
                {(createdOrder.shippingAmount ?? 0) === 0 ? 'FREE' : `₹${createdOrder.shippingAmount}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[#1C1C1C] border-t border-[#E8DECB] pt-2">
              <span>Total Amount:</span>
              <span className="text-sm font-extrabold text-[#123B2A]">
                ₹{createdOrder.totalAmount}
              </span>
            </div>
          </div>

          {createdOrder.shippingAddress && (
            <div className="p-4 border border-[#E8DECB] rounded-xl space-y-1 text-xs text-[#68756E]">
              <span className="font-bold text-[#1C1C1C] block text-xs uppercase tracking-wider mb-1">
                Shipping Address
              </span>
              <p className="font-semibold text-[#1C1C1C]">
                {createdOrder.shippingAddress.fullName} ({createdOrder.shippingAddress.phone})
              </p>
              <p>
                {createdOrder.shippingAddress.addressLine1}
                {createdOrder.shippingAddress.addressLine2
                  ? `, ${createdOrder.shippingAddress.addressLine2}`
                  : ''}
              </p>
              <p>
                {createdOrder.shippingAddress.city}, {createdOrder.shippingAddress.state} -{' '}
                {createdOrder.shippingAddress.postalCode}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E8DECB]">
            <Link
              to="/orders"
              className="flex-1 text-center bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg transition-colors"
            >
              View Order History
            </Link>
            <Link
              to="/"
              className="flex-1 text-center border border-[#123B2A] text-[#123B2A] hover:bg-[#F7F1E5] text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadingCart) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-[#E8DECB] shadow-xs space-y-4">
          <p className="text-xs font-semibold text-[#68756E]">Loading checkout items...</p>
        </div>
      </div>
    );
  }

  // EMPTY CART VIEW
  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-[#E8DECB] shadow-xs space-y-4">
          <ShoppingBag className="w-12 h-12 text-[#68756E]/40 mx-auto" />
          <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">Your Cart is Empty</h1>
          <p className="text-xs text-[#68756E]">
            Add premium Bihar makhana packs to your cart before proceeding to checkout.
          </p>
          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-lg hover:bg-[#092218] transition-colors"
          >
            Browse Makhana Packs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#FCFAF5] py-10 sm:py-14">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Left Column: Shipping & Delivery Form */}
          <section className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6A15B]">
                STEP 1 OF 2
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#092218] mt-0.5">
                Shipping &amp; Delivery Details
              </h1>
            </div>

            {/* Auth Prompt Banner for Guests */}
            {!currentUser && (
              <div className="bg-[#F7F1E5] p-4 rounded-xl border border-[#C6A15B]/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#123B2A] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#123B2A]">Account Required for Order Checkout</p>
                  <p className="text-[#68756E]">
                    Please{' '}
                    <Link
                      to="/login?redirect=/checkout"
                      className="font-bold text-[#123B2A] underline"
                    >
                      sign in
                    </Link>{' '}
                    or{' '}
                    <Link
                      to="/register?redirect=/checkout"
                      className="font-bold text-[#123B2A] underline"
                    >
                      create an account
                    </Link>{' '}
                    to finalize your delivery details. Your items remain saved.
                  </p>
                </div>
              </div>
            )}

            {/* Saved Address Selector */}
            {currentUser && addresses.length > 0 && (
              <div className="space-y-3 pb-4 border-b border-[#E8DECB]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
                  Select Delivery Address:
                </label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 text-xs ${
                        selectedAddressId === addr.id
                          ? 'border-[#123B2A] bg-[#F7F1E5]/60 shadow-xs'
                          : 'border-[#E8DECB] bg-white hover:border-[#123B2A]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address_select"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id!)}
                        className="mt-0.5 text-[#123B2A] focus:ring-[#123B2A]"
                      />
                      <div className="space-y-0.5 text-[#1C1C1C]">
                        <span className="font-bold block">{addr.fullName}</span>
                        <span className="text-[#68756E] block truncate">{addr.addressLine1}</span>
                        <span className="text-[#68756E] block">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </span>
                        <span className="text-[#123B2A] font-semibold text-[11px] block">
                          Ph: {addr.phone}
                        </span>
                      </div>
                    </label>
                  ))}

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 text-xs ${
                      selectedAddressId === 'new'
                        ? 'border-[#123B2A] bg-[#F7F1E5]/60 shadow-xs'
                        : 'border-[#E8DECB] bg-white hover:border-[#123B2A]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address_select"
                      value="new"
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId('new')}
                      className="text-[#123B2A] focus:ring-[#123B2A]"
                    />
                    <div className="flex items-center gap-2 text-[#123B2A] font-bold">
                      <PlusCircle className="w-4 h-4 text-[#C6A15B]" />
                      <span>Deliver to New Address</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Address Input Form */}
            {selectedAddressId === 'new' && (
              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-3 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-3 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Street Address / House No. *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    placeholder="House/Flat No., Building Name, Street"
                    className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-3 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Apartment / Suite (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine2 || ''}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      placeholder="Floor, Unit, Wing"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-3 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.landmark || ''}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      placeholder="Near City Center / Park"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-3 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      State *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Pincode *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="Pincode"
                      className="w-full min-h-11 border border-[#E8DECB] rounded-lg px-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                </div>
              </form>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </section>

          {/* Right Column: Order Summary Sidebar */}
          <aside className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-xs space-y-5">
            <h2 className="font-serif text-2xl font-bold text-[#092218] pb-3 border-b border-[#E8DECB]">
              Order Summary
            </h2>

            {/* Item List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-[#E8DECB]/60">
              {items.map((item) => (
                <div key={item.productId} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-14 h-14 bg-[#F7F1E5] rounded-md object-contain p-1.5 border border-[#E8DECB] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#123B2A] text-white px-1.5 py-0.2 rounded">
                        {item.quality}
                      </span>
                      <span className="text-[11px] font-bold text-[#123B2A]">
                        {item.weightGrams}g
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-[#1C1C1C] truncate mt-0.5">
                      {item.productName}
                    </h3>
                    <p className="text-[11px] text-[#68756E]">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-[#123B2A]">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Area */}
            <div className="pt-4 border-t border-[#E8DECB] space-y-2.5">
              <label
                htmlFor="checkout-coupon-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C]"
              >
                Have a Coupon Code?
              </label>

              {appliedCoupon ? (
                <div
                  id="checkout-coupon-feedback"
                  role="status"
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div className="text-xs min-w-0">
                      <span className="font-mono font-extrabold text-emerald-900 block">
                        {appliedCoupon.couponCode} applied
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 block">
                        You saved ₹{appliedCoupon.discountAmount}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    aria-label={`Remove coupon ${appliedCoupon.couponCode}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-red-700 bg-white border border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex items-center gap-2">
                  <input
                    id="checkout-coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponError) setCouponError(null);
                    }}
                    placeholder="Enter coupon code"
                    aria-describedby={couponError ? 'checkout-coupon-error' : undefined}
                    aria-invalid={Boolean(couponError)}
                    disabled={validatingCoupon || isSubmitting}
                    className="flex-1 min-w-0 min-h-10 border border-[#E8DECB] rounded-lg px-3 text-xs font-mono uppercase text-[#1C1C1C] placeholder:font-sans placeholder:normal-case focus:outline-none focus:border-[#123B2A] focus:ring-2 focus:ring-[#123B2A]/20 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon || isSubmitting}
                    className="min-h-10 px-4 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#123B2A] disabled:opacity-60 shrink-0"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <p
                  id="checkout-coupon-error"
                  role="alert"
                  className="text-[11px] font-semibold text-red-600 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-[#E8DECB] space-y-2 text-xs text-[#68756E]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#1C1C1C]">₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    Discount{appliedCoupon?.couponCode ? ` (${appliedCoupon.couponCode})` : ''}
                  </span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Express Pan-India Delivery</span>
                <span className="font-bold text-[#1C1C1C]">
                  {shippingFee === 0 ? (
                    <span className="text-[#123B2A]">FREE</span>
                  ) : (
                    `₹${shippingFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#1C1C1C] pt-3 border-t border-[#E8DECB]">
                <span>Total Amount</span>
                <span className="text-[#123B2A] text-lg">₹{grandTotal}</span>
              </div>
            </div>

            {/* Place Order & Payment CTA */}
            {pendingOrder ? (
              <button
                type="button"
                onClick={() => triggerRazorpayPayment(pendingOrder)}
                disabled={isSubmitting}
                className="w-full min-h-12 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                {isSubmitting ? 'Processing Payment...' : `Retry Payment for Order #${pendingOrder.orderNumber}`}
              </button>
            ) : selectedAddressId === 'new' ? (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full min-h-12 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                {isSubmitting ? 'Opening Payment...' : 'Pay Securely with Razorpay'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full min-h-12 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                {isSubmitting ? 'Opening Payment...' : 'Pay Securely with Razorpay'}
              </button>
            )}

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-[#68756E] border-t border-[#E8DECB]">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>Express Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A]" />
                <span>Verified Freshness</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
