interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckout {
  open: () => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
}

interface Window {
  Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
}
