// backend/src/services/notification/notification.types.ts
import type {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ShippingStatus,
} from '@prisma/client';

export interface NotificationOrderItemSnapshot {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface NotificationAddressSnapshot {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  landmark?: string;
}

export interface OrderNotificationContext {
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  items: NotificationOrderItemSnapshot[];
  shippingAddress: NotificationAddressSnapshot | null;
  paymentReference?: string | null;
  refundAmount?: number | null;
  refundReference?: string | null;
  refundReason?: string | null;
}

export interface RenderedNotificationTemplate {
  subject: string;
  html: string;
  text: string;
  whatsappText: string;
}

export interface ProviderSendRequest {
  notificationId: string;
  orderId: string;
  orderNumber: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  html?: string;
  text: string;
}

export interface ProviderDeliveryResult {
  success: boolean;
  retryable: boolean;
  provider: string;
  providerMessageId: string | null;
  errorCode: string | null;
  message: string | null;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  readonly providerName: string;
  isEnabled(): boolean;
  send(request: ProviderSendRequest): Promise<ProviderDeliveryResult>;
}

export interface TriggerNotificationOptions {
  orderId: string;
  type: NotificationType;
  channels?: NotificationChannel[];
  idempotencySuffix?: string;
  refundAmount?: number;
  refundReference?: string;
  refundReason?: string;
  paymentReference?: string;
}

/**
 * Mask email or phone recipient for structured logs so full PII is not written to stdout.
 */
export function maskRecipient(recipient: string): string {
  if (!recipient) return '***';
  const trimmed = recipient.trim();
  if (trimmed.includes('@')) {
    const [local, domain] = trimmed.split('@');
    if (!local || !domain) return '***@***';
    const visible = local.length <= 2 ? local[0] || '*' : local.slice(0, 2);
    return `${visible}***@${domain}`;
  }
  if (trimmed.length <= 4) return '****';
  return `***${trimmed.slice(-4)}`;
}

/**
 * Structured, privacy-safe notification logger.
 * Never logs credentials, tokens, passwords, or unmasked PII.
 */
export function logNotificationEvent(
  event: 'notification.created' | 'notification.sent' | 'notification.failed' | 'notification.retry' | 'notification.skipped',
  meta: {
    notificationId?: string;
    orderId: string;
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    status?: NotificationStatus;
    attempt?: number;
    recipient?: string;
    provider?: string;
    providerMessageId?: string | null;
    reason?: string | null;
  }
): void {
  const safePayload = {
    timestamp: new Date().toISOString(),
    event,
    notificationId: meta.notificationId ?? null,
    orderId: meta.orderId,
    userId: meta.userId,
    type: meta.type,
    channel: meta.channel,
    status: meta.status ?? null,
    attempt: meta.attempt ?? 0,
    recipient: meta.recipient ? maskRecipient(meta.recipient) : undefined,
    provider: meta.provider ?? null,
    providerMessageId: meta.providerMessageId ?? null,
    reason: meta.reason ?? null,
  };
  console.info(JSON.stringify(safePayload));
}
