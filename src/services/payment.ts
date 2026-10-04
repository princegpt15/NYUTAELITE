// src/services/payment.ts
import { api } from './api';
import type { Order } from '../types';


export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  providerPaymentId: string;
}

/**
 * Loads the external Razorpay Checkout SDK script dynamically.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const paymentService = {
  /**
   * Request backend to create a Razorpay order for an internal order.
   * Total amount is securely determined by the backend database record.
   */
  createPaymentOrder: async (orderId: string): Promise<RazorpayOrderResponse> => {
    const res = await api.post<{ success: boolean; data: RazorpayOrderResponse }>(
      '/payments/create-order',
      { orderId }
    );
    return res.data;
  },

  /**
   * Verify Razorpay cryptographic signature on backend.
   */
  verifyPayment: async (payload: VerifyPaymentPayload): Promise<PaymentVerificationResult> => {
    const res = await api.post<{ success: boolean; data: PaymentVerificationResult }>(
      '/payments/verify',
      payload
    );
    return res.data;
  },

  /**
   * Opens the Razorpay checkout modal with authoritative parameters.
   */
  openRazorpayModal: async (params: {
    order: Order;
    razorpayData: RazorpayOrderResponse;
    user?: { fullName?: string; email?: string; phone?: string };
    onSuccess: (paymentResult: VerifyPaymentPayload) => Promise<void> | void;
    onError: (err: any) => void;
    onDismiss?: () => void;
  }): Promise<void> => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    const { order, razorpayData, user, onSuccess, onError, onDismiss } = params;

    const options = {
      key: razorpayData.keyId,
      amount: razorpayData.amount, // in paise
      currency: razorpayData.currency || 'INR',
      name: 'NYUTA ELITE MAKHANA',
      description: `Order #${order.orderNumber}`,
      order_id: razorpayData.razorpayOrderId,
      prefill: {
        name: user?.fullName || order.shippingAddress?.fullName || '',
        email: user?.email || '',
        contact: user?.phone || order.shippingAddress?.phone || '',
      },
      theme: {
        color: '#123B2A',
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await onSuccess({
            orderId: order.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        } catch (err) {
          onError(err);
        }
      },
    };

    const RazorpayConstructor = window.Razorpay!;
    const rzp = new RazorpayConstructor(options);
    if (rzp.on) {
      rzp.on('payment.failed', (response: any) => {
        onError(response.error || new Error('Payment failed at gateway'));
      });
    }
    rzp.open();
  },
};
